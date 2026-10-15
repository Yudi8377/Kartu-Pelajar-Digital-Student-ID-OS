import { describe, expect, it } from "vitest";
import { getKpdModuleStatusLabel, KPD_MODULES } from "../src/lib/kpd-modules";

describe("KPD modular product registry", () => {
  it("has unique module identifiers", () => {
    const ids = KPD_MODULES.map((module) => module.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps welfare integration gated and restricted", () => {
    const welfare = KPD_MODULES.find((module) => module.id === "welfare-bridge");
    expect(welfare?.status).toBe("gated");
    expect(welfare?.sensitivity).toBe("sensitive-restricted");
    expect(welfare?.guardrail).toMatch(/DTSEN/);
  });

  it("keeps emergency guardian planned and restricted until native Android safeguards exist", () => {
    const emergency = KPD_MODULES.find((module) => module.id === "emergency-guardian");
    expect(emergency?.status).toBe("planned");
    expect(emergency?.sensitivity).toBe("sensitive-restricted");
    expect(emergency?.guardrail).toMatch(/salah/);
  });

  it("labels roadmap status without implying all modules are live", () => {
    expect(getKpdModuleStatusLabel("foundation")).toBe("Fondasi");
    expect(getKpdModuleStatusLabel("planned")).toBe("Tahap berikutnya");
    expect(getKpdModuleStatusLabel("gated")).toBe("Menunggu izin resmi");
  });

  it("defines at least one guardrail for every module", () => {
    expect(KPD_MODULES.every((module) => module.guardrail.trim().length > 20)).toBe(true);
  });
});
