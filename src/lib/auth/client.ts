import { createAuthClient } from "@neondatabase/auth";

const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// The browser talks to this app's /api/auth route; the server proxies to Neon Auth.
export const authClient = createAuthClient(appBaseUrl);
