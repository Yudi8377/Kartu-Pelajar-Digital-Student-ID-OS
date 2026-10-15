import { createHash, randomBytes, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth/server";
import { withAuthTransaction } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

/**
 * Issues or rotates a student card. The opaque QR token is returned once and
 * only its SHA-256 hash is stored in PostgreSQL. No student details go in QR.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ studentId: string }> },
) {
  try {
    const { data: session, error } = await getAuth().getSession();
    const authSubject = session?.user?.id ? String(session.user.id) : "";
    if (error || !authSubject) return errorResponse("Autentikasi diperlukan.", 401);

    const { studentId } = await context.params;
    if (!UUID_PATTERN.test(studentId)) return errorResponse("ID siswa tidak valid.", 400);

    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return errorResponse("Isi permintaan tidak valid.", 400);
    }
    const schoolId = (body as Record<string, unknown>).school_id;
    if (typeof schoolId !== "string" || !UUID_PATTERN.test(schoolId)) {
      return errorResponse("school_id tidak valid.", 400);
    }

    const rawToken = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(rawToken, "utf8").digest();
    const cardNumber = `KPD-${new Date().getUTCFullYear()}-${randomBytes(5).toString("hex").toUpperCase()}`;
    const requestId = randomUUID();

    const result = await withAuthTransaction(authSubject, async (client) => {
      const actor = await client.query<{ id: string }>(
        `SELECT id FROM public.app_users
         WHERE auth_subject = $1 AND status = 'active'
         LIMIT 1`,
        [authSubject],
      );
      if (!actor.rows[0]) return { missingProfile: true as const };

      const student = await client.query<{ id: string }>(
        `SELECT id FROM public.students
         WHERE id = $1 AND school_id = $2 AND status = 'active'
         LIMIT 1`,
        [studentId, schoolId],
      );
      if (!student.rows[0]) return { missingStudent: true as const };

      await client.query(
        `UPDATE public.student_cards
         SET status = 'replaced', revoked_at = statement_timestamp()
         WHERE school_id = $1 AND student_id = $2 AND status = 'active'`,
        [schoolId, studentId],
      );

      const card = await client.query<{
        id: string;
        card_number: string;
        status: string;
        issued_at: string;
        expires_at: string;
      }>(
        `INSERT INTO public.student_cards
          (school_id, student_id, card_number, status, qr_token_hash, issued_at, expires_at)
         VALUES ($1, $2, $3, 'active', $4, statement_timestamp(),
                 statement_timestamp() + interval '1 year')
         RETURNING id, card_number, status, issued_at, expires_at`,
        [schoolId, studentId, cardNumber, tokenHash],
      );

      await client.query(
        `INSERT INTO public.audit_events
          (school_id, actor_user_id, action, entity_type, entity_id, request_id)
         VALUES ($1, $2, 'student_card.issued_or_rotated', 'student_card', $3, $4)`,
        [schoolId, actor.rows[0].id, card.rows[0].id, requestId],
      );

      return { missingProfile: false as const, missingStudent: false as const, card: card.rows[0] };
    });

    if (result.missingProfile) return errorResponse("Profil pengguna belum disiapkan.", 409);
    if (result.missingStudent) return errorResponse("Siswa tidak ditemukan atau tidak dapat diakses.", 404);

    return NextResponse.json(
      {
        card: result.card,
        qrToken: rawToken,
        warning: "Simpan token ini ke QR secara aman. Token mentah tidak dapat diambil kembali; rotasi kartu untuk membuat token baru.",
      },
      { status: 201, headers: { "Cache-Control": "no-store", Pragma: "no-cache" } },
    );
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "42501") {
      return errorResponse("Akun tidak memiliki izin untuk sekolah ini.", 403);
    }
    if (error && typeof error === "object" && "code" in error && error.code === "23505") {
      return errorResponse("Konflik nomor kartu. Coba terbitkan ulang.", 409);
    }
    return errorResponse("Kartu belum dapat diterbitkan. Periksa hak akses dan konfigurasi layanan.", 503);
  }
}
