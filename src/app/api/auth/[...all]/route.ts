import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    return await getAuth().handler().GET(request);
  } catch {
    return NextResponse.json(
      { error: "Layanan autentikasi belum dikonfigurasi." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function POST(request: Request) {
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
    return await getAuth().handler().POST(request);
  } catch {
    return NextResponse.json(
      { error: "Layanan autentikasi belum dikonfigurasi." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
