"use client";

import { useMemo, useState } from "react";

type CardTheme = "ocean" | "emerald" | "violet";
type AttendanceMode = "qr" | "nfc" | "bluetooth";

const themeClass: Record<CardTheme, string> = {
  ocean: "admin-card--ocean",
  emerald: "admin-card--emerald",
  violet: "admin-card--violet",
};

export default function AdminPage() {
  const [schoolName, setSchoolName] = useState("SMA Nusantara");
  const [schoolCode, setSchoolCode] = useState("NUSA");
  const [studentName, setStudentName] = useState("Contoh Siswa");
  const [studentNumber, setStudentNumber] = useState("2026001");
  const [className, setClassName] = useState("X-A");
  const [theme, setTheme] = useState<CardTheme>("ocean");
  const [attendanceMode, setAttendanceMode] = useState<AttendanceMode>("qr");
  const [showPhoto, setShowPhoto] = useState(true);
  const [showClass, setShowClass] = useState(true);

  const previewId = useMemo(() => {
    const prefix = schoolCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8) || "SEKOLAH";
    const localNumber = studentNumber.trim().replace(/[^A-Za-z0-9-]/g, "").slice(0, 24) || "NOMOR-BELUM-ADA";
    return `${prefix}-${localNumber}`;
  }, [schoolCode, studentNumber]);

  return (
    <main className="admin-shell">
      <header className="admin-topbar">
        <a className="admin-brand" href="/" aria-label="Kembali ke halaman utama">ID</a>
        <div>
          <p className="admin-eyebrow">STUDENT ID OS / ADMIN</p>
          <h1>Pengaturan Kartu Digital</h1>
        </div>
        <span className="admin-demo-pill">Pratinjau · Data contoh</span>
      </header>

      <section className="admin-intro">
        <p className="admin-eyebrow">KONTROL IDENTITAS SEKOLAH</p>
        <h2>Atur kartu, identitas, dan alur absensi.</h2>
        <p>Rancang tampilan kartu untuk sekolah Anda. Pengaturan pada layar ini masih berupa pratinjau lokal; belum disimpan ke database dan belum menerbitkan kredensial yang sah.</p>
      </section>

      <div className="admin-layout">
        <section className="admin-panel" aria-labelledby="school-settings-title">
          <div className="admin-section-heading">
            <div><span className="admin-step">01</span><h3 id="school-settings-title">Identitas sekolah</h3></div>
            <p>Identitas unik harus ditetapkan server dan dikunci oleh database.</p>
          </div>
          <label className="admin-field">Nama sekolah
            <input value={schoolName} onChange={(event) => setSchoolName(event.target.value)} maxLength={100} />
          </label>
          <label className="admin-field">Kode singkat sekolah
            <input value={schoolCode} onChange={(event) => setSchoolCode(event.target.value)} maxLength={8} />
            <small>Hanya untuk pratinjau. Kode produksi harus unik per tenant.</small>
          </label>
          <div className="admin-field-grid">
            <label className="admin-field">Warna kartu
              <select value={theme} onChange={(event) => setTheme(event.target.value as CardTheme)}>
                <option value="ocean">Biru samudra</option>
                <option value="emerald">Hijau zamrud</option>
                <option value="violet">Ungu modern</option>
              </select>
            </label>
            <div className="admin-field">
              <span className="admin-label">Elemen kartu</span>
              <label className="admin-check"><input type="checkbox" checked={showPhoto} onChange={(event) => setShowPhoto(event.target.checked)} /> Area foto</label>
              <label className="admin-check"><input type="checkbox" checked={showClass} onChange={(event) => setShowClass(event.target.checked)} /> Kelas siswa</label>
            </div>
          </div>
          <div className="admin-divider" />
          <div className="admin-section-heading">
            <div><span className="admin-step">02</span><h3>Contoh data kartu</h3></div>
            <p>Gunakan data fiktif saat menguji tampilan.</p>
          </div>
          <label className="admin-field">Nama siswa
            <input value={studentName} onChange={(event) => setStudentName(event.target.value)} maxLength={100} />
          </label>
          <div className="admin-field-grid">
            <label className="admin-field">Nomor induk sekolah
              <input value={studentNumber} onChange={(event) => setStudentNumber(event.target.value)} maxLength={32} />
            </label>
            <label className="admin-field">Kelas
              <input value={className} onChange={(event) => setClassName(event.target.value)} maxLength={30} />
            </label>
          </div>
          <p className="admin-inline-note"><strong>ID pratinjau:</strong> <code>{previewId}</code><br />Ini belum menjadi ID kanonis. Produksi harus memakai ID internal acak dan constraint unik gabungan sekolah + nomor induk yang dinormalisasi.</p>
        </section>

        <section className="admin-preview-column">
          <article className={`admin-card ${themeClass[theme]}`}>
            <div className="admin-card-head">
              <div><p>KARTU PELAJAR DIGITAL</p><h3>{schoolName || "Nama Sekolah"}</h3></div>
              <div className="admin-school-seal">ID</div>
            </div>
            <div className="admin-card-body">
              {showPhoto && <div className="admin-photo-placeholder" aria-label="Area foto contoh">FOTO</div>}
              <div className="admin-card-student">
                <span>IDENTITAS SISWA · CONTOH</span>
                <h4>{studentName || "Nama Siswa"}</h4>
                {showClass && <p>Kelas {className || "—"}</p>}
                <strong>{previewId}</strong>
              </div>
            </div>
            <div className="admin-card-foot"><span>STUDENT ID OS</span><span>BUKAN KARTU VALID</span></div>
          </article>

          <article className="admin-panel admin-credential-panel">
            <div className="admin-section-heading">
              <div><span className="admin-step">03</span><h3>QR / barcode</h3></div>
              <span className="admin-pending">Belum diterbitkan</span>
            </div>
            <div className="admin-qr-placeholder" aria-label="Tempat QR belum aktif">
              <div className="admin-qr-cross">QR</div>
              <span>Menunggu penerbitan aman di server</span>
            </div>
            <p className="admin-muted">QR produksi hanya membawa token acak. Token mentah tidak disimpan di database dan tidak memuat nama atau nomor induk. Barcode dapat menjadi format tambahan setelah kontrak verifikasi disiapkan.</p>
            <button className="admin-button" type="button" disabled title="Menunggu backend penerbitan kartu">Terbitkan kartu (belum aktif)</button>
          </article>
        </section>
      </div>

      <section className="admin-panel admin-attendance-panel">
        <div className="admin-section-heading">
          <div><span className="admin-step">04</span><h3>Terminal absensi HP</h3></div>
          <p>Pilih metode untuk merencanakan uji coba perangkat.</p>
        </div>
        <div className="admin-mode-grid">
          <label className={`admin-mode-card ${attendanceMode === "qr" ? "is-selected" : ""}`}>
            <input type="radio" name="attendance-mode" value="qr" checked={attendanceMode === "qr"} onChange={() => setAttendanceMode("qr")} />
            <span className="admin-mode-icon">▦</span><strong>QR / barcode</strong><small>Jalur awal paling kompatibel. Perlu tindakan scan atau kamera terminal.</small>
          </label>
          <label className={`admin-mode-card ${attendanceMode === "nfc" ? "is-selected" : ""}`}>
            <input type="radio" name="attendance-mode" value="nfc" checked={attendanceMode === "nfc"} onChange={() => setAttendanceMode("nfc")} />
            <span className="admin-mode-icon">⌁</span><strong>NFC</strong><small>Tap kartu/perangkat; perlu dukungan NFC dan uji kompatibilitas HP.</small>
          </label>
          <label className={`admin-mode-card ${attendanceMode === "bluetooth" ? "is-selected" : ""}`}>
            <input type="radio" name="attendance-mode" value="bluetooth" checked={attendanceMode === "bluetooth"} onChange={() => setAttendanceMode("bluetooth")} />
            <span className="admin-mode-icon">ᛒ</span><strong>Bluetooth / BLE</strong><small>Deteksi kedekatan bersifat perkiraan, perlu izin dan anti-pemalsuan.</small>
          </label>
        </div>
        <div className="admin-warning">
          <strong>Catatan teknis</strong>
          <p>HP biasa tidak dapat membaca identitas semua HP di dekatnya secara universal tanpa protokol, izin, dan dukungan perangkat. Wi-Fi sekolah juga tidak otomatis memberikan lokasi presisi. Absensi otomatis memerlukan terminal/gateway terdaftar, bukti kedekatan yang tervalidasi, serta mekanisme anti-duplikasi.</p>
        </div>
      </section>

      <section className="admin-panel admin-safety-panel">
        <div className="admin-section-heading">
          <div><span className="admin-step">05</span><h3>Keselamatan & pemantauan</h3></div>
          <span className="admin-pending">Rancangan kebijakan</span>
        </div>
        <div className="admin-safety-grid">
          <div><strong>Di area sekolah</strong><p>Gunakan check-in/check-out dari terminal dan status keberadaan berbasis zona sekolah yang dikonfigurasi. Status “tidak terdeteksi” tidak otomatis membuktikan siswa sudah pulang.</p></div>
          <div><strong>Studi tur</strong><p>Aktifkan mode kegiatan dengan daftar peserta, petugas, jadwal, titik kumpul, dan penghentian otomatis. Lokasi hanya ditampilkan untuk petugas berwenang selama kegiatan yang disetujui.</p></div>
          <div><strong>Privasi siswa</strong><p>Dashboard lokasi dibatasi bagi petugas yang ditugaskan. Siswa dan wali mendapat pemberitahuan yang jelas; persetujuan, retensi, audit akses, dan prosedur darurat harus ditetapkan.</p></div>
        </div>
      </section>

      <footer className="admin-footer">Student ID OS · Panel rancangan · Belum terhubung ke data siswa nyata</footer>
    </main>
  );
}
