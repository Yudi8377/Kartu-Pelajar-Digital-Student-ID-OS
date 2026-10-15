import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth/server";
import { withAuthenticatedDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const authResult = await getAuth().getSession();
    const user = authResult.data?.user;
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }

    const identity = user as { id: string; name?: string | null; email?: string | null };
    if (!identity.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }

    const result = await withAuthenticatedDb(identity.id, async (client) => {
      const displayName = (identity.name?.trim() || identity.email?.split("@")[0] || "Pengguna Student ID OS").slice(0, 120);
      const email = identity.email?.trim().slice(0, 254) || null;

      // Self-provisioning creates only a user profile. It never grants a school membership or role.
      await client.query(
        "INSERT INTO public.app_users (auth_subject, display_name, email) VALUES ($1, $2, $3) ON CONFLICT (auth_subject) DO NOTHING",
        [identity.id, displayName, email],
      );

      const profileResult = await client.query<{
        id: string;
        display_name: string;
        email: string | null;
      }>(
        "SELECT id, display_name, email FROM public.app_users WHERE auth_subject = $1 AND status = 'active' LIMIT 1",
        [identity.id],
      );
      const profile = profileResult.rows[0];
      if (!profile) return null;

      const memberships = await client.query<{
        school_id: string;
        school_name: string;
        role: string;
      }>(
        "SELECT sm.school_id, s.name AS school_name, sm.role FROM public.school_memberships AS sm JOIN public.schools AS s ON s.id = sm.school_id WHERE sm.user_id = $1 AND sm.status = 'active' AND s.status = 'active' ORDER BY s.name",
        [profile.id],
      );

      return {
        user: { id: profile.id, displayName: profile.display_name, email: profile.email },
        memberships: memberships.rows,
      };
    });

    if (!result) {
      return NextResponse.json(
        { error: "Account is not active" },
        { status: 403, headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch {
    // Keep connection errors, database details, and internal identity data out of responses.
    return NextResponse.json(
      { error: "Profile service is temporarily unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
