import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handlers = auth.handler();

export const GET = handlers.GET;

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

  return handlers.POST(request);
}
