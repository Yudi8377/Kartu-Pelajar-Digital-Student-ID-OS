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
    const cards = await withAuthenticatedDb(authSubject, async (client) => {
      const membership = await client.query(
        "SELECT 1 FROM public.digital_card_issuer_memberships im JOIN public.app_users au ON au.id = im.user_id WHERE im.issuer_id = $1 AND au.auth_subject = $2 AND au.status = 'active' AND im.status = 'active' AND im.role = ANY($3::text[]) LIMIT 1",
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
    if (cards === null) return NextResponse.json({ error: "Akses penerbit ditolak" }, { status: 403, headers: NO_STORE });
    return NextResponse.json({ cards }, { headers: NO_STORE });
  } catch {
    return NextResponse.json({ error: "Layanan daftar kredensial sementara tidak tersedia" }, { status: 503, headers: NO_STORE });
  }
}
