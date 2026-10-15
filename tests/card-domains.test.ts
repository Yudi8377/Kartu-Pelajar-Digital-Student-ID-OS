import { describe, expect, it } from "vitest";
import {
  CARD_DOMAIN_TEMPLATES,
  getCardDomainStatusLabel,
  getCardDomainTemplate
} from "../src/lib/card-domains";

describe("reusable digital card domain templates", () => {
  it("has unique domain identifiers", () => {
    const ids = CARD_DOMAIN_TEMPLATES.map((template) => template.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("includes student attendance and common student workflows", () => {
    const student = getCardDomainTemplate("student");
    expect(student?.modules).toContain("student-attendance");
    expect(student?.modules).toContain("class-schedule");
    expect(student?.modules).toContain("leave-requests");
    expect(student?.modules).toContain("family-portal");
  });

  it("includes project worker modules without granting automatic live access", () => {
    const worker = getCardDomainTemplate("project-worker");
    expect(worker?.modules).toContain("work-attendance");
    expect(worker?.modules).toContain("site-access");
    expect(worker?.status).toBe("planned");
    expect(worker?.guardrail).toMatch(/Isolasi perusahaan\/proyek/);
  });

  it("requires every domain template to define roles and a guardrail", () => {
    expect(CARD_DOMAIN_TEMPLATES.every((template) => template.primaryRoles.length > 0)).toBe(true);
    expect(CARD_DOMAIN_TEMPLATES.every((template) => template.guardrail.trim().length > 20)).toBe(true);
  });

  it("labels template status accurately", () => {
    expect(getCardDomainStatusLabel("available-as-template")).toBe("Template awal");
    expect(getCardDomainStatusLabel("planned")).toBe("Direncanakan");
  });
});
