"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth/client";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      const result = await authClient.signIn.email({ email: email.trim(), password });
      if (result.error) {
        setError("Email atau kata sandi tidak sesuai, atau layanan autentikasi belum siap.");
        return;
      }
      window.location.assign("/");
    } catch {
      setError("Layanan masuk belum dapat dihubungi. Coba lagi nanti.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page-shell auth-shell">
      <section className="auth-panel" aria-labelledby="signin-title">
        <Link className="auth-back-link" href="/">← Kembali ke halaman KPD</Link>
        <p className="eyebrow">KARTU PELAJAR DIGITAL · AKSES INSTITUSI</p>
        <h1 id="signin-title">Masuk ke KPD</h1>
        <p className="auth-copy">Gunakan akun yang telah disiapkan oleh administrator sekolah atau institusi.</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="email">Email institusi</label>
          <input
            autoComplete="username"
            id="email"
            name="email"
            type="email"
            required
            maxLength={254}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <label htmlFor="password">Kata sandi</label>
          <input
            autoComplete="current-password"
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            maxLength={128}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {error ? <p className="auth-error" role="alert">{error}</p> : null}
          <button className="auth-submit" type="submit" disabled={busy}>
            {busy ? "Memeriksa..." : "Masuk"}
          </button>
        </form>
        <p className="auth-notice">
          Pendaftaran mandiri tidak dibuka. Login saja belum memberikan akses ke data sekolah; hak akses harus ditetapkan oleh administrator.
        </p>
      </section>
    </main>
  );
}
