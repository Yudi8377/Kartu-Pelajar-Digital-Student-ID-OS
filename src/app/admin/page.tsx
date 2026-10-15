import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth/server";
import AdminCardDesigner from "./admin-card-designer";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  let session: Awaited<ReturnType<ReturnType<typeof getAuth>["getSession"]>> | null = null;
  try {
    session = await getAuth().getSession();
  } catch {
    return (
      <main className="auth-shell">
        <section className="auth-panel">
          <p className="auth-eyebrow">KONFIGURASI DIPERLUKAN</p>
          <h1>Ruang admin belum tersedia</h1>
          <p>Login belum dapat digunakan karena konfigurasi autentikasi server belum lengkap. Tidak ada data sekolah yang ditampilkan.</p>
          <Link href="/">Kembali ke halaman utama</Link>
        </section>
      </main>
    );
  }
  if (!session?.data?.user) redirect("/auth/sign-in");

  return <AdminCardDesigner />;
}
