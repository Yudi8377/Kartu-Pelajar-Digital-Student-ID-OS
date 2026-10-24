import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetAuth, mockWithAuthenticatedDb } = vi.hoisted(() => ({
  mockGetAuth: vi.fn(),
  mockWithAuthenticatedDb: vi.fn(),
}));

vi.mock("@/lib/auth/server", () => ({ getAuth: mockGetAuth }));
vi.mock("@/lib/db", () => ({ withAuthenticatedDb: mockWithAuthenticatedDb }));

import { POST as issueCard } from "../src/app/api/digital-cards/route";
import { PATCH as revokeCard } from "../src/app/api/digital-cards/[cardId]/route";

const issuerId = "d9b1b6a1-62d2-4b6d-9bb3-6fdf0e8bde31";
const cardId = "a2a7caa1-65f1-49bd-a9c0-2eeb6ef9b126";

function jsonRequest(url: string, method: string, body: unknown) {
  return new Request(url, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function setupDatabase(responses: unknown[]) {
  const query = vi.fn();
  for (const response of responses) query.mockResolvedValueOnce(response);
  mockWithAuthenticatedDb.mockImplementation(async (_subject: string, operation: (client: { query: typeof query }) => Promise<unknown>) => operation({ query }));
  return query;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAuth.mockReturnValue({
    getSession: vi.fn().mockResolvedValue({ data: { user: { id: "auth-user-test" } } }),
  });
});

describe("digital card lifecycle API", () => {
  it("issues a high-entropy token once and passes only its hash to storage", async () => {
    const query = setupDatabase([
      { rows: [{ allowed: true }] },
      { rows: [{ user_id: "user-row-test" }] },
      { rows: [{ id: cardId, card_number: "TEST-0001", card_type_id: "student_id", status: "active", issued_at: new Date("2026-10-24T00:00:00Z"), expires_at: null }] },
      { rows: [], rowCount: 1 },
    ]);

    const response = await issueCard(jsonRequest("https://example.test/api/digital-cards", "POST", {
      issuerId,
      cardNumber: "TEST-0001",
      cardTypeId: "student_id",
      subjectRef: "opaque-subject-reference",
    }));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.card.id).toBe(cardId);
    expect(body.credential.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(body.credential.token).not.toContain("TEST-0001");
    expect(query).toHaveBeenCalledTimes(4);
    const insertCall = query.mock.calls[2] as [string, unknown[]];
    expect(insertCall[0]).toContain("credential_hash");
    expect(insertCall[1][4]).toBeInstanceOf(Buffer);
    expect((insertCall[1][4] as Buffer)).toHaveLength(32);
    expect(JSON.stringify(query.mock.calls)).not.toContain(body.credential.token);
  });

  it("rejects an unsupported card type before database access", async () => {
    const response = await issueCard(jsonRequest("https://example.test/api/digital-cards", "POST", {
      issuerId,
      cardNumber: "TEST-0002",
      cardTypeId: "government_passport",
      subjectRef: "opaque-reference",
    }));

    expect(response.status).toBe(400);
    expect(mockWithAuthenticatedDb).not.toHaveBeenCalled();
  });

  it("does not issue a card to an unauthenticated caller", async () => {
    mockGetAuth.mockReturnValue({
      getSession: vi.fn().mockResolvedValue({ data: { user: null } }),
    });

    const response = await issueCard(jsonRequest("https://example.test/api/digital-cards", "POST", {
      issuerId,
      cardNumber: "TEST-0003",
      cardTypeId: "student_id",
      subjectRef: "opaque-reference",
    }));

    expect(response.status).toBe(401);
    expect(mockWithAuthenticatedDb).not.toHaveBeenCalled();
  });

  it("revokes an active card and writes the audit event in the transaction", async () => {
    const query = setupDatabase([
      { rows: [{ allowed: true }] },
      { rows: [{ user_id: "user-row-test" }] },
      { rows: [{ id: cardId, status: "revoked", revoked_at: new Date("2026-10-24T00:00:00Z") }] },
      { rows: [], rowCount: 1 },
    ]);

    const response = await revokeCard(
      jsonRequest("https://example.test/api/digital-cards/" + cardId, "PATCH", { issuerId, reason: "replaced" }),
      { params: Promise.resolve({ cardId }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.card.status).toBe("revoked");
    expect(query).toHaveBeenCalledTimes(4);
    expect(query.mock.calls[2]?.[0]).toContain("status = 'revoked'");
    expect(query.mock.calls[3]?.[0]).toContain("credential_revoked");
  });
});
