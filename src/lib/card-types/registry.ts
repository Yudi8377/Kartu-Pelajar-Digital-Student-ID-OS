/**
 * Digital Card OS — shared, declarative card-type registry.
 *
 * This registry describes product capabilities; it does not grant authorization.
 * All issuance, verification, and access decisions must be enforced server-side.
 */
export type CardTypeId =
  | "student_id"
  | "project_identity"
  | "digital_name_card"
  | "event_participant"
  | "organization_membership"
  | "achievement_certificate"
  | "hajj_umrah_service";

export type CardCapability =
  | "identity_display"
  | "contact_share"
  | "membership_check"
  | "attendance_check_in"
  | "event_access"
  | "achievement_verify"
  | "service_workflow";

export type CardFieldId =
  | "full_name"
  | "issuer_name"
  | "institution_name"
  | "member_number"
  | "role"
  | "valid_until"
  | "project_name"
  | "event_name"
  | "contact_email"
  | "contact_phone"
  | "achievement_title"
  | "service_reference";

export interface CardFieldDefinition {
  id: CardFieldId;
  label: string;
  required: boolean;
  /** If true, never include this field in a public QR or unauthenticated view. */
  privateByDefault: boolean;
}

export interface CardTypeDefinition {
  id: CardTypeId;
  name: string;
  description: string;
  moduleStatus: "available_for_design" | "prototype_only";
  defaultCapabilities: readonly CardCapability[];
  fields: readonly CardFieldDefinition[];
  issuerAuthorizationRequired: boolean;
  securityReviewRequired: boolean;
  officialCredential: false;
}

const publicIdentityFields: readonly CardFieldDefinition[] = [
  { id: "full_name", label: "Nama pemegang", required: true, privateByDefault: false },
  { id: "issuer_name", label: "Penerbit", required: true, privateByDefault: false },
  { id: "valid_until", label: "Berlaku sampai", required: false, privateByDefault: false },
];

export const CARD_TYPE_REGISTRY: readonly CardTypeDefinition[] = [
  {
    id: "student_id",
    name: "Kartu Pelajar Digital",
    description: "Identitas pendidikan yang dikelola sekolah atau lembaga berwenang.",
    moduleStatus: "available_for_design",
    defaultCapabilities: ["identity_display", "attendance_check_in"],
    fields: [
      ...publicIdentityFields,
      { id: "institution_name", label: "Sekolah/lembaga", required: true, privateByDefault: false },
      { id: "member_number", label: "Nomor siswa", required: true, privateByDefault: true },
    ],
    issuerAuthorizationRequired: true,
    securityReviewRequired: true,
    officialCredential: false,
  },
  {
    id: "project_identity",
    name: "Identitas Proyek",
    description: "Identitas anggota tim, peran, dan masa penugasan.",
    moduleStatus: "available_for_design",
    defaultCapabilities: ["identity_display"],
    fields: [
      ...publicIdentityFields,
      { id: "project_name", label: "Nama proyek", required: true, privateByDefault: false },
      { id: "role", label: "Peran", required: true, privateByDefault: false },
    ],
    issuerAuthorizationRequired: true,
    securityReviewRequired: true,
    officialCredential: false,
  },
  {
    id: "digital_name_card",
    name: "Kartu Nama Digital",
    description: "Profil profesional dengan berbagi kontak secara sadar dan terbatas.",
    moduleStatus: "available_for_design",
    defaultCapabilities: ["identity_display", "contact_share"],
    fields: [
      ...publicIdentityFields,
      { id: "role", label: "Profesi/peran", required: false, privateByDefault: false },
      { id: "contact_email", label: "Email", required: false, privateByDefault: true },
      { id: "contact_phone", label: "Nomor telepon", required: false, privateByDefault: true },
    ],
    issuerAuthorizationRequired: false,
    securityReviewRequired: true,
    officialCredential: false,
  },
  {
    id: "event_participant",
    name: "Kartu Peserta Kegiatan",
    description: "Identitas peserta, akses acara, dan kehadiran sesuai izin penyelenggara.",
    moduleStatus: "available_for_design",
    defaultCapabilities: ["identity_display", "event_access", "attendance_check_in"],
    fields: [
      ...publicIdentityFields,
      { id: "event_name", label: "Nama kegiatan", required: true, privateByDefault: false },
      { id: "member_number", label: "ID peserta", required: true, privateByDefault: true },
    ],
    issuerAuthorizationRequired: true,
    securityReviewRequired: true,
    officialCredential: false,
  },
  {
    id: "organization_membership",
    name: "Kartu Keanggotaan",
    description: "Status keanggotaan, peran, dan masa aktif oleh organisasi penerbit.",
    moduleStatus: "available_for_design",
    defaultCapabilities: ["identity_display", "membership_check"],
    fields: [
      ...publicIdentityFields,
      { id: "institution_name", label: "Organisasi", required: true, privateByDefault: false },
      { id: "member_number", label: "Nomor anggota", required: true, privateByDefault: true },
      { id: "role", label: "Peran anggota", required: false, privateByDefault: false },
    ],
    issuerAuthorizationRequired: true,
    securityReviewRequired: true,
    officialCredential: false,
  },
  {
    id: "achievement_certificate",
    name: "Kartu Prestasi & Sertifikat",
    description: "Ringkasan pencapaian yang dapat diverifikasi kepada penerbitnya.",
    moduleStatus: "available_for_design",
    defaultCapabilities: ["identity_display", "achievement_verify"],
    fields: [
      ...publicIdentityFields,
      { id: "achievement_title", label: "Nama pencapaian", required: true, privateByDefault: false },
      { id: "institution_name", label: "Penerbit/pemberi penghargaan", required: true, privateByDefault: false },
    ],
    issuerAuthorizationRequired: true,
    securityReviewRequired: true,
    officialCredential: false,
  },
  {
    id: "hajj_umrah_service",
    name: "Kartu Layanan Haji/Umrah",
    description: "Konsep kartu layanan bagi penyelenggara yang sah; bukan dokumen resmi atau pengganti identitas perjalanan.",
    moduleStatus: "prototype_only",
    defaultCapabilities: ["identity_display", "service_workflow"],
    fields: [
      ...publicIdentityFields,
      { id: "service_reference", label: "Referensi layanan", required: true, privateByDefault: true },
    ],
    issuerAuthorizationRequired: true,
    securityReviewRequired: true,
    officialCredential: false,
  },
] as const;

