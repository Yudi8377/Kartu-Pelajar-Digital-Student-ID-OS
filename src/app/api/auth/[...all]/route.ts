import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AuthRouteContext = {
  params: Promise<{ all: string[] }>;
};

export async function GET(request: NextRequest, context: AuthRouteContext) {
  try {
    return await getAuth().handler().GET(request, context);
  } catch {
    return NextResponse.json(
      { error: "Layanan autentikasi belum dikonfigurasi." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function POST(request: NextRequest, context: AuthRouteContext) {
  const pathname = new URL(request.url).pathname;

  // Student accounts are provisioned by an authorized school administrator.
  // Do not allow open self-registration through the managed auth API.
  if (pathname.includes("/sign-up/") || pathname.endsWith("/sign-up")) {
    return NextResponse.json(
      { error: "Pendaftaran mandiri dinonaktifkan. Hubungi administrator institusi." },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    return await getAuth().handler().POST(request, context);
  } catch {
    return NextResponse.json(
      { error: "Layanan autentikasi belum dikonfigurasi." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
