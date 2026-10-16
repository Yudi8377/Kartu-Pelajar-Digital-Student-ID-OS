import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth/server";
import { withAuthenticatedDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "no-store, max-age=0", Pragma: "no-cache" };
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  const issuerId = new URL(request.url).searchParams.get("issuerId")?.trim() ?? "";
  if (!UUID_PATTERN.test(issuerId)) return NextResponse.json({ error: "issuerId tidak valid" }, { status: 400, headers: NO_STORE });
  try {
    const session = await getAuth().getSession();
    const authSubject = (session.data?.user as { id?: string } | undefined)?.id;
    if (!authSubject) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE });
    const events = await withAuthenticatedDb(authSubject, async (client) => {
      const membership = await client.query(
        "SELECT 1 FROM public.digital_card_issuer_memberships im JOIN public.app_users au ON au.id = im.user_id WHERE im.issuer_id = $1 AND au.auth_subject = $2 AND au.status = 'active' AND im.status = 'active' AND im.role = 'issuer_admin' LIMIT 1",
        [issuerId, authSubject],
      );
      if (membership.rowCount !== 1) return null;
      const result = await client.query<{
        id: string; action: string; entity_type: string; entity_id: string | null;
        request_id: string | null; created_at: Date;
      }>(
        "SELECT id, action, entity_type, entity_id, request_id, created_at FROM public.digital_card_audit_events WHERE issuer_id = $1 ORDER BY created_at DESC LIMIT 100",
        [issuerId],
      );
      return result.rows;
    });
    if (events === null) return NextResponse.json({ error: "Akses audit hanya untuk admin penerbit" }, { status: 403, headers: NO_STORE });
    return NextResponse.json({ events }, { headers: NO_STORE });
  } catch {
    return NextResponse.json({ error: "Layanan audit sementara tidak tersedia" }, { status: 503, headers: NO_STORE });
  }
}

