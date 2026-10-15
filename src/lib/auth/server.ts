import "server-only";

import { createNeonAuth } from "@neondatabase/auth/next/server";

/** Create a server-side Neon Auth client only when required secrets are present. */
export function getAuth() {
  const baseUrl = process.env.NEON_AUTH_BASE_URL?.trim();
  const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET?.trim();

  if (!baseUrl || !cookieSecret || cookieSecret.length < 32) {
    throw new Error("Authentication is not configured");
  }

  return createNeonAuth({
    baseUrl,
    cookies: { secret: cookieSecret },
  });
}
