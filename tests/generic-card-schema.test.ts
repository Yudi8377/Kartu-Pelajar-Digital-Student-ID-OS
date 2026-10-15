import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(new URL("../db/migrations/0003_generic_digital_cards.sql", import.meta.url), "utf8");

describe("generic digital-card migration contract", () => {
  it("adds issuer-scoped tables without removing Student ID tables", () => {
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.digital_card_issuers");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.digital_card_issuer_memberships");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.digital_cards");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.digital_card_audit_events");
  });

  it("enables row-level security on every generic card table", () => {
    for (const table of [
      "digital_card_issuers",
      "digital_card_issuer_memberships",
      "digital_cards",
      "digital_card_audit_events",
    ]) {
      expect(migration).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`);
    }
  });

  it("does not define a raw token column and keeps public verification minimal", () => {
    expect(migration).toContain("credential_hash bytea UNIQUE");
    expect(migration).not.toMatch(/\braw_token\b/i);
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.verify_digital_card(p_token_hash bytea)");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.verify_digital_card(bytea) FROM PUBLIC");
    expect(migration).not.toMatch(/RETURNS TABLE\([^)]*full_name/i);
  });
});
