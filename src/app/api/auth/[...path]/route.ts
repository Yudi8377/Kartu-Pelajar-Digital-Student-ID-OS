import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AuthHandler = (request: Request) => Promise<Response> | Response;

async function handler(request: Request) {
  try {
    const handlers = getAuth().handler() as Record<string, AuthHandler>;
    const selected = handlers[request.method];
    if (!selected) return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
    return await selected(request);
  } catch {
    return NextResponse.json(
      { error: "Authentication service is not configured" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
