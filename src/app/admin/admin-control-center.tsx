"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import "./admin-control-center.css";

type SectionId = "overview" | "issuers" | "card-types" | "holders" | "credentials" | "verification" | "plans" | "users" | "audit" | "settings";
type Membership = { school_id: string; school_name: string; role: string };
type Student = { id: string; student_number: string; full_name: string; class_label: string | null; status: string; created_at: string };
type Profile = { user: { id: string; displayName: string; email: string | null }; memberships: Membership[] };
type CardType = { id: string; name: string; description: string; status: string; issuer: string; fields: string };

const nav: { id: SectionId; title: string; subtitle: string; icon: string }[] = [
  { id: "overview", title: "Ringkasan operasional", subtitle: "Status layanan & pekerjaan", icon: "◫" },
  { id: "issuers", title: "Organisasi & penerbit", subtitle: "Sekolah, lembaga, pemilik kartu", icon: "▦" },
  { id: "card-types", title: "Jenis kartu & template", subtitle: "Aturan field dan kapabilitas", icon: "▤" },
  { id: "holders", title: "Pemegang kartu", subtitle: "Data siswa dan pemegang", icon: "♙" },
  { id: "credentials", title: "Penerbitan & pencabutan", subtitle: "Siklus hidup kredensial", icon: "▣" },
  { id: "verification", title: "Verifikasi QR", subtitle: "Pemeriksaan validitas kartu", icon: "⌗" },
  { id: "plans", title: "Paket & penagihan", subtitle: "Paket layanan dan transaksi", icon: "◈" },
  { id: "users", title: "Pengguna & hak akses", subtitle: "Keanggotaan dan peran", icon: "♧" },
  { id: "audit", title: "Audit & keamanan", subtitle: "Jejak tindakan dan kesiapan", icon: "◉" },
  { id: "settings", title: "Pengaturan sistem", subtitle: "Identitas platform dan kebijakan", icon: "⚙" },
];

const cardTypes: CardType[] = [
  { id: "student_id", name: "Kartu Pelajar Digital", description: "Identitas siswa, sekolah, masa berlaku, dan alur kehadiran.", status: "Siap untuk desain", issuer: "Sekolah / lembaga pendidikan", fields: "Nama, penerbit, sekolah, nomor siswa (privat), masa berlaku" },
  { id: "project_identity", name: "Identitas Proyek", description: "Identitas tim, peran, dan periode penugasan.", status: "Siap untuk desain", issuer: "Pemilik proyek / organisasi", fields: "Nama, penerbit, proyek, peran, masa berlaku" },
  { id: "digital_name_card", name: "Kartu Nama Digital", description: "Profil profesional dengan kontrol berbagi kontak.", status: "Siap untuk desain", issuer: "Pemilik profil / organisasi", fields: "Nama, penerbit, profesi, email privat, telepon privat" },
  { id: "event_participant", name: "Kartu Peserta Kegiatan", description: "Identitas peserta, akses acara, dan kehadiran.", status: "Siap untuk desain", issuer: "Penyelenggara acara", fields: "Nama, penerbit, kegiatan, ID peserta privat, masa berlaku" },
  { id: "organization_membership", name: "Kartu Keanggotaan", description: "Status anggota, peran, dan periode keanggotaan.", status: "Siap untuk desain", issuer: "Organisasi penerbit", fields: "Nama, penerbit, organisasi, nomor anggota privat, peran" },
  { id: "achievement_certificate", name: "Kartu Prestasi & Sertifikat", description: "Ringkasan pencapaian yang dirujukkan ke penerbit.", status: "Perlu tinjauan penerbit", issuer: "Sekolah / lembaga pemberi penghargaan", fields: "Nama, penerbit, pencapaian, institusi, masa berlaku" },
  { id: "hajj_umrah_service", name: "Kartu Layanan Haji/Umrah", description: "Prototipe alur layanan untuk penyelenggara yang berwenang; bukan dokumen perjalanan.", status: "Prototipe — penerbitan diblokir", issuer: "Penyelenggara berwenang", fields: "Nama, penerbit, referensi layanan privat, masa berlaku" },
];

const readiness = [
  ["Autentikasi server", "Memerlukan konfigurasi host dan uji sesi"],
  ["Penyimpanan database", "API ada; kredensial runtime belum terverifikasi"],
  ["Isolasi antarorganisasi", "Kebijakan tersedia; uji integrasi wajib"],
  ["Penerbitan & pencabutan", "API fail-closed; belum diaktifkan"],
  ["Verifikasi QR publik", "Dinonaktifkan sampai proxy dan rate limit diverifikasi"],
  ["Paket & pembayaran", "Belum ada gateway transaksi yang terhubung"],
];

