import { describe, expect, it } from "vitest";
import { createQrCredential, hashQrCredential, parseFutureExpiry } from "../src/lib/card-credentials";

describe("QR credential primitives", () => {
  it("generates distinct high-entropy URL-safe tokens and a 32-byte hash", () => {
    const first = createQrCredential();
    const second = createQrCredential();
    expect(first.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(first.token).not.toBe(second.token);
    expect(first.tokenHash).toBeInstanceOf(Buffer);
    expect(first.tokenHash).toHaveLength(32);
  });

  it("hashes the token deterministically without using the raw token as a hash", () => {
    const credential = createQrCredential();
    expect(hashQrCredential(credential.token).equals(credential.tokenHash)).toBe(true);
    expect(credential.tokenHash.toString("utf8")).not.toBe(credential.token);
  });

  it("rejects malformed tokens before database lookup", () => {
    expect(() => hashQrCredential("student-123")).toThrow();
    expect(() => hashQrCredential("")).toThrow();
  });

  it("accepts a future ISO expiry only when an explicit timezone is present", () => {
    const now = new Date("2026-10-15T00:00:00.000Z");
    expect(parseFutureExpiry("2026-10-16T00:00:00Z", now)?.toISOString()).toBe("2026-10-16T00:00:00.000Z");
    expect(parseFutureExpiry("2026-10-16T00:00:00", now)).toBeUndefined();
    expect(parseFutureExpiry("2026-10-14T23:59:59Z", now)).toBeUndefined();
    expect(parseFutureExpiry("not-a-date", now)).toBeUndefined();
    expect(parseFutureExpiry(null, now)).toBeNull();
  });
});
