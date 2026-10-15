import { createNeonAuth } from "@neondatabase/auth/next/server";

type NeonAuthInstance = ReturnType<typeof createNeonAuth>;

let authInstance: NeonAuthInstance | undefined;

export function getAuth(): NeonAuthInstance {
  if (authInstance) return authInstance;

  const baseUrl = process.env.NEON_AUTH_BASE_URL;
  const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET;

  if (!baseUrl || !cookieSecret || cookieSecret.length < 32) {
    throw new Error(
      "Neon Auth is not configured. Set NEON_AUTH_BASE_URL and a 32+ character NEON_AUTH_COOKIE_SECRET.",
    );
  }

  authInstance = createNeonAuth({
    baseUrl,
    cookies: { secret: cookieSecret },
  });

  return authInstance;
}