export interface CardTypeActivationContext {
  issuerAuthorized: boolean;
  securityReviewPassed: boolean;
  /** A public static preview must always pass false here. */
  productionBackendReady: boolean;
}

/** Design previews are allowed; actual issuance needs all three server-verified gates. */
export function canIssueCardType(
  cardType: CardTypeDefinition,
  context: CardTypeActivationContext,
): boolean {
  if (cardType.moduleStatus === "prototype_only") return false;
  if (!context.productionBackendReady || !context.securityReviewPassed) return false;
  if (cardType.issuerAuthorizationRequired && !context.issuerAuthorized) return false;
  return true;
}

export function getCardType(id: string): CardTypeDefinition | undefined {
  return CARD_TYPE_REGISTRY.find((cardType) => cardType.id === id);
}

/** Build a public view allowlist. Private-by-default fields are always excluded. */
export function getPublicFieldIds(cardType: CardTypeDefinition): CardFieldId[] {
  return cardType.fields.filter((field) => !field.privateByDefault).map((field) => field.id);
}

export interface CardTypeDraft {
  id: string;
  name: string;
  fields: CardFieldDefinition[];
  capabilities: CardCapability[];
}

/** Validate user-authored studio configuration without granting issuance privileges. */
export function validateCardTypeDraft(draft: CardTypeDraft): string[] {
  const errors: string[] = [];
  if (!/^[a-z][a-z0-9_]{2,47}$/.test(draft.id)) errors.push("ID harus berupa slug huruf kecil dan underscore.");
  if (!draft.name.trim() || draft.name.trim().length > 80) errors.push("Nama kartu wajib diisi (maksimal 80 karakter).");
  if (draft.fields.length === 0) errors.push("Tambahkan minimal satu field.");
  const ids = draft.fields.map((field) => field.id);
  if (new Set(ids).size !== ids.length) errors.push("Field tidak boleh duplikat.");
  if (draft.fields.some((field) => !field.label.trim() || field.label.length > 80)) {
    errors.push("Setiap field harus memiliki label (maksimal 80 karakter).");
  }
  if (draft.capabilities.length === 0) errors.push("Pilih minimal satu fungsi kartu.");
  if (new Set(draft.capabilities).size !== draft.capabilities.length) errors.push("Fungsi kartu tidak boleh duplikat.");
  return errors;
}
