import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "db/migrations/0003_student_attendance.sql"),
  "utf8"
);

describe("student attendance migration guardrails", () => {
  it("creates school-scoped classes, sessions, events and corrections", () => {
    expect(migration).toMatch(/CREATE TABLE IF NOT EXISTS public\.school_classes/);
    expect(migration).toMatch(/CREATE TABLE IF NOT EXISTS public\.school_class_students/);
    expect(migration).toMatch(/CREATE TABLE IF NOT EXISTS public\.school_class_teachers/);
    expect(migration).toMatch(/CREATE TABLE IF NOT EXISTS public\.attendance_sessions/);
    expect(migration).toMatch(/CREATE TABLE IF NOT EXISTS public\.attendance_events/);
    expect(migration).toMatch(/CREATE TABLE IF NOT EXISTS public\.attendance_corrections/);
    expect(migration).toMatch(/UNIQUE \(session_id, student_id, event_type\)/);
  });

  it("limits event creation to an open session window and enrolled active students", () => {
    expect(migration).toMatch(/s\.status = 'open'/);
    expect(migration).toMatch(/statement_timestamp\(\) BETWEEN s\.starts_at AND s\.ends_at/);
    expect(migration).toMatch(/public\.is_active_school_student\(school_id, student_id\)/);
    expect(migration).toMatch(/cs\.status = 'active'/);
  });

  it("uses server-side class assignment and school membership checks", () => {
    expect(migration).toMatch(/public\.can_manage_school_class\(school_id/);
    expect(migration).toMatch(/public\.can_access_student_class\(school_id, id\)/);
    expect(migration).toMatch(/public\.is_school_member\(p_school_id, ARRAY\['school_admin','operator'\]/);
    expect(migration).toMatch(/ENABLE ROW LEVEL SECURITY/);
  });

  it("does not grant mutation privileges on attendance history", () => {
    expect(migration).toMatch(/GRANT SELECT, INSERT ON TABLE public\.[^;]*attendance_events/);
    expect(migration).toMatch(/GRANT SELECT, INSERT ON TABLE public\.[^;]*attendance_corrections/);
    expect(migration).not.toMatch(/GRANT[^;]*UPDATE[^;]*attendance_events/i);
    expect(migration).not.toMatch(/GRANT[^;]*DELETE[^;]*attendance_(events|corrections)/i);
  });

  it("documents production approval as a prerequisite", () => {
    expect(migration).toMatch(/do not apply to production without explicit approval/i);
  });
});
