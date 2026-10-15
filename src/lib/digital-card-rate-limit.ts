import { createHmac } from "node:crypto";
import type { PoolClient } from "pg";

/** Atomic PostgreSQL-backed rate limiting; raw actor and issuer IDs are never stored as bucket keys. */
export async function consumeDigitalCardRateLimit(
  client: PoolClient,
  secret: string,
  operation: "issue" | "revoke",
  issuerId: string,
  actorId: string,
  maxHits: number,
): Promise<boolean> {
  if (secret.length < 32) throw new Error("Rate-limit secret is not configured");
  const bucketHash = createHmac("sha256", secret)
    .update(operation).update(":").update(issuerId).update(":").update(actorId).digest("hex");
  const result = await client.query<{ allowed: boolean }>(
    "SELECT public.consume_digital_card_rate_limit($1, 3600, $2) AS allowed",
    [bucketHash, maxHits],
  );
  return result.rows[0]?.allowed === true;
}
