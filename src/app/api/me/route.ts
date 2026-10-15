import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth/server";
import { withAuthTransaction } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data: session, error } = await getAuth().getSession();
    const user = session?.user;

    if (error || !user?.id) {
      return NextResponse.json(
        { error: "Autentikasi diperlukan." },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }

    const authSubject = String(user.id);
    const email = typeof user.email === "string" ? user.email : null;
    const displayName =
      typeof user.name === "string" && user.name.trim()
        ? user.name.trim().slice(0, 200)
        : (email?.slice(0, 200) ?? "Pengguna KPD");

    const result = await withAuthTransaction(authSubject, async (client) => {
      const appUser = await client.query<{
        id: string;
        display_name: string;
        email: string | null;
        status: string;
      }>(
        `INSERT INTO public.app_users (auth_subject, display_name, email)
         VALUES ($1, $2, $3)
         ON CONFLICT (auth_subject) DO UPDATE
           SET display_name = EXCLUDED.display_name,
               email = EXCLUDED.email
           WHERE public.app_users.status = 'active'
         RETURNING id, display_name, email, status`,
        [authSubject, displayName, email],
      );

      if (!appUser.rows[0]) {
        return { disabled: true as const };
      }

      const memberships = await client.query<{
        school_id: string;
        school_name: string;
        role: string;
      }>(
        `SELECT sm.school_id, s.name AS school_name, sm.role
         FROM public.school_memberships AS sm
         JOIN public.schools AS s ON s.id = sm.school_id
         WHERE sm.user_id = $1 AND sm.status = 'active'
         ORDER BY s.name, sm.role`,
        [appUser.rows[0].id],
      );

      return {
        disabled: false as const,
        user: appUser.rows[0],
        memberships: memberships.rows,
      };
    });

    if (result.disabled) {
      return NextResponse.json(
        { error: "Akun dinonaktifkan. Hubungi administrator institusi." },
        { status: 403, headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json(
      {
        user: result.user,
        memberships: result.memberships,
        accessState: result.memberships.length ? "active" : "pending_institution_assignment",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Profil belum dapat dimuat. Pastikan layanan autentikasi dan database dikonfigurasi." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
