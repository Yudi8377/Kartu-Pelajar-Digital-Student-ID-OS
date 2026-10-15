export type CardDomainId = "student" | "project-worker" | "institution-member";
export type CardDomainStatus = "available-as-template" | "planned";
export type CardDataClass = "public-minimal" | "organization-confidential" | "sensitive-restricted";

export interface CardDomainTemplate {
  id: CardDomainId;
  name: string;
  description: string;
  status: CardDomainStatus;
  dataClass: CardDataClass;
  modules: readonly string[];
  primaryRoles: readonly string[];
  guardrail: string;
}

/**
 * Reusable card-domain templates. These describe product configuration only;
 * they do not imply that the listed workflows or integrations are operational.
 * Every organization must explicitly enable modules and authorize roles.
 */
export const CARD_DOMAIN_TEMPLATES: readonly CardDomainTemplate[] = [
  {
    id: "student",
    name: "Kartu Pelajar Digital",
    description: "Identitas siswa untuk layanan sekolah, kehadiran, jadwal, izin, dan komunikasi wali.",
    status: "available-as-template",
    dataClass: "organization-confidential",
    modules: ["digital-identity", "school-operations", "student-attendance", "class-schedule", "leave-requests", "family-portal", "learning-passport", "student-services"],
    primaryRoles: ["student", "guardian", "teacher", "school-operator", "school-admin"],
    guardrail: "Data anak hanya dapat diakses sesuai kebutuhan pendidikan dan kewenangan; QR tidak memuat data pribadi."
  },
  {
    id: "project-worker",
    name: "Kartu Identitas Pekerja Proyek",
    description: "Identitas pekerja yang terikat pada perusahaan dan proyek tertentu, dengan kehadiran dan kontrol akses area bila diaktifkan.",
    status: "planned",
    dataClass: "organization-confidential",
    modules: ["digital-identity", "project-workforce", "work-attendance", "site-access", "certification-records", "safety-induction", "incident-reporting"],
    primaryRoles: ["worker", "site-supervisor", "project-admin", "contractor-admin", "safety-officer"],
    guardrail: "Isolasi perusahaan/proyek wajib; status sertifikasi dan akses area hanya diverifikasi oleh petugas berwenang."
  },
  {
    id: "institution-member",
    name: "Kartu Anggota Institusi",
    description: "Template umum untuk anggota organisasi, fasilitas, kegiatan, dan masa berlaku keanggotaan.",
    status: "planned",
    dataClass: "organization-confidential",
    modules: ["digital-identity", "membership-lifecycle", "facility-access", "event-check-in"],
    primaryRoles: ["member", "institution-operator", "institution-admin", "verifier"],
    guardrail: "Setiap institusi mengelola tenant, aturan, dan data sendiri; pemeriksa publik menerima hasil verifikasi minimum."
  }
] as const;

export function getCardDomainTemplate(id: CardDomainId): CardDomainTemplate | undefined {
  return CARD_DOMAIN_TEMPLATES.find((template) => template.id === id);
}

export function getCardDomainStatusLabel(status: CardDomainStatus): string {
  return status === "available-as-template" ? "Template awal" : "Direncanakan";
}
