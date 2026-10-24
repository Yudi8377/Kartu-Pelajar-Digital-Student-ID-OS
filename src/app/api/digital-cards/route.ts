import { createHash } from "node:crypto";
import { createQrCredential, parseFutureExpiry } from "@/lib/card-credentials";
import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth/server";
import { withAuthenticatedDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "no-store, max-age=0", Pragma: "no-cache" };
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CARD_TYPES = new Set([
  "student_id", "project_identity", "digital_name_card", "event_participant",
  "organization_membership", "achievement_certificate", "hajj_umrah_service",
]);

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: NO_STORE });
}

async function readLimitedBody(request: Request, maxBytes: number): Promise<string | null> {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

async function getAuthSubject(): Promise<string | null> {
  const session = await getAuth().getSession();
  const user = session.data?.user as { id?: string } | undefined;
  return user?.id ?? null;
}

/** List credentials for an explicitly authorized issuer. Never return credential hashes or private claims. */
export async function GET(request: Request) {
  const issuerId = new URL(request.url).searchParams.get("issuerId")?.trim() ?? "";
  if (!UUID_PATTERN.test(issuerId)) return jsonError("issuerId tidak valid", 400);
  try {
    const authSubject = await getAuthSubject();
    if (!authSubject) return jsonError("Unauthorized", 401);
    const cards = await withAuthenticatedDb(authSubject, async (client) => {
      const membership = await client.query(
        "SELECT 1 FROM public.digital_card_issuer_memberships im JOIN public.app_users au ON au.id = im.user_id JOIN public.digital_card_issuers di ON di.id = im.issuer_id WHERE im.issuer_id = $1 AND au.auth_subject = $2 AND au.status = 'active' AND im.status = 'active' AND di.status = 'active' AND im.role = ANY($3::text[]) LIMIT 1",
        [issuerId, authSubject, ["issuer_admin", "operator"]],
      );
      if (membership.rowCount !== 1) return null;
      const result = await client.query<{
        id: string; card_number: string; card_type_id: string; status: string;
        issued_at: Date | null; expires_at: Date | null; created_at: Date; revoked_at: Date | null;
      }>(
        "SELECT id, card_number, card_type_id, status, issued_at, expires_at, created_at, revoked_at FROM public.digital_cards WHERE issuer_id = $1 ORDER BY created_at DESC LIMIT 200",
        [issuerId],
      );
      return result.rows;
    });
    if (cards === null) return jsonError("Akses penerbit ditolak", 403);
    return NextResponse.json({ cards }, { headers: NO_STORE });
  } catch {
    return jsonError("Layanan daftar kredensial sementara tidak tersedia", 503);
  }
}

/**
 * Create and issue a credential. The opaque QR token is returned once; only its SHA-256
 * hash is persisted. Public verification remains disabled until its trusted edge/rate-limit
 * configuration has been deployed and tested.
 */
export async function POST(request: Request) {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.includes("application/json")) return jsonError("Content-Type harus application/json", 415);

  let raw: string | null;
  try {
    raw = await readLimitedBody(request, 8_192);
  } catch {
    return jsonError("JSON tidak valid", 400);
  }
  if (raw === null) return jsonError("Ukuran permintaan terlalu besar", 413);

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return jsonError("JSON tidak valid", 400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) return jsonError("Data kartu tidak valid", 400);

  const input = body as Record<string, unknown>;
  const issuerId = typeof input.issuerId === "string" ? input.issuerId.trim() : "";
  const cardNumber = typeof input.cardNumber === "string" ? input.cardNumber.trim() : "";
  const cardTypeId = typeof input.cardTypeId === "string" ? input.cardTypeId.trim() : "";
  const subjectRef = typeof input.subjectRef === "string" ? input.subjectRef.trim() : "";
  const expiresAtRaw = input.expiresAt == null || input.expiresAt === "" ? null : input.expiresAt;

  if (!UUID_PATTERN.test(issuerId)) return jsonError("issuerId tidak valid", 400);
  if (cardNumber.length < 3 || cardNumber.length > 100 || /[\u0000-\u001f\u007f]/.test(cardNumber)) return jsonError("Nomor kartu tidak valid", 400);
  if (!CARD_TYPES.has(cardTypeId)) return jsonError("Jenis kartu tidak didukung", 400);
  if (subjectRef.length < 1 || subjectRef.length > 160 || /[\u0000-\u001f\u007f]/.test(subjectRef)) return jsonError("Referensi subjek tidak valid", 400);
  if (expiresAtRaw !== null && typeof expiresAtRaw !== "string") return jsonError("Tanggal kedaluwarsa tidak valid", 400);
  const expiresAt = parseFutureExpiry(expiresAtRaw);
  if (expiresAt === undefined) return jsonError("Tanggal kedaluwarsa harus berupa waktu ISO dengan zona waktu dan berada di masa depan", 400);

  try {
    const authSubject = await getAuthSubject();
    if (!authSubject) return jsonError("Unauthorized", 401);

    const credential = createQrCredential();
    const rawToken = credential.token;
    const tokenHash = credential.tokenHash;
    const rateBucket = createHash("sha256").update("issue:" + authSubject + ":" + issuerId, "utf8").digest("hex");

    const card = await withAuthenticatedDb(authSubject, async (client) => {
      const rate = await client.query<{ allowed: boolean }>(
        "SELECT public.consume_digital_card_rate_limit($1, $2, $3) AS allowed",
        [rateBucket, 60, 10],
      );
      if (rate.rows[0]?.allowed !== true) return { kind: "rate_limited" as const };

      const membership = await client.query<{ user_id: string }>(
        "SELECT im.user_id FROM public.digital_card_issuer_memberships im JOIN public.app_users au ON au.id = im.user_id JOIN public.digital_card_issuers di ON di.id = im.issuer_id WHERE im.issuer_id = $1 AND au.auth_subject = $2 AND au.status = 'active' AND im.status = 'active' AND di.status = 'active' AND im.role = ANY($3::text[]) LIMIT 1",
        [issuerId, authSubject, ["issuer_admin", "operator"]],
      );
      const actor = membership.rows[0];
      if (!actor) return { kind: "forbidden" as const };

      const result = await client.query<{ id: string; card_number: string; card_type_id: string; status: string; issued_at: Date; expires_at: Date | null }>(
        "INSERT INTO public.digital_cards (issuer_id, card_type_id, card_number, subject_ref, credential_hash, status, issued_at, expires_at) VALUES ($1, $2, $3, $4, $5, 'active', now(), $6) RETURNING id, card_number, card_type_id, status, issued_at, expires_at",
        [issuerId, cardTypeId, cardNumber, subjectRef, tokenHash, expiresAt],
      );
      const created = result.rows[0];
      await client.query(
        "INSERT INTO public.digital_card_audit_events (issuer_id, actor_user_id, action, entity_type, entity_id, metadata) VALUES ($1, $2, 'credential_issued', 'digital_card', $3, $4::jsonb)",
        [issuerId, actor.user_id, created.id, JSON.stringify({ cardTypeId, tokenReturnedOnce: true })],
      );
      return { kind: "created" as const, card: created };
    });

    if (card.kind === "rate_limited") return jsonError("Terlalu banyak permintaan. Coba lagi nanti.", 429);
    if (card.kind === "forbidden") return jsonError("Akses penerbit ditolak", 403);
    return NextResponse.json(
      { card: card.card, credential: { token: rawToken, format: "opaque-sha256-backed" }, warning: "Simpan token ini dengan aman. Token tidak dapat ditampilkan kembali." },
      { status: 201, headers: NO_STORE },
    );
  } catch {
    return jsonError("Penerbitan kartu sementara tidak tersedia", 503);
  }
}
