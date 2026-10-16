import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth/server";
import { withAuthenticatedDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "no-store, max-age=0", Pragma: "no-cache" };

export async function GET() {
  try {
    const session = await getAuth().getSession();
    const authSubject = (session.data?.user as { id?: string } | undefined)?.id;
    if (!authSubject) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE });
    const issuers = await withAuthenticatedDb(authSubject, async (client) => {
      const result = await client.query<{
        id: string; issuer_key: string; display_name: string; issuer_type: string;
        status: string; role: string; created_at: Date;
      }>(
        "SELECT di.id, di.issuer_key, di.display_name, di.issuer_type, di.status, im.role, di.created_at FROM public.digital_card_issuers di JOIN public.digital_card_issuer_memberships im ON im.issuer_id = di.id JOIN public.app_users au ON au.id = im.user_id WHERE au.auth_subject = $1 AND au.status = 'active' AND im.status = 'active' ORDER BY di.display_name LIMIT 100",
        [authSubject],
      );
      return result.rows;
    });
    return NextResponse.json({ issuers }, { headers: NO_STORE });
  } catch {
    return NextResponse.json({ error: "Layanan organisasi penerbit sementara tidak tersedia" }, { status: 503, headers: NO_STORE });
  }
}
