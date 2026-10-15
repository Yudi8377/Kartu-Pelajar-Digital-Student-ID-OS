import { randomUUID } from "node:crypto";
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

async function getAuthSubject() {
  const { data: session, error } = await getAuth().getSession();
  if (error || !session?.user?.id) return null;
  return String(session.user.id);
}

export async function GET(request: NextRequest) {
  try {
    const authSubject = await getAuthSubject();
    if (!authSubject) return errorResponse("Autentikasi diperlukan.", 401);

    const schoolId = request.nextUrl.searchParams.get("school_id");
    if (!schoolId || !UUID_PATTERN.test(schoolId)) {
      return errorResponse("Parameter school_id wajib berupa UUID yang valid.", 400);
    }

    const students = await withAuthTransaction(authSubject, async (client) => {
      return client.query<{
        id: string;
        student_number: string;
        full_name: string;
        class_label: string | null;
        status: string;
        created_at: string;
      }>(
        `SELECT id, student_number, full_name, class_label, status, created_at
         FROM public.students
         WHERE school_id = $1
         ORDER BY full_name
         LIMIT 200`,
        [schoolId],
      );
    });

    return NextResponse.json(
      { students: students.rows },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return errorResponse("Data siswa belum dapat dimuat. Periksa konfigurasi layanan.", 503);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authSubject = await getAuthSubject();
    if (!authSubject) return errorResponse("Autentikasi diperlukan.", 401);

    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return errorResponse("Isi permintaan tidak valid.", 400);
    }

    const payload = body as Record<string, unknown>;
    const schoolId = typeof payload.school_id === "string" ? payload.school_id : "";
    const studentNumber = typeof payload.student_number === "string" ? payload.student_number.trim() : "";
    const fullName = typeof payload.full_name === "string" ? payload.full_name.trim() : "";
    const classLabel = typeof payload.class_label === "string" ? payload.class_label.trim() : null;

    if (!UUID_PATTERN.test(schoolId)) return errorResponse("school_id tidak valid.", 400);
    if (studentNumber.length < 1 || studentNumber.length > 80) {
      return errorResponse("Nomor siswa wajib diisi (maksimal 80 karakter).", 400);
    }
    if (fullName.length < 2 || fullName.length > 200) {
      return errorResponse("Nama siswa wajib 2–200 karakter.", 400);
    }
    if (classLabel !== null && classLabel.length > 120) {
      return errorResponse("Label kelas maksimal 120 karakter.", 400);
    }

    const created = await withAuthTransaction(authSubject, async (client) => {
      const actor = await client.query<{ id: string }>(
        `SELECT id FROM public.app_users
         WHERE auth_subject = $1 AND status = 'active'
         LIMIT 1`,
        [authSubject],
      );
      if (!actor.rows[0]) return { missingProfile: true as const };

      const student = await client.query<{
        id: string;
        student_number: string;
        full_name: string;
        class_label: string | null;
        status: string;
        created_at: string;
      }>(
        `INSERT INTO public.students (school_id, student_number, full_name, class_label)
         VALUES ($1, $2, $3, $4)
         RETURNING id, student_number, full_name, class_label, status, created_at`,
        [schoolId, studentNumber, fullName, classLabel],
      );

      await client.query(
        `INSERT INTO public.audit_events
          (school_id, actor_user_id, action, entity_type, entity_id, request_id)
         VALUES ($1, $2, 'student.created', 'student', $3, $4)`,
        [schoolId, actor.rows[0].id, student.rows[0].id, randomUUID()],
      );

      return { missingProfile: false as const, student: student.rows[0] };
    });

    if (created.missingProfile) {
      return errorResponse("Profil pengguna belum disiapkan. Muat /api/me terlebih dahulu.", 409);
    }

    return NextResponse.json(
      { student: created.student },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    // Unique student-number violations are expected client errors; never return SQL details.
    if (error && typeof error === "object" && "code" in error && error.code === "23505") {
      return errorResponse("Nomor siswa sudah digunakan pada sekolah ini.", 409);
    }
    if (error && typeof error === "object" && "code" in error && error.code === "42501") {
      return errorResponse("Akun tidak memiliki izin untuk sekolah ini.", 403);
    }
    return errorResponse("Siswa belum dapat disimpan. Periksa hak akses dan konfigurasi layanan.", 503);
  }
}
