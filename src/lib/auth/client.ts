import { createAuthClient } from "@neondatabase/auth";

const appBaseUrl =
  typeof window === "undefined"
    ? process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    : window.location.origin;

// The browser talks to this app's /api/auth route; the server proxies to Neon Auth.
export const authClient = createAuthClient(appBaseUrl);