export default function AdminControlCenter() {
  const [active, setActive] = useState<SectionId>("overview");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [schoolId, setSchoolId] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentLoading, setStudentLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [newStudent, setNewStudent] = useState({ fullName: "", studentNumber: "", classLabel: "" });
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [cardTypeSearch, setCardTypeSearch] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [verificationResult, setVerificationResult] = useState("");
  const [checkingVerification, setCheckingVerification] = useState(false);
  const [planDraft, setPlanDraft] = useState({ name: "Starter", price: "0", quota: "50", period: "bulanan" });
  const [settingsDraft, setSettingsDraft] = useState({ platformName: "Digital Card OS", supportEmail: "", retentionDays: "365" });
  const [localSaved, setLocalSaved] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/me", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Profil admin tidak dapat dimuat.");
      const nextProfile = body as Profile;
      setProfile(nextProfile);
      if (nextProfile.memberships?.length) setSchoolId((current) => current || nextProfile.memberships[0].school_id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Layanan profil belum tersedia.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStudents = useCallback(async (id: string) => {
    if (!id) { setStudents([]); return; }
    setStudentLoading(true);
    setError("");
    try {
      const response = await fetch("/api/students?schoolId=" + encodeURIComponent(id), { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Daftar pemegang kartu tidak dapat dimuat.");
      setStudents(Array.isArray(body.students) ? body.students : []);
    } catch (cause) {
      setStudents([]);
      setError(cause instanceof Error ? cause.message : "Data pemegang belum tersedia.");
    } finally {
      setStudentLoading(false);
    }
  }, []);

  useEffect(() => { void loadProfile(); }, [loadProfile]);
  useEffect(() => { if (schoolId) void loadStudents(schoolId); }, [schoolId, loadStudents]);

  const filteredStudents = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("id");
    if (!term) return students;
    return students.filter((student) => [student.full_name, student.student_number, student.class_label || "", student.status].some((value) => value.toLocaleLowerCase("id").includes(term)));
  }, [students, query]);

  const currentSchool = profile?.memberships?.find((membership) => membership.school_id === schoolId);
  const filteredTypes = cardTypes.filter((type) => (type.name + " " + type.id + " " + type.description).toLocaleLowerCase("id").includes(cardTypeSearch.toLocaleLowerCase("id")));

  async function createStudent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!schoolId) { setError("Pilih organisasi/sekolah yang memiliki akses aktif terlebih dahulu."); return; }
    setError(""); setNotice("");
    try {
      const response = await fetch("/api/students", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ schoolId, fullName: newStudent.fullName.trim(), studentNumber: newStudent.studentNumber.trim(), classLabel: newStudent.classLabel.trim() || null }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Data tidak berhasil disimpan.");
      setNotice("Data pemegang berhasil disimpan ke layanan server.");
      setNewStudent({ fullName: "", studentNumber: "", classLabel: "" });
      setShowStudentForm(false);
      await loadStudents(schoolId);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Penyimpanan gagal.");
    }
  }

  async function verifyCard(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCheckingVerification(true); setVerificationResult(""); setError("");
    try {
      const response = await fetch("/api/digital-cards/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ qrToken: verificationToken.trim() }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Layanan verifikasi belum tersedia.");
      setVerificationResult(body.valid ? "VALID — penerbit: " + body.issuerName + "; jenis: " + body.cardTypeId + "; berlaku sampai: " + (body.expiresAt || "tidak ditentukan") : "TIDAK VALID — kartu tidak dapat diverifikasi.");
    } catch (cause) {
      setVerificationResult(cause instanceof Error ? cause.message : "Verifikasi belum tersedia.");
    } finally { setCheckingVerification(false); }
  }

  function saveLocalDraft(kind: "plan" | "settings") {
    try {
      const key = kind === "plan" ? "digital-card-os-admin-plan-draft-v1" : "digital-card-os-admin-settings-draft-v1";
      const value = kind === "plan" ? planDraft : settingsDraft;
      window.localStorage.setItem(key, JSON.stringify(value));
      setLocalSaved(true);
      setNotice(kind === "plan" ? "Draf paket disimpan di browser ini saja. Belum menjadi paket komersial aktif." : "Draf pengaturan disimpan di browser ini saja. Belum mengubah konfigurasi server.");
    } catch {
      setError("Browser tidak mengizinkan penyimpanan lokal.");
    }
  }

  const pageTitle = nav.find((item) => item.id === active)?.title || "Admin Control Center";

  return (
    <main className="dcc-shell">
      <aside className="dcc-sidebar">
        <Link className="dcc-brand" href="/" aria-label="Kembali ke situs publik"><span className="dcc-brand-mark">DC</span><span>Digital Card OS<small>CONTROL CENTER</small></span></Link>
        <div className="dcc-tenant-label">ORGANISASI AKTIF</div>
        {profile?.memberships?.length ? <select className="dcc-tenant-select" aria-label="Pilih organisasi aktif" value={schoolId} onChange={(event) => setSchoolId(event.target.value)}>{profile.memberships.map((membership) => <option key={membership.school_id} value={membership.school_id}>{membership.school_name}</option>)}</select> : <div className="dcc-no-tenant">{loading ? "Memuat akses…" : "Belum ada organisasi aktif"}</div>}
        <nav className="dcc-nav" aria-label="Modul admin">{nav.map((item) => <button key={item.id} type="button" className={active === item.id ? "dcc-nav-item is-active" : "dcc-nav-item"} onClick={() => { setActive(item.id); setNotice(""); setError(""); }}><span className="dcc-nav-icon" aria-hidden="true">{item.icon}</span><span><strong>{item.title}</strong><small>{item.subtitle}</small></span></button>)}</nav>
        <div className="dcc-sidebar-footer"><span className="dcc-status-dot" /> Mode aman · data organisasi terbatas<Link href="/">Lihat situs publik ↗</Link></div>
      </aside>

      <section className="dcc-main">
        <header className="dcc-topbar"><div><p className="dcc-eyebrow">ADMINISTRATION / DIGITAL CARD OS</p><h1>{pageTitle}</h1></div><div className="dcc-user-chip"><span className="dcc-avatar">{(profile?.user?.displayName || "A").slice(0, 1).toUpperCase()}</span><span><strong>{profile?.user?.displayName || (loading ? "Memuat akun…" : "Admin")}</strong><small>{currentSchool?.role || "Peran belum ditetapkan"}</small></span></div></header>

        {error && <div className="dcc-alert dcc-alert-error" role="alert"><strong>Perlu tindakan</strong><span>{error}</span></div>}
        {notice && <div className="dcc-alert dcc-alert-success" role="status"><strong>Status tindakan</strong><span>{notice}</span><button type="button" onClick={() => setNotice("")} aria-label="Tutup notifikasi">×</button></div>}

        {active === "overview" && <div className="dcc-page">
          <div className="dcc-welcome"><div><p className="dcc-eyebrow">WORKSPACE OPERASIONAL</p><h2>Kontrol nyata, status transparan.</h2><p>Kelola data yang sudah memiliki API, siapkan konfigurasi modul, dan lihat dengan jelas integrasi mana yang masih diblokir sebelum produksi.</p></div><span className="dcc-env-pill">RELEASE GATE AKTIF</span></div>
          <div className="dcc-metric-grid"><article className="dcc-metric"><span>Organisasi yang dapat diakses</span><strong>{profile?.memberships?.length ?? "—"}</strong><small>Dari keanggotaan akun aktif</small></article><article className="dcc-metric"><span>Pemegang di organisasi terpilih</span><strong>{studentLoading ? "…" : students.length}</strong><small>Data dari API sekolah · maks. 200</small></article><article className="dcc-metric"><span>Jenis kartu terdaftar</span><strong>{cardTypes.length}</strong><small>Berbeda status desain dan produksi</small></article><article className="dcc-metric"><span>Integrasi produksi terblokir</span><strong>{readiness.filter((item) => item[1].includes("belum") || item[1].includes("wajib") || item[1].includes("Memerlukan")).length}</strong><small>Periksa Audit & keamanan</small></article></div>
          <div className="dcc-two-col"><section className="dcc-panel"><div className="dcc-panel-head"><div><p className="dcc-eyebrow">ANTRIAN TINDAKAN</p><h3>Yang perlu diselesaikan</h3></div><span className="dcc-neutral-pill">Release gate</span></div><ol className="dcc-task-list"><li><span>01</span><div><strong>Konfigurasi server dan database runtime</strong><p>Siapkan secret di host; verifikasi koneksi memakai role terbatas, bukan pemilik database.</p></div><b>Prioritas P0</b></li><li><span>02</span><div><strong>Uji isolasi tenant</strong><p>Buktikan akun organisasi A tidak dapat membaca atau mengubah data organisasi B.</p></div><b>Prioritas P0</b></li><li><span>03</span><div><strong>Aktifkan lifecycle dan QR setelah pengujian</strong><p>Perlu konfigurasi rate limit, proxy tepercaya, audit, dan tes kartu kedaluwarsa/dicabut.</p></div><b>Prioritas P0</b></li><li><span>04</span><div><strong>Integrasi paket dan pembayaran</strong><p>Belum ada gateway pembayaran atau rekonsiliasi transaksi di aplikasi.</p></div><b>Komersial</b></li></ol></section><section className="dcc-panel"><div className="dcc-panel-head"><div><p className="dcc-eyebrow">AKSES AKTIF</p><h3>Organisasi & peran</h3></div><button className="dcc-link-button" type="button" onClick={() => setActive("issuers")}>Kelola →</button></div>{profile?.memberships?.length ? profile.memberships.map((membership) => <div className="dcc-membership-row" key={membership.school_id}><span className="dcc-org-icon">▦</span><span><strong>{membership.school_name}</strong><small>{membership.role.replaceAll("_", " ")}</small></span><span className="dcc-active-pill">Aktif</span></div>) : <div className="dcc-empty"><strong>Belum ada keanggotaan organisasi</strong><p>Login saja tidak otomatis memberikan hak admin sekolah. Minta administrator resmi menambahkan keanggotaan setelah proses verifikasi.</p></div>}</section></div>
        </div>}

        {active === "issuers" && <div className="dcc-page"><div className="dcc-section-intro"><h2>Organisasi & penerbit</h2><p>Kelola konteks organisasi yang akun Anda sudah berwenang akses. Pembuatan organisasi baru memerlukan proses onboarding dan persetujuan penerbit; tidak ada hak admin yang diberikan otomatis.</p></div><div className="dcc-panel"><div className="dcc-panel-head"><div><h3>Daftar organisasi yang terhubung</h3><p>Keanggotaan aktif dari sesi server</p></div><span className="dcc-neutral-pill">{profile?.memberships?.length ?? 0} organisasi</span></div>{profile?.memberships?.length ? <div className="dcc-table-wrap"><table className="dcc-table"><thead><tr><th>Nama organisasi</th><th>ID tenant</th><th>Peran akun</th><th>Status akses</th><th>Tindakan</th></tr></thead><tbody>{profile.memberships.map((membership) => <tr key={membership.school_id}><td><strong>{membership.school_name}</strong></td><td><code>{membership.school_id}</code></td><td>{membership.role.replaceAll("_", " ")}</td><td><span className="dcc-active-pill">Aktif</span></td><td><button className="dcc-small-button" type="button" onClick={() => { setSchoolId(membership.school_id); setActive("holders"); }}>Buka data →</button></td></tr>)}</tbody></table></div> : <div className="dcc-empty"><strong>Belum ada organisasi yang terhubung</strong><p>Endpoint saat ini hanya menampilkan organisasi yang sudah ditetapkan di database. Pendaftaran organisasi mandiri belum diaktifkan.</p></div>}</div><div className="dcc-panel dcc-note-panel"><h3>Alur onboarding penerbit</h3><div className="dcc-step-grid"><div><b>01 · Verifikasi</b><p>Validasi identitas legal, domain kontak, dan kewenangan penerbit.</p></div><div><b>02 · Penanggung jawab</b><p>Tetapkan admin organisasi dan operator; gunakan hak minimum.</p></div><div><b>03 · Konfigurasi</b><p>Tetapkan jenis kartu, data minimum, masa berlaku, serta prosedur pencabutan.</p></div><div><b>04 · Aktivasi</b><p>Aktifkan setelah uji isolasi, audit, dan persetujuan operasional.</p></div></div></div></div>}

        {active === "card-types" && <div className="dcc-page"><div className="dcc-section-intro"><h2>Jenis kartu & template</h2><p>Setiap jenis memiliki penerbit yang bertanggung jawab, daftar field, fungsi yang diizinkan, serta status kesiapan sendiri. Perubahan di layar ini belum mengubah registry server.</p></div><label className="dcc-search">Cari jenis kartu<input value={cardTypeSearch} onChange={(event) => setCardTypeSearch(event.target.value)} placeholder="Nama modul, ID, atau fungsi…" /></label><div className="dcc-card-type-grid">{filteredTypes.map((type) => <article className="dcc-type-card" key={type.id}><div className="dcc-type-card-top"><span className="dcc-type-symbol">▤</span><span className={type.id === "hajj_umrah_service" ? "dcc-warning-pill" : "dcc-neutral-pill"}>{type.status}</span></div><h3>{type.name}</h3><p>{type.description}</p><dl><dt>ID modul</dt><dd><code>{type.id}</code></dd><dt>Penerbit yang diharapkan</dt><dd>{type.issuer}</dd><dt>Field utama</dt><dd>{type.fields}</dd></dl><button className="dcc-secondary-button" type="button" onClick={() => { setNotice("Spesifikasi " + type.name + " dibuka. Perubahan template server belum diaktifkan; registry tetap menjadi sumber aturan produksi."); setLocalSaved(false); }}>Lihat aturan modul</button></article>)}</div><div className="dcc-panel dcc-warning-panel"><strong>Aturan keselamatan penerbitan</strong><p>Kartu layanan Haji/Umrah tetap prototipe dan bukan dokumen resmi. Kartu apa pun tidak boleh mengklaim pengakuan pemerintah tanpa kewenangan penerbit dan verifikasi yang sah.</p></div></div>}

        {active === "holders" && <div className="dcc-page"><div className="dcc-section-intro dcc-section-actions"><div><h2>Pemegang kartu</h2><p>Modul ini terhubung ke API siswa dan dibatasi pada organisasi terpilih. Data yang tampil berasal dari server; jangan gunakan data pribadi nyata saat lingkungan belum lulus release gate.</p></div><button className="dcc-primary-button" type="button" onClick={() => setShowStudentForm((value) => !value)} disabled={!schoolId}>＋ Tambah pemegang</button></div><div className="dcc-toolbar"><label className="dcc-search">Cari nama, nomor, kelas<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Contoh: NUSA-001" /></label><button className="dcc-secondary-button" type="button" onClick={() => void loadStudents(schoolId)} disabled={!schoolId || studentLoading}>{studentLoading ? "Memuat…" : "↻ Muat ulang"}</button></div>{showStudentForm && <form className="dcc-panel dcc-form-grid" onSubmit={createStudent}><div className="dcc-form-heading"><h3>Tambah pemegang baru</h3><p>Nomor siswa dinormalisasi server dan harus unik dalam organisasi.</p></div><label>Nama lengkap<input required maxLength={160} value={newStudent.fullName} onChange={(event) => setNewStudent({ ...newStudent, fullName: event.target.value })} /></label><label>Nomor siswa / ID internal<input required maxLength={64} value={newStudent.studentNumber} onChange={(event) => setNewStudent({ ...newStudent, studentNumber: event.target.value })} /></label><label>Kelas / kelompok (opsional)<input maxLength={80} value={newStudent.classLabel} onChange={(event) => setNewStudent({ ...newStudent, classLabel: event.target.value })} /></label><div className="dcc-form-actions"><button className="dcc-primary-button" type="submit">Simpan ke server</button><button className="dcc-secondary-button" type="button" onClick={() => setShowStudentForm(false)}>Batal</button></div></form>}<div className="dcc-panel"><div className="dcc-panel-head"><div><h3>Daftar pemegang</h3><p>{currentSchool?.school_name || "Pilih organisasi terlebih dahulu"} · maksimum 200 hasil</p></div><span className="dcc-neutral-pill">{filteredStudents.length} hasil</span></div>{studentLoading ? <div className="dcc-loading">Memuat data organisasi…</div> : !schoolId ? <div className="dcc-empty"><strong>Pilih organisasi</strong><p>Data pemegang tidak dapat dimuat sebelum ada organisasi aktif.</p></div> : filteredStudents.length ? <div className="dcc-table-wrap"><table className="dcc-table"><thead><tr><th>Nama pemegang</th><th>Nomor internal</th><th>Kelas / kelompok</th><th>Status data</th><th>Dibuat</th></tr></thead><tbody>{filteredStudents.map((student) => <tr key={student.id}><td><strong>{student.full_name}</strong><small className="dcc-cell-sub">ID: {student.id}</small></td><td>{student.student_number}</td><td>{student.class_label || "—"}</td><td><span className={student.status === "active" ? "dcc-active-pill" : "dcc-neutral-pill"}>{student.status}</span></td><td>{student.created_at ? new Date(student.created_at).toLocaleDateString("id-ID") : "—"}</td></tr>)}</tbody></table></div> : <div className="dcc-empty"><strong>Belum ada data pemegang</strong><p>Tambahkan data uji hanya setelah server rehearsal dan kebijakan privasi siap.</p></div>}</div></div>}

        {active === "credentials" && <div className="dcc-page"><div className="dcc-section-intro"><h2>Penerbitan & pencabutan</h2><p>Kontrol lifecycle hanya tersedia setelah penerbit, keanggotaan, konfigurasi rate limit, dan lingkungan produksi telah diverifikasi. API saat ini sengaja fail-closed.</p></div><div className="dcc-status-banner"><span>⛨</span><div><strong>Penerbitan produksi dinonaktifkan</strong><p>Jangan menerbitkan kredensial nyata dari demo. Endpoint memerlukan flag server dan secret rate limit yang benar.</p></div><span className="dcc-blocked-pill">DIBLOKIR</span></div><div className="dcc-two-col"><section className="dcc-panel"><h3>Checklist sebelum terbit</h3><ul className="dcc-check-list"><li>Organisasi penerbit terverifikasi dan berstatus aktif.</li><li>Peran issuer_admin/operator aktif di server.</li><li>Jenis kartu diizinkan oleh registry backend.</li><li>Referensi subjek internal tervalidasi; klaim privat dipisahkan.</li><li>Token QR acak ditampilkan sekali dan hash disimpan di database.</li><li>Uji pencabutan, kedaluwarsa, duplikasi, dan audit lulus.</li></ul></section><section className="dcc-panel"><h3>Alur operasional</h3><ol className="dcc-numbered-list"><li><b>Siapkan draft</b><p>Validasi field dan masa berlaku sebelum mengirim.</p></li><li><b>Otorisasi server</b><p>Periksa penerbit dan peran operator pada setiap permintaan.</p></li><li><b>Terbitkan satu kali</b><p>Token rahasia tidak boleh masuk ke log atau ekspor publik.</p></li><li><b>Pantau & cabut</b><p>Setiap perubahan status harus tercatat dalam audit yang tidak dapat diedit operator.</p></li></ol></section></div></div>}

        {active === "verification" && <div className="dcc-page"><div className="dcc-section-intro"><h2>Verifikasi QR</h2><p>Endpoint memeriksa token tanpa mengembalikan nama atau data pribadi pemegang. Pengujian di sini akan menunjukkan status server yang sebenarnya.</p></div><form className="dcc-panel dcc-verify-form" onSubmit={verifyCard}><div className="dcc-panel-head"><div><h3>Periksa token kredensial</h3><p>Masukkan token uji dari proses penerbitan yang sah. Jangan tempel token nyata ke tiket atau percakapan publik.</p></div><span className="dcc-blocked-pill">GATE AKTIF</span></div><label>Token QR<input autoComplete="off" spellCheck={false} value={verificationToken} onChange={(event) => setVerificationToken(event.target.value)} placeholder="Tempel token 43 karakter…" maxLength={256} required /></label><div className="dcc-form-actions"><button className="dcc-primary-button" type="submit" disabled={checkingVerification}>{checkingVerification ? "Memeriksa…" : "Verifikasi token"}</button><button className="dcc-secondary-button" type="button" onClick={() => { setVerificationToken(""); setVerificationResult(""); }}>Bersihkan</button></div>{verificationResult && <div className={verificationResult.startsWith("VALID") ? "dcc-verification-result is-valid" : "dcc-verification-result"} role="status"><strong>Hasil verifikasi</strong><p>{verificationResult}</p></div>}</form><div className="dcc-panel dcc-note-panel"><h3>Data yang boleh muncul pada hasil publik</h3><p>Status valid/tidak valid, nama penerbit, jenis kartu, dan masa berlaku jika diperlukan. Jangan tampilkan nomor siswa, nomor telepon, alamat, tanggal lahir, klaim privat, atau ID internal.</p></div></div>}

        {active === "plans" && <div className="dcc-page"><div className="dcc-section-intro"><h2>Paket & penagihan</h2><p>Ruang kerja untuk merancang struktur harga. Draf paket dapat disimpan lokal untuk persiapan; belum ada gateway pembayaran, invoice, atau rekonsiliasi transaksi yang terhubung.</p></div><div className="dcc-status-banner"><span>◈</span><div><strong>Billing belum terhubung</strong><p>Tidak ada pembayaran yang akan ditagih dari halaman ini. Jangan promosikan paket sebagai aktif sebelum sistem pembayaran dan pembukuan diuji.</p></div><span className="dcc-blocked-pill">BELUM AKTIF</span></div><form className="dcc-panel dcc-form-grid" onSubmit={(event) => { event.preventDefault(); saveLocalDraft("plan"); }}><div className="dcc-form-heading"><h3>Perancang paket (draf lokal)</h3><p>Menyiapkan spesifikasi harga, kuota, dan periode untuk implementasi billing berikutnya.</p></div><label>Nama paket<input value={planDraft.name} maxLength={60} required onChange={(event) => setPlanDraft({ ...planDraft, name: event.target.value })} /></label><label>Harga (Rupiah / periode)<input value={planDraft.price} inputMode="numeric" pattern="[0-9]+" required onChange={(event) => setPlanDraft({ ...planDraft, price: event.target.value })} /></label><label>Kuota kartu aktif<input value={planDraft.quota} inputMode="numeric" pattern="[0-9]+" required onChange={(event) => setPlanDraft({ ...planDraft, quota: event.target.value })} /></label><label>Periode tagihan<select value={planDraft.period} onChange={(event) => setPlanDraft({ ...planDraft, period: event.target.value })}><option value="bulanan">Bulanan</option><option value="tahunan">Tahunan</option><option value="sekali">Sekali bayar</option></select></label><div className="dcc-form-actions"><button className="dcc-primary-button" type="submit">Simpan draf paket</button>{localSaved && <span className="dcc-muted">Draf lokal tersedia di browser ini.</span>}</div></form><div className="dcc-panel"><h3>Modul billing yang masih diperlukan</h3><div className="dcc-step-grid"><div><b>Langganan</b><p>Status trial, aktif, jatuh tempo, ditangguhkan, dan dibatalkan.</p></div><div><b>Invoice & pembayaran</b><p>Nomor invoice, nominal, status bayar, callback bertanda tangan, dan idempotensi.</p></div><div><b>Kuota & pemakaian</b><p>Jumlah kartu aktif, penerbit, operator, dan periode pemakaian.</p></div><div><b>Rekonsiliasi & refund</b><p>Jejak transaksi, penanganan gagal, pengembalian, dan ekspor laporan.</p></div></div></div></div>}

        {active === "users" && <div className="dcc-page"><div className="dcc-section-intro"><h2>Pengguna & hak akses</h2><p>Peran tidak boleh diberikan hanya karena pengguna berhasil login. Matriks ini menjelaskan batas izin; pengelolaan undangan dan perubahan peran belum tersedia sebagai tindakan produksi.</p></div><div className="dcc-panel"><div className="dcc-panel-head"><div><h3>Matriks peran organisasi</h3><p>Prinsip least privilege — hak akses minimum</p></div></div><div className="dcc-table-wrap"><table className="dcc-table"><thead><tr><th>Peran</th><th>Data pemegang</th><th>Penerbitan / cabut</th><th>Kelola pengguna</th><th>Pengaturan billing</th></tr></thead><tbody><tr><td><strong>owner</strong></td><td>Hanya tenant sendiri</td><td>Sesuai kebijakan penerbit</td><td>Admin tenant</td><td>Konfigurasi kontrak</td></tr><tr><td><strong>school_admin / issuer_admin</strong></td><td>Baca/tulis sesuai tenant</td><td>Jika lifecycle aktif</td><td>Terbatas sesuai kebijakan</td><td>Tidak otomatis</td></tr><tr><td><strong>operator</strong></td><td>Data operasional terbatas</td><td>Jika diizinkan</td><td>Tidak</td><td>Tidak</td></tr><tr><td><strong>verifier</strong></td><td>Hanya hasil verifikasi minimum</td><td>Tidak</td><td>Tidak</td><td>Tidak</td></tr><tr><td><strong>pemegang</strong></td><td>Data diri sendiri jika disediakan</td><td>Tidak</td><td>Tidak</td><td>Langganan sendiri</td></tr></tbody></table></div></div><div className="dcc-panel dcc-warning-panel"><strong>Kontrol kritis</strong><p>Semua keputusan akses harus diverifikasi server-side untuk setiap permintaan. Menyembunyikan tombol pada antarmuka bukan kontrol keamanan. Penambahan anggota dan perubahan peran harus menghasilkan audit event.</p></div></div>}

        {active === "audit" && <div className="dcc-page"><div className="dcc-section-intro"><h2>Audit & keamanan</h2><p>Status di bawah dirangkum dari baseline implementasi dan konfigurasi yang tersedia. Ini bukan hasil audit independen dan tidak boleh dianggap sebagai sertifikasi keamanan.</p></div><div className="dcc-panel"><div className="dcc-panel-head"><div><h3>Release gate produksi</h3><p>Kontrol yang masih memerlukan bukti verifikasi</p></div><span className="dcc-blocked-pill">BELUM LULUS</span></div><div className="dcc-readiness-list">{readiness.map(([label, description]) => <div className="dcc-readiness-row" key={label}><span className="dcc-readiness-icon">!</span><div><strong>{label}</strong><p>{description}</p></div><span className="dcc-warning-pill">Perlu verifikasi</span></div>)}</div></div><div className="dcc-two-col"><section className="dcc-panel"><h3>Kontrol yang wajib dibuktikan</h3><ul className="dcc-check-list"><li>Uji sign-in, sign-out, pemulihan akun, dan sesi kedaluwarsa.</li><li>Uji akses silang tenant A/B dengan role runtime terbatas.</li><li>Uji token acak, hash, kedaluwarsa, pencabutan, dan rate limit bersama.</li><li>Uji backup/restore, log aman, monitoring, dan rollback.</li><li>Tinjau pemberitahuan privasi, retensi, penghapusan, serta aturan data anak yang berlaku.</li></ul></section><section className="dcc-panel"><h3>Dokumentasi operasi</h3><p className="dcc-body-copy">Catat commit yang diuji, lingkungan, hasil, tanggal, reviewer, serta bukti setiap kontrol. Jangan menandai checklist selesai hanya karena file kode sudah ada.</p><a className="dcc-doc-link" href="https://github.com/Yudi8377/Kartu-Pelajar-Digital-Student-ID-OS/blob/main/docs/SECURITY-READINESS.md" target="_blank" rel="noreferrer">Buka checklist keamanan ↗</a><a className="dcc-doc-link" href="https://github.com/Yudi8377/Kartu-Pelajar-Digital-Student-ID-OS/blob/main/docs/DEPLOYMENT.md" target="_blank" rel="noreferrer">Buka status deployment ↗</a></section></div></div>}

        {active === "settings" && <div className="dcc-page"><div className="dcc-section-intro"><h2>Pengaturan sistem</h2><p>Kelola draf branding dan kebijakan yang akan diajukan untuk konfigurasi server. Form ini belum mengubah pengaturan global atau tenant di database.</p></div><form className="dcc-panel dcc-form-grid" onSubmit={(event) => { event.preventDefault(); saveLocalDraft("settings"); }}><div className="dcc-form-heading"><h3>Identitas dan dukungan</h3><p>Draf lokal — bukan pengaturan server aktif.</p></div><label>Nama platform<input value={settingsDraft.platformName} maxLength={100} required onChange={(event) => setSettingsDraft({ ...settingsDraft, platformName: event.target.value })} /></label><label>Email dukungan<input type="email" value={settingsDraft.supportEmail} maxLength={254} placeholder="support@contoh.id" onChange={(event) => setSettingsDraft({ ...settingsDraft, supportEmail: event.target.value })} /></label><label>Target retensi log (hari)<input type="number" min="30" max="3650" value={settingsDraft.retentionDays} required onChange={(event) => setSettingsDraft({ ...settingsDraft, retentionDays: event.target.value })} /></label><div className="dcc-form-actions"><button className="dcc-primary-button" type="submit">Simpan draf pengaturan</button><span className="dcc-muted">Draf tersimpan hanya di browser ini.</span></div></form><div className="dcc-panel"><h3>Pengaturan yang harus dikelola server</h3><div className="dcc-step-grid"><div><b>Keamanan sesi</b><p>Trusted origins, cookie secure, rotasi sesi, pemulihan akun.</p></div><div><b>Retensi dan privasi</b><p>Aturan ekspor, koreksi, penghapusan, dan jadwal retensi data.</p></div><div><b>Branding tenant</b><p>Logo, warna, domain, kontak dukungan, dan persetujuan publikasi.</p></div><div><b>Operasional</b><p>Maintenance mode, monitoring, backup, alert, dan rollback.</p></div></div></div></div>}
        <footer className="dcc-footer"><span>Digital Card OS · Admin Control Center</span><span>UI aktif · status backend mengikuti konfigurasi server</span><button type="button" onClick={() => { setNotice(""); setError(""); void loadProfile(); if (schoolId) void loadStudents(schoolId); }}>Muat ulang status ↻</button></footer>
      </section>
    </main>
  );
}
