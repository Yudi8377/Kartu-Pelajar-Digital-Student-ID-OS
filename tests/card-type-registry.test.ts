import { describe, expect, it } from "vitest";
import {
  CARD_TYPE_REGISTRY,
  canIssueCardType,
  getCardType,
  getPublicFieldIds,
  validateCardTypeDraft,
} from "../src/lib/card-types/registry";

describe("Digital Card OS type registry", () => {
  it("keeps the student card as the first module and includes the planned verticals", () => {
    expect(CARD_TYPE_REGISTRY[0]?.id).toBe("student_id");
    expect(getCardType("project_identity")).toBeDefined();
    expect(getCardType("digital_name_card")).toBeDefined();
    expect(getCardType("hajj_umrah_service")?.moduleStatus).toBe("prototype_only");
  });

  it("never treats a card type as an official government credential", () => {
    expect(CARD_TYPE_REGISTRY.every((item) => item.officialCredential === false)).toBe(true);
  });

  it("blocks issuance unless backend, review, and issuer gates pass", () => {
    const student = getCardType("student_id")!;
    expect(canIssueCardType(student, {
      issuerAuthorized: true, securityReviewPassed: true, productionBackendReady: false,
    })).toBe(false);
    expect(canIssueCardType(student, {
      issuerAuthorized: false, securityReviewPassed: true, productionBackendReady: true,
    })).toBe(false);
    expect(canIssueCardType(student, {
      issuerAuthorized: true, securityReviewPassed: true, productionBackendReady: true,
    })).toBe(true);
  });

  it("always blocks the Hajj/Umrah service prototype from issuance", () => {
    expect(canIssueCardType(getCardType("hajj_umrah_service")!, {
      issuerAuthorized: true, securityReviewPassed: true, productionBackendReady: true,
    })).toBe(false);
  });

  it("excludes private-by-default fields from public views", () => {
    expect(getPublicFieldIds(getCardType("student_id")!)).not.toContain("member_number");
    expect(getPublicFieldIds(getCardType("digital_name_card")!)).not.toContain("contact_phone");
  });

  it("rejects malformed or duplicate draft fields", () => {
    expect(validateCardTypeDraft({
      id: "Bad ID",
      name: " ",
      fields: [
        { id: "full_name", label: "Nama", required: true, privateByDefault: false },
        { id: "full_name", label: "Nama kedua", required: false, privateByDefault: false },
      ],
      capabilities: [],
    }).length).toBeGreaterThanOrEqual(4);
  });

  it("accepts a well-formed draft as design metadata", () => {
    expect(validateCardTypeDraft({
      id: "club_member",
      name: "Kartu Anggota Klub",
      fields: [{ id: "full_name", label: "Nama", required: true, privateByDefault: false }],
      capabilities: ["identity_display"],
    })).toEqual([]);
  });
});
