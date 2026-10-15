import { getCardType, type CardFieldId, type CardTypeDefinition } from "@/lib/card-types/registry";

export type CardClaims = Record<string, string>;

export type ClaimValidationResult =
  | { ok: true; publicClaims: CardClaims; privateClaims: CardClaims }
  | { ok: false; errors: string[] };

const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;

function parseClaims(value: unknown, label: string, errors: string[]): CardClaims {
  if (value === undefined) return {};
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    errors.push(label + " harus berupa objek key-value teks.");
    return {};
  }

  const output: CardClaims = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (typeof raw !== "string") {
      errors.push(label + " hanya boleh berisi teks.");
      continue;
    }
    const normalized = raw.trim();
    if (!normalized || normalized.length > 500 || CONTROL_CHARS.test(normalized)) {
      errors.push("Nilai field " + key + " kosong, terlalu panjang, atau mengandung karakter kontrol.");
      continue;
    }
    output[key] = normalized;
  }
  return output;
}

/** Allow only registered fields, keeping private-by-default fields out of public claims. */
export function validateCardClaims(
  cardTypeId: string,
  publicInput: unknown,
  privateInput: unknown,
): ClaimValidationResult {
  const type = getCardType(cardTypeId);
  if (!type) return { ok: false, errors: ["Jenis kartu tidak dikenal."] };

  const errors: string[] = [];
  const publicClaims = parseClaims(publicInput, "publicClaims", errors);
  const privateClaims = parseClaims(privateInput, "privateClaims", errors);
  const definitions = new Map(type.fields.map((field) => [field.id, field]));
  const allowedPublic = new Set(type.fields.filter((field) => !field.privateByDefault).map((field) => field.id));
  const allowedPrivate = new Set(type.fields.filter((field) => field.privateByDefault).map((field) => field.id));

  for (const key of Object.keys(publicClaims)) {
    if (!definitions.has(key as CardFieldId)) errors.push("Field tidak terdaftar: " + key + ".");
    else if (!allowedPublic.has(key as CardFieldId)) errors.push("Field " + key + " harus disimpan sebagai privat.");
  }
  for (const key of Object.keys(privateClaims)) {
    if (!definitions.has(key as CardFieldId)) errors.push("Field tidak terdaftar: " + key + ".");
    else if (!allowedPrivate.has(key as CardFieldId)) errors.push("Field " + key + " tidak ditandai privat.");
  }

  for (const field of type.fields) {
    if (!field.required || field.id === "issuer_name") continue;
    const value = field.privateByDefault ? privateClaims[field.id] : publicClaims[field.id];
    if (!value) errors.push("Field wajib belum diisi: " + field.id + ".");
  }

  if (errors.length) return { ok: false, errors };
  return { ok: true, publicClaims, privateClaims };
}

/** Use the authoritative issuer name rather than trusting an operator-supplied issuer claim. */
export function bindIssuerName(
  type: CardTypeDefinition,
  claims: ClaimValidationResult,
  issuerName: string,
): ClaimValidationResult {
  if (!claims.ok) return claims;
  if (!type.fields.some((field) => field.id === "issuer_name")) return claims;
  return {
    ...claims,
    publicClaims: { ...claims.publicClaims, issuer_name: issuerName },
  };
}
