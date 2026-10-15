import { createHash, randomBytes } from "node:crypto";

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

/** Generate a 256-bit URL-safe credential. Return the raw token only to the issuer response. */
export function createQrCredential(): { token: string; tokenHash: Buffer } {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashQrCredential(token) };
}

/** Hash a syntactically valid credential for database lookup; never log the input. */
export function hashQrCredential(token: string): Buffer {
  if (!TOKEN_PATTERN.test(token)) {
    throw new Error("Invalid QR credential format");
  }
  return createHash("sha256").update(token, "utf8").digest();
}

/** Accept only explicit ISO timestamps with a timezone and a future expiry. */
export function parseFutureExpiry(value: unknown, now = new Date()): Date | null | undefined {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || value.length > 40) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) {
    return undefined;
  }
  const date = new Date(value);
  if (!Number.isFinite(date.getTime()) || date.getTime() <= now.getTime()) return undefined;
  return date;
}
