import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth/server";
import { withAuthenticatedDb } from "@/lib/db";
import { readJsonBodyLimited } from "@/lib/http-json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store, max-age=0", Pragma: "no-cache" };
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const jsonError = (message: string, status: number) => NextResponse.json({ error: message }, { status, headers: NO_STORE });

/** Revoke a card immediately after checking the caller's active school role. */
export async function POST(request: Request, context: { params: Promise<{ cardId: string }> }) {
  if (process.env.CARD_LIFECYCLE_API_ENABLED !== "true") {
    return jsonError("Pengelolaan kartu belum diaktifkan pada lingkungan ini", 503);
  }

  try {
    const session = await getAuth().getSession();
    const authSubject = (session.data?.user as { id?: string } | undefined)?.id;
    if (!authSubject) return jsonError("Unauthorized", 401);

    const { cardId } = await context.params;
    if (!UUID_PATTERN.test(cardId)) return jsonError("ID kartu tidak valid", 400);
    const parsed = await readJsonBodyLimited(request, 2_048);
    if (!parsed.ok) return jsonError(parsed.message, parsed.status);
    if (!parsed.value || typeof parsed.value !== "object" || Array.isArray(parsed.value)) {
      return jsonError("Data pencabutan tidak valid", 400);
    }
    const schoolId = typeof (parsed.value as Record<string, unknown>).schoolId === "string"
      ? ((parsed.value as Record<string, unknown>).schoolId as string).trim()
      : "";
    if (!UUID_PATTERN.test(schoolId)) return jsonError("schoolId tidak valid", 400);

    const result = await withAuthenticatedDb(authSubject, async (client) => {
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

      const cardResult = await client.query<{ id: string; status: string }>(
        "SELECT id, status FROM public.student_cards WHERE id = $1 AND school_id = $2 FOR UPDATE",
        [cardId, schoolId],
      );
      const card = cardResult.rows[0];
      if (!card) return { kind: "not_found" as const };
      if (card.status === "revoked") return { kind: "revoked" as const };
      if (card.status !== "active" && card.status !== "pending") return { kind: "not_reversible" as const };

      await client.query(
        "UPDATE public.student_cards SET status = 'revoked', revoked_at = statement_timestamp() WHERE id = $1 AND school_id = $2",
        [cardId, schoolId],
      );
      await client.query(
        "INSERT INTO public.audit_events (school_id, actor_user_id, action, entity_type, entity_id, metadata) VALUES ($1, $2, 'card.revoked', 'student_card', $3, $4::jsonb)",
        [schoolId, actor.id, cardId, JSON.stringify({ source: "card_lifecycle_api" })],
      );
      return { kind: "revoked" as const };
    });

    if (result.kind === "forbidden") return jsonError("Akses sekolah ditolak", 403);
    if (result.kind === "not_found") return jsonError("Kartu tidak ditemukan", 404);
    if (result.kind === "not_reversible") return jsonError("Status kartu tidak dapat dicabut melalui operasi ini", 409);
    return NextResponse.json({ cardId, status: "revoked", alreadyRevoked: result.kind === "revoked" }, { headers: NO_STORE });
  } catch {
    return jsonError("Layanan pencabutan kartu sementara tidak tersedia", 503);
  }
}
