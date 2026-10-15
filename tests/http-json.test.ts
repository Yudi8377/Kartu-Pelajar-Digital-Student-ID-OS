import { describe, expect, it } from "vitest";
import { readJsonBodyLimited } from "../src/lib/http-json";

describe("readJsonBodyLimited", () => {
  it("parses valid JSON within the byte limit", async () => {
    const request = new Request("https://example.test/api", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ schoolId: "demo" }),
    });
    await expect(readJsonBodyLimited(request, 100)).resolves.toEqual({
      ok: true,
      value: { schoolId: "demo" },
    });
  });

  it("rejects non-JSON content types", async () => {
    const request = new Request("https://example.test/api", {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: "{}",
    });
    await expect(readJsonBodyLimited(request, 100)).resolves.toMatchObject({
      ok: false,
      status: 415,
    });
  });

  it("rejects oversized bodies", async () => {
    const request = new Request("https://example.test/api", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ value: "x".repeat(200) }),
    });
    await expect(readJsonBodyLimited(request, 32)).resolves.toMatchObject({
      ok: false,
      status: 413,
    });
  });

  it("rejects malformed JSON", async () => {
    const request = new Request("https://example.test/api", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{",
    });
    await expect(readJsonBodyLimited(request, 100)).resolves.toMatchObject({
      ok: false,
      status: 400,
    });
  });
});
