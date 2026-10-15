import { isIP } from "node:net";
import { NextResponse } from "next/server";
import { hashQrCredential } from "@/lib/card-credentials";
import { consumeDigitalCardRateLimit } from "@/lib/digital-card-rate-limit";
import { withAuthenticatedDb } from "@/lib/db";
import { readJsonBodyLimited } from "@/lib/http-json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store, max-age=0", Pragma: "no-cache" };
const jsonError = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status, headers: NO_STORE });

/**
 * Minimal public verification: never returns names, claims, subject references,
 * card numbers, or token hashes. It is disabled until a trusted reverse proxy
 * overwrites x-real-ip and the database rate-limit migration is installed.
 */
export async function POST(request: Request) {
  if (process.env.DIGITAL_CARD_PUBLIC_VERIFY_ENABLED !== "true") {
    return jsonError("Verifikasi kartu belum diaktifkan pada lingkungan ini", 503);
  }
  if (process.env.DIGITAL_CARD_TRUSTED_PROXY_IP_ENABLED !== "true") {
    return jsonError("Konfigurasi proxy tepercaya belum diverifikasi", 503);
  }
  const rateLimitSecret = process.env.DIGITAL_CARD_RATE_LIMIT_SECRET?.trim();
  if (!rateLimitSecret || rateLimitSecret.length < 32) {
    return jsonError("Konfigurasi pengaman verifikasi belum lengkap", 503);
  }

  const clientIp = request.headers.get("x-real-ip")?.trim() ?? "";
  if (!clientIp || isIP(clientIp) === 0) {
    return jsonError("Verifikasi belum tersedia pada konfigurasi jaringan ini", 503);
  }

  try {
    const parsed = await readJsonBodyLimited(request, 2_048);
    if (!parsed.ok) return jsonError(parsed.message, parsed.status);
    if (!parsed.value || typeof parsed.value !== "object" || Array.isArray(parsed.value)) {
      return jsonError("Permintaan verifikasi tidak valid", 400);
    }
    const token = typeof (parsed.value as Record<string, unknown>).qrToken === "string"
      ? ((parsed.value as Record<string, unknown>).qrToken as string)
      : "";

    const verification = await withAuthenticatedDb("public-card-verifier", async (client) => {
      const allowed = await consumeDigitalCardRateLimit(
        client, rateLimitSecret, "verify", "public", clientIp, 120, 60,
      );
      if (!allowed) return { kind: "rate_limited" as const };
      if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return { kind: "invalid" as const };

      const tokenHash = hashQrCredential(token);
      const result = await client.query<{
        valid: boolean;
        issuer_name: string | null;
        card_type_id: string | null;
        card_status: string | null;
        expires_at: Date | null;
      }>(
        "SELECT valid, issuer_name, card_type_id, card_status, expires_at FROM public.verify_digital_card($1)",
        [tokenHash],
      );
      const row = result.rows[0];
      if (!row?.valid) return { kind: "invalid" as const };
      return { kind: "valid" as const, issuerName: row.issuer_name, cardTypeId: row.card_type_id, expiresAt: row.expires_at };
    });

    if (verification.kind === "rate_limited") {
      return jsonError("Terlalu banyak permintaan verifikasi; coba lagi setelah beberapa saat", 429);
    }
    if (verification.kind === "invalid") {
      return NextResponse.json({ valid: false }, { headers: NO_STORE });
    }
    return NextResponse.json({
      valid: true,
      issuerName: verification.issuerName,
      cardTypeId: verification.cardTypeId,
      status: "active",
      expiresAt: verification.expiresAt,
    }, { headers: NO_STORE });
  } catch {
    return jsonError("Layanan verifikasi kartu sementara tidak tersedia", 503);
  }
}
