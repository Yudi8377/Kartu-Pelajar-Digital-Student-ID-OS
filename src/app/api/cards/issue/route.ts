import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth/server";
import { createQrCredential, parseFutureExpiry } from "@/lib/card-credentials";
import { withAuthenticatedDb } from "@/lib/db";
import { readJsonBodyLimited } from "@/lib/http-json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store, max-age=0", Pragma: "no-cache" };
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const jsonError = (message: string, status: number) => NextResponse.json({ error: message }, { status, headers: NO_STORE });

/**
 * Issues a single student card. Disabled by default until a hosted backend,
 * shared rate limiting, database role, and release checks are verified.
 */
export async function POST(request: Request) {
  if (process.env.CARD_LIFECYCLE_API_ENABLED !== "true") {
    return jsonError("Penerbitan kartu belum diaktifkan pada lingkungan ini", 503);
  }

  try {
    const session = await getAuth().getSession();
    const authSubject = (session.data?.user as { id?: string } | undefined)?.id;
    if (!authSubject) return jsonError("Unauthorized", 401);

    const parsed = await readJsonBodyLimited(request, 4_096);
    if (!parsed.ok) return jsonError(parsed.message, parsed.status);
    if (!parsed.value || typeof parsed.value !== "object" || Array.isArray(parsed.value)) {
      return jsonError("Data penerbitan tidak valid", 400);
    }

    const input = parsed.value as Record<string, unknown>;
    const schoolId = typeof input.schoolId === "string" ? input.schoolId.trim() : "";
    const studentId = typeof input.studentId === "string" ? input.studentId.trim() : "";
    if (!UUID_PATTERN.test(schoolId) || !UUID_PATTERN.test(studentId)) {
      return jsonError("schoolId atau studentId tidak valid", 400);
    }
    const expiresAt = parseFutureExpiry(input.expiresAt);
    if (expiresAt === undefined) return jsonError("expiresAt harus berupa waktu ISO bertimezone yang masih berlaku", 400);

    const { token, tokenHash } = createQrCredential();
    const cardNumber = `DCO-${randomBytes(6).toString("hex").toUpperCase()}`;

    const issued = await withAuthenticatedDb(authSubject, async (client) => {
      const actorResult = await client.query<{ id: string }>(
        "SELECT id FROM public.app_users WHERE auth_subject = $1 AND status = 'active' LIMIT 1",
        [authSubject],
      );
      const actor = actorResult.rows[0];
      if (!actor) return { kind: "forbidden" as const };

      const membership = await client.query(
        "SELECT 1 FROM public.school_memberships WHERE school_id = $1 AND user_id = $2 AND status = 'active' AND role = ANY($3::text[]) LIMIT 1",
        [schoolId, actor.id, ["school_admin", "operator"]],
      );
      if (membership.rowCount !== 1) return { kind: "forbidden" as const };

      const student = await client.query(
        "SELECT id FROM public.students WHERE id = $1 AND school_id = $2 AND status = 'active' FOR SHARE",
        [studentId, schoolId],
      );
      if (student.rowCount !== 1) return { kind: "student_missing" as const };

      const cardResult = await client.query<{ id: string; issued_at: Date; expires_at: Date | null }>(
        "INSERT INTO public.student_cards (school_id, student_id, card_number, status, qr_token_hash, issued_at, expires_at) VALUES ($1, $2, $3, 'active', $4, statement_timestamp(), $5) RETURNING id, issued_at, expires_at",
        [schoolId, studentId, cardNumber, tokenHash, expiresAt],
      );
      const card = cardResult.rows[0];
      await client.query(
        "INSERT INTO public.audit_events (school_id, actor_user_id, action, entity_type, entity_id, metadata) VALUES ($1, $2, 'card.issued', 'student_card', $3, $4::jsonb)",
        [schoolId, actor.id, card.id, JSON.stringify({ source: "card_lifecycle_api", tokenStorage: "sha256_hash_only" })],
      );
      return { kind: "issued" as const, card };
    });

    if (issued.kind === "forbidden") return jsonError("Akses sekolah ditolak", 403);
    if (issued.kind === "student_missing") return jsonError("Siswa tidak ditemukan atau tidak aktif", 404);

    // The raw QR token is returned once and is never written to the database or audit log.
    return NextResponse.json({
      card: { id: issued.card.id, cardNumber, status: "active", issuedAt: issued.card.issued_at, expiresAt: issued.card.expires_at },
      qrToken: token,
      warning: "Simpan QR hanya pada alur penerbitan yang aman. Token tidak dapat ditampilkan kembali.",
    }, { status: 201, headers: NO_STORE });
  } catch (error) {
    if ((error as { code?: string })?.code === "23505") return jsonError("Nomor kartu bentrok; ulangi penerbitan", 409);
    return jsonError("Layanan penerbitan kartu sementara tidak tersedia", 503);
  }
}
