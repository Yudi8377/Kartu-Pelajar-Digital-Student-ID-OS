import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AppRouteContext = {
  params: Promise<{ all: string[] }>;
};

async function dispatch(request: NextRequest, context: AppRouteContext) {
  const { all } = await context.params;
  // The Neon Auth catch-all expects the dynamic segment to be named "path".
  const authContext = { params: Promise.resolve({ path: all }) };
  const handler = getAuth().handler();
  const method = request.method as "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  return handler[method](request, authContext);
}

export async function GET(request: NextRequest, context: AppRouteContext) {
  try {
    return await dispatch(request, context);
  } catch {
    return NextResponse.json(
      { error: "Layanan autentikasi belum dikonfigurasi." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function POST(request: NextRequest, context: AppRouteContext) {
  const pathname = new URL(request.url).pathname;
  if (pathname.includes("/sign-up/") || pathname.endsWith("/sign-up")) {
    return NextResponse.json(
      { error: "Pendaftaran mandiri dinonaktifkan. Hubungi administrator institusi." },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }
  try {
    return await dispatch(request, context);
  } catch {
    return NextResponse.json(
      { error: "Layanan autentikasi belum dikonfigurasi." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function PUT(request: NextRequest, context: AppRouteContext) {
  try { return await dispatch(request, context); }
  catch { return NextResponse.json({ error: "Layanan autentikasi belum dikonfigurasi." }, { status: 503, headers: { "Cache-Control": "no-store" } }); }
}
export async function PATCH(request: NextRequest, context: AppRouteContext) {
  try { return await dispatch(request, context); }
  catch { return NextResponse.json({ error: "Layanan autentikasi belum dikonfigurasi." }, { status: 503, headers: { "Cache-Control": "no-store" } }); }
}
export async function DELETE(request: NextRequest, context: AppRouteContext) {
  try { return await dispatch(request, context); }
  catch { return NextResponse.json({ error: "Layanan autentikasi belum dikonfigurasi." }, { status: 503, headers: { "Cache-Control": "no-store" } }); }
}
