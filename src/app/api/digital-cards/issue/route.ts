import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth/server";
import { bindIssuerName, validateCardClaims } from "@/lib/digital-card-claims";
import { createQrCredential, parseFutureExpiry } from "@/lib/card-credentials";
import { getCardType } from "@/lib/card-types/registry";
import { withAuthenticatedDb } from "@/lib/db";
import { readJsonBodyLimited } from "@/lib/http-json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store, max-age=0", Pragma: "no-cache" };
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;
const jsonError = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status, headers: NO_STORE });

/**
 * Generic issuance is deliberately fail-closed. It needs the migration, restricted
 * runtime DB role, configured auth, a secret for hashed rate-limit buckets, and
 * an explicit release toggle. GitHub Pages does not execute this route.
 */
export async function POST(request: Request) {
  if (process.env.DIGITAL_CARD_LIFECYCLE_API_ENABLED !== "true") {
    return jsonError("Penerbitan kartu digital belum diaktifkan pada lingkungan ini", 503);
  }
  const rateLimitSecret = process.env.DIGITAL_CARD_RATE_LIMIT_SECRET?.trim();
  if (!rateLimitSecret || rateLimitSecret.length < 32) {
    return jsonError("Konfigurasi pengaman penerbitan belum lengkap", 503);
  }

  try {
    const session = await getAuth().getSession();
    const authSubject = (session.data?.user as { id?: string } | undefined)?.id;
    if (!authSubject) return jsonError("Unauthorized", 401);

    const parsed = await readJsonBodyLimited(request, 12_288);
    if (!parsed.ok) return jsonError(parsed.message, parsed.status);
    if (!parsed.value || typeof parsed.value !== "object" || Array.isArray(parsed.value)) {
      return jsonError("Data penerbitan tidak valid", 400);
    }

    const input = parsed.value as Record<string, unknown>;
    const issuerId = typeof input.issuerId === "string" ? input.issuerId.trim() : "";
    const cardTypeId = typeof input.cardTypeId === "string" ? input.cardTypeId.trim() : "";
    const subjectRef = typeof input.subjectRef === "string" ? input.subjectRef.trim() : "";
    if (!UUID_PATTERN.test(issuerId)) return jsonError("issuerId tidak valid", 400);
    if (!/^[a-z][a-z0-9_]{2,47}$/.test(cardTypeId)) return jsonError("cardTypeId tidak valid", 400);
    if (!subjectRef || subjectRef.length > 160 || CONTROL_CHARS.test(subjectRef)) {
      return jsonError("subjectRef wajib diisi dan harus berupa referensi internal, bukan data identitas langsung", 400);
    }

    const cardType = getCardType(cardTypeId);
    if (!cardType) return jsonError("Jenis kartu tidak dikenal", 400);
    if (cardType.moduleStatus !== "available_for_design") {
      return jsonError("Jenis kartu ini masih prototipe dan belum boleh diterbitkan", 403);
    }
    const expiry = parseFutureExpiry(input.expiresAt);
    if (expiry === undefined) return jsonError("expiresAt harus berupa waktu ISO bertimezone yang masih berlaku", 400);

    const initialClaims = validateCardClaims(cardTypeId, input.publicClaims, input.privateClaims);
    if (!initialClaims.ok) return jsonError(initialClaims.errors.join(" "), 400);

    const { token, tokenHash } = createQrCredential();
    const cardNumber = "DCO-" + randomBytes(8).toString("hex").toUpperCase();
    const bucketHash = createHash("sha256")
      .update(rateLimitSecret, "utf8")
      .update(":issue:")
      .update(issuerId)
      .update(":")
      .update(authSubject)
      .digest("hex");
    const requestId = request.headers.get("x-request-id")?.slice(0, 100) ?? null;

    const issued = await withAuthenticatedDb(authSubject, async (client) => {
      const actorResult = await client.query<{ id: string }>(
        "SELECT id FROM public.app_users WHERE auth_subject = $1 AND status = 'active' LIMIT 1",
        [authSubject],
      );
      const actor = actorResult.rows[0];
      if (!actor) return { kind: "forbidden" as const };

      const issuerResult = await client.query<{ id: string; display_name: string; status: string }>(
        "SELECT id, display_name, status FROM public.digital_card_issuers WHERE id = $1 LIMIT 1",
        [issuerId],
      );
      const issuer = issuerResult.rows[0];
      if (!issuer || issuer.status !== "active") return { kind: "issuer_missing" as const };

      const membership = await client.query(
        "SELECT 1 FROM public.digital_card_issuer_memberships WHERE issuer_id = $1 AND user_id = $2 AND status = 'active' AND role = ANY($3::text[]) LIMIT 1",
        [issuerId, actor.id, ["issuer_admin", "operator"]],
      );
      if (membership.rowCount !== 1) return { kind: "forbidden" as const };

      const rate = await client.query<{ allowed: boolean }>(
        "SELECT public.consume_digital_card_rate_limit($1, 3600, 30) AS allowed",
        [bucketHash],
      );
      if (!rate.rows[0]?.allowed) return { kind: "rate_limited" as const };

      const claims = bindIssuerName(cardType, initialClaims, issuer.display_name);
      if (!claims.ok) return { kind: "invalid_claims" as const };

      const inserted = await client.query<{ id: string; issued_at: Date; expires_at: Date | null }>(
        "INSERT INTO public.digital_cards (issuer_id, card_type_id, card_number, subject_ref, public_claims, private_claims, credential_hash, status, issued_at, expires_at) VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, 'active', statement_timestamp(), $8) RETURNING id, issued_at, expires_at",
        [issuerId, cardTypeId, cardNumber, subjectRef, JSON.stringify(claims.publicClaims), JSON.stringify(claims.privateClaims), tokenHash, expiry],
      );
      const card = inserted.rows[0];
      await client.query(
        "INSERT INTO public.digital_card_audit_events (issuer_id, actor_user_id, action, entity_type, entity_id, request_id, metadata) VALUES ($1, $2, 'digital_card.issued', 'digital_card', $3, $4, $5::jsonb)",
        [issuerId, actor.id, card.id, requestId, JSON.stringify({ cardTypeId, source: "digital_card_lifecycle_api", credentialStoredAs: "sha256_hash" })],
      );
      return { kind: "issued" as const, card };
    });

    if (issued.kind === "forbidden") return jsonError("Akses penerbit ditolak", 403);
    if (issued.kind === "issuer_missing") return jsonError("Penerbit tidak ditemukan atau tidak aktif", 404);
    if (issued.kind === "rate_limited") return jsonError("Batas penerbitan tercapai; coba lagi setelah jendela pembatasan berakhir", 429);
    if (issued.kind === "invalid_claims") return jsonError("Klaim kartu tidak valid", 400);

    return NextResponse.json({
      card: {
        id: issued.card.id,
        cardNumber,
        cardTypeId,
        issuerId,
        status: "active",
        issuedAt: issued.card.issued_at,
        expiresAt: issued.card.expires_at,
      },
      qrToken: token,
      warning: "Token QR hanya ditampilkan sekali. Simpan secara aman; token mentah tidak disimpan di database atau audit log.",
    }, { status: 201, headers: NO_STORE });
  } catch (error) {
    if ((error as { code?: string })?.code === "23505") return jsonError("Nomor kartu bentrok; ulangi penerbitan", 409);
    return jsonError("Layanan penerbitan kartu digital sementara tidak tersedia", 503);
  }
}
