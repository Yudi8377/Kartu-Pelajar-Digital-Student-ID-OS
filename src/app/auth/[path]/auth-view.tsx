"use client";

import Link from "next/link";
import { AuthView, NeonAuthUIProvider } from "@neondatabase/auth-ui";
import { createAuthClient } from "@neondatabase/auth/next";
import "@neondatabase/auth-ui/css";

const authClient = createAuthClient();

export function AuthPageView({ path }: { path: string }) {
  return (
    <main className="auth-shell">
      <Link className="auth-back" href="/">← Kembali ke Student ID OS</Link>
      <section className="auth-panel">
        <p className="auth-eyebrow">KARTU PELAJAR DIGITAL</p>
        <h1>Akun Student ID OS</h1>
        <p className="auth-description">Gunakan akun resmi untuk melanjutkan. Membuat akun belum otomatis memberikan akses ke data sekolah.</p>
        <NeonAuthUIProvider authClient={authClient} redirectTo="/admin">
          <AuthView path={path} />
        </NeonAuthUIProvider>
      </section>
    </main>
  );
}
