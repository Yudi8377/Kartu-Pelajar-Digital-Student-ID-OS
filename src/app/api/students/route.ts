import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth/server";
import { withAuthenticatedDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: NO_STORE });
}

async function readLimitedBody(request: Request, maxBytes: number): Promise<string | null> {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

async function currentUser() {
  const result = await getAuth().getSession();
  const user = result.data?.user as { id?: string } | undefined;
  return user?.id ? user.id : null;
}

async function canManageSchool(authSubject: string, schoolId: string) {
  return withAuthenticatedDb(authSubject, async (client) => {
    const userResult = await client.query<{ id: string }>(
      "SELECT id FROM public.app_users WHERE auth_subject = $1 AND status = 'active' LIMIT 1",
      [authSubject],
    );
    const appUser = userResult.rows[0];
    if (!appUser) return false;

    const membership = await client.query(
      "SELECT 1 FROM public.school_memberships WHERE school_id = $1 AND user_id = $2 AND status = 'active' AND role = ANY($3::text[]) LIMIT 1",
      [schoolId, appUser.id, ["school_admin", "operator"]],
    );
    return membership.rowCount === 1;
  });
}

/** List only the selected school's student records for an authorized operator. */
export async function GET(request: Request) {
  try {
    const authSubject = await currentUser();
    if (!authSubject) return jsonError("Unauthorized", 401);

    const url = new URL(request.url);
    const schoolId = url.searchParams.get("schoolId")?.trim() ?? "";
    if (!UUID_PATTERN.test(schoolId)) return jsonError("schoolId tidak valid", 400);

    const allowed = await canManageSchool(authSubject, schoolId);
    if (!allowed) return jsonError("Akses sekolah ditolak", 403);

    const rows = await withAuthenticatedDb(authSubject, async (client) => {
      const result = await client.query<{
        id: string;
        student_number: string;
        full_name: string;
        class_label: string | null;
        status: string;
        created_at: Date;
        updated_at: Date;
      }>(
        "SELECT id, student_number, full_name, class_label, status, created_at, updated_at FROM public.students WHERE school_id = $1 ORDER BY full_name ASC LIMIT 200",
        [schoolId],
      );
      return result.rows;
    });

    return NextResponse.json({ students: rows }, { headers: NO_STORE });
  } catch {
    return jsonError("Layanan data siswa sementara tidak tersedia", 503);
  }
}

/** Create a student within one explicitly authorized school tenant. */
export async function POST(request: Request) {
  try {
    const authSubject = await currentUser();
    if (!authSubject) return jsonError("Unauthorized", 401);

    const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
    if (!contentType.includes("application/json")) return jsonError("Content-Type harus application/json", 415);

    let rawBody: string | null;
    try {
      rawBody = await readLimitedBody(request, 8_192);
    } catch {
      return jsonError("JSON tidak valid", 400);
    }
    if (rawBody === null) return jsonError("Ukuran permintaan terlalu besar", 413);

    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return jsonError("JSON tidak valid", 400);
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) return jsonError("Data siswa tidak valid", 400);

    const input = body as Record<string, unknown>;
    const schoolId = typeof input.schoolId === "string" ? input.schoolId.trim() : "";
    const studentNumberRaw = typeof input.studentNumber === "string" ? input.studentNumber.trim() : "";
    const fullName = typeof input.fullName === "string" ? input.fullName.trim() : "";
    const classLabel = input.classLabel == null ? null : typeof input.classLabel === "string" ? input.classLabel.trim() : undefined;

    if (!UUID_PATTERN.test(schoolId)) return jsonError("schoolId tidak valid", 400);
    if (!studentNumberRaw || studentNumberRaw.length > 64 || CONTROL_CHARS.test(studentNumberRaw)) {
      return jsonError("Nomor siswa wajib diisi dan maksimal 64 karakter", 400);
    }
    if (studentNumberRaw !== studentNumberRaw.trim()) return jsonError("Nomor siswa tidak valid", 400);
    if (!fullName || fullName.length > 160 || CONTROL_CHARS.test(fullName)) {
      return jsonError("Nama siswa wajib diisi dan maksimal 160 karakter", 400);
    }
    if (classLabel === undefined || (classLabel !== null && (classLabel.length > 80 || CONTROL_CHARS.test(classLabel)))) {
      return jsonError("Label kelas maksimal 80 karakter", 400);
    }

    // Normalize the school-local student number; the database constraint prevents duplicates per school.
    const studentNumber = studentNumberRaw.replace(/\s+/g, " ").toUpperCase();
    const allowed = await canManageSchool(authSubject, schoolId);
    if (!allowed) return jsonError("Akses sekolah ditolak", 403);

    const created = await withAuthenticatedDb(authSubject, async (client) => {
      const actorResult = await client.query<{ id: string }>(
        "SELECT id FROM public.app_users WHERE auth_subject = $1 AND status = 'active' LIMIT 1",
        [authSubject],
      );
      const actor = actorResult.rows[0];
      if (!actor) return { kind: "forbidden" as const };

      const inserted = await client.query<{
        id: string;
        student_number: string;
        full_name: string;
        class_label: string | null;
        status: string;
        created_at: Date;
        updated_at: Date;
      }>(
        "INSERT INTO public.students (school_id, student_number, full_name, class_label) VALUES ($1, $2, $3, $4) RETURNING id, student_number, full_name, class_label, status, created_at, updated_at",
        [schoolId, studentNumber, fullName, classLabel],
      );
      const student = inserted.rows[0];
      await client.query(
        "INSERT INTO public.audit_events (school_id, actor_user_id, action, entity_type, entity_id, metadata) VALUES ($1, $2, 'student.created', 'student', $3, $4::jsonb)",
        [schoolId, actor.id, student.id, JSON.stringify({ source: "admin_api" })],
      );
      return { kind: "created" as const, student };
    });

    if (created.kind === "forbidden") return jsonError("Akses sekolah ditolak", 403);
    return NextResponse.json({ student: created.student }, { status: 201, headers: NO_STORE });
  } catch (error) {
    const pgError = error as { code?: string };
    if (pgError.code === "23505") return jsonError("Nomor siswa sudah digunakan di sekolah ini", 409);
    return jsonError("Layanan data siswa sementara tidak tersedia", 503);
  }
}
