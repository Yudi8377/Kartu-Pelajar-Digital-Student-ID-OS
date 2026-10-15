import { createAuthClient } from "@neondatabase/auth/next";

// Uses the same-origin /api/auth route configured in this application.
export const authClient = createAuthClient();
