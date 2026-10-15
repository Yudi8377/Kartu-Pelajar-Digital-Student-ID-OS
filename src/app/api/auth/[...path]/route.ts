import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function unavailable() {
  return NextResponse.json(
    { error: "Authentication service is not configured" },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}

async function handler(request: Request) {
  try {
    const auth = getAuth();
    return await auth.handler()(request);
  } catch {
    return unavailable();
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
