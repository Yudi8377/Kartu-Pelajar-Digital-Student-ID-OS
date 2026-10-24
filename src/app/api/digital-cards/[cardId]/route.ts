import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth/server";
import { withAuthenticatedDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "no-store, max-age=0", Pragma: "no-cache" };
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

export async function PATCH(request: Request, context: { params: Promise<{ cardId: string }> }) {
  let params: { cardId: string };
  try {
    params = await context.params;
  } catch {
    return jsonError("Permintaan tidak valid", 400);
  }
  if (!UUID_PATTERN.test(params.cardId)) return jsonError("ID kartu tidak valid", 400);

  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.includes("application/json")) return jsonError("Content-Type harus application/json", 415);

  let body: unknown;
  try {
    const text = await readLimitedBody(request, 2_048);
    if (text === null) return jsonError("Ukuran permintaan terlalu besar", 413);
    body = JSON.parse(text);
  } catch {
    return jsonError("JSON tidak valid", 400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) return jsonError("Data permintaan tidak valid", 400);
  const issuerId = (body as Record<string, unknown>).issuerId;
  const reasonCode = (body as Record<string, unknown>).reasonCode;
  if (typeof issuerId !== "string" || !UUID_PATTERN.test(issuerId)) return jsonError("issuerId tidak valid", 400);
  if (reason != null && (typeof reason !== "string" || reason.trim().length > 240 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(reason))) {
    return jsonError("Alasan pencabutan tidak valid", 400);
  }

  try {
    const session = await getAuth().getSession();
    const authSubject = (session.data?.user as { id?: string } | undefined)?.id;
    if (!authSubject) return jsonError("Unauthorized", 401);

    const bucket = createHash("sha256").update("revoke:" + authSubject + ":" + issuerId, "utf8").digest("hex");
    const result = await withAuthenticatedDb(authSubject, async (client) => {
      const rate = await client.query<{ allowed: boolean }>(
        "SELECT public.consume_digital_card_rate_limit($1, $2, $3) AS allowed",
        [bucket, 60, 20],
      );
      if (rate.rows[0]?.allowed !== true) return { kind: "rate_limited" as const };

      const membership = await client.query<{ user_id: string }>(
        "SELECT im.user_id FROM public.digital_card_issuer_memberships im JOIN public.app_users au ON au.id = im.user_id JOIN public.digital_card_issuers di ON di.id = im.issuer_id WHERE im.issuer_id = $1 AND au.auth_subject = $2 AND au.status = 'active' AND im.status = 'active' AND di.status = 'active' AND im.role = ANY($3::text[]) LIMIT 1",
        [issuerId, authSubject, ["issuer_admin", "operator"]],
      );
      const actor = membership.rows[0];
      if (!actor) return { kind: "forbidden" as const };

      const updated = await client.query<{ id: string; status: string; revoked_at: Date }>(
        "UPDATE public.digital_cards SET status = 'revoked', revoked_at = now(), updated_at = now() WHERE id = $1 AND issuer_id = $2 AND status IN ('active', 'pending') RETURNING id, status, revoked_at",
        [params.cardId, issuerId],
      );
      const card = updated.rows[0];
      if (!card) return { kind: "not_found" as const };

      await client.query(
        "INSERT INTO public.digital_card_audit_events (issuer_id, actor_user_id, action, entity_type, entity_id, metadata) VALUES ($1, $2, 'credential_revoked', 'digital_card', $3, $4::jsonb)",
        [issuerId, actor.user_id, card.id, JSON.stringify({ reasonCode: typeof reasonCode === "string" ? reasonCode : null })],
      );
      return { kind: "revoked" as const, card };
    });

    if (result.kind === "rate_limited") return jsonError("Terlalu banyak permintaan. Coba lagi nanti.", 429);
    if (result.kind === "forbidden") return jsonError("Akses penerbit ditolak", 403);
    if (result.kind === "not_found") return jsonError("Kartu tidak ditemukan atau tidak dapat dicabut", 404);
    return NextResponse.json({ card: result.card }, { headers: NO_STORE });
  } catch {
    return jsonError("Pencabutan kartu sementara tidak tersedia", 503);
  }
}
