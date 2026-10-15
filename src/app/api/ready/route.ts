import { NextResponse } from "next/server";
import { checkDatabaseConnection } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await checkDatabaseConnection();

    return NextResponse.json(
      { status: "ready", service: "student-id-os" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    // Do not expose connection strings, database hostnames, or driver errors.
    return NextResponse.json(
      { status: "not_ready", service: "student-id-os" },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
