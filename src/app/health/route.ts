import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ status: "ok", service: "student-id-os", database: "not_checked" });
}
