import { describe, expect, it } from "vitest";
import { bindIssuerName, validateCardClaims } from "../src/lib/digital-card-claims";
import { getCardType } from "../src/lib/card-types/registry";

describe("generic digital card claims", () => {
  it("accepts a valid project card and binds the issuer name", () => {
    const result = validateCardClaims("project_identity", {
      full_name: "Contoh Fiktif",
      issuer_name: "operator-supplied",
      project_name: "Proyek Contoh",
      role: "Anggota",
    }, {});
    expect(result.ok).toBe(true);
    if (result.ok) {
      const bound = bindIssuerName(getCardType("project_identity")!, result, "Penerbit Sah");
      expect(bound.ok).toBe(true);
      if (bound.ok) expect(bound.publicClaims.issuer_name).toBe("Penerbit Sah");
    }
  });

  it("lets the server supply the authoritative issuer name", () => {
    const result = validateCardClaims("project_identity", {
      full_name: "Contoh Fiktif",
      project_name: "Proyek Contoh",
      role: "Anggota",
    }, {});
    expect(result.ok).toBe(true);
    if (result.ok) {
      const bound = bindIssuerName(getCardType("project_identity")!, result, "Penerbit Tepercaya");
      expect(bound.ok).toBe(true);
      if (bound.ok) expect(bound.publicClaims.issuer_name).toBe("Penerbit Tepercaya");
    }
  });

  it("rejects private fields in public claims", () => {
    const result = validateCardClaims("student_id", {
      full_name: "Contoh Fiktif",
      issuer_name: "Sekolah Contoh",
      institution_name: "Sekolah Contoh",
      member_number: "NIS-FIKTIF",
    }, {});
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(" ")).toContain("harus disimpan sebagai privat");
  });

  it("rejects unregistered fields and non-text values", () => {
    const result = validateCardClaims("digital_name_card", {
      full_name: "Contoh Fiktif",
      issuer_name: "Penerbit",
      unknown_secret: "value",
      role: 123,
    }, {});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.join(" ")).toContain("Field tidak terdaftar");
      expect(result.errors.join(" ")).toContain("hanya boleh berisi teks");
    }
  });

  it("requires registered required fields and stores private contact data separately", () => {
    const missing = validateCardClaims("digital_name_card", { full_name: "Contoh Fiktif" }, {});
    expect(missing.ok).toBe(false);
    const complete = validateCardClaims("digital_name_card", {
      full_name: "Contoh Fiktif",
      issuer_name: "Penerbit",
    }, { contact_email: "demo@example.invalid", contact_phone: "+620000000000" });
    expect(complete.ok).toBe(true);
  });

  it("refuses the Hajj/Umrah prototype at the route's registry gate", () => {
    expect(getCardType("hajj_umrah_service")?.moduleStatus).toBe("prototype_only");
  });
});
