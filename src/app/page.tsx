import { getKpdModuleStatusLabel, KPD_MODULES } from "../lib/kpd-modules";

export default function HomePage() {
  return (
    <main className="page-shell">
      <header className="topbar">
        <span className="brand-mark">KPD</span>
        <div><p className="eyebrow">STUDENT ID OS</p><strong>Kartu Pelajar Digital</strong></div>
        <span className="status-pill">Fondasi pengembangan</span>
      </header>

      <section className="hero">
        <p className="eyebrow">IDENTITAS PELAJAR DIGITAL · LAYANAN PENDIDIKAN</p>
        <h1>Satu identitas.<br /><span>Banyak kemungkinan.</span></h1>
        <p className="hero-copy">KPD dirancang sebagai fondasi identitas pelajar dan layanan pendidikan yang modular, aman, dan dapat berkembang lintas sekolah—dengan privasi anak sebagai prinsip utama.</p>
      </section>

      <section className="card-wrap" aria-label="Contoh kartu pelajar">
        <article className="student-card">
          <div className="card-head"><div><p className="eyebrow">KARTU PELAJAR</p><h2>STUDENT ID</h2></div><div className="seal">KPD</div></div>
          <div className="avatar-placeholder" aria-hidden="true">SISWA</div>
          <p className="demo-label">CONTOH TAMPILAN — BUKAN KARTU VALID</p>
          <h3>Nama Siswa</h3>
          <p className="student-meta">Nama sekolah · Kelas</p>
          <div className="card-foot"><span>Nomor identitas: belum diterbitkan</span><span className="dot-status">● DEMO</span></div>
        </article>
        <aside className="notice">
          <strong><span aria-hidden="true">ⓘ</span> Mode fondasi</strong>
          <p>Aplikasi ini belum terhubung ke autentikasi, database operasional, atau layanan pemerintah. QR belum aktif. Jangan masukkan data siswa asli.</p>
          <p className="notice-emphasis">Desil keluarga tidak ditampilkan pada kartu atau QR.</p>
        </aside>
      </section>

      <section className="innovation-section">
        <div className="section-heading"><p className="eyebrow">ARSITEKTUR MODULAR</p><h2>Fungsi KPD yang dapat dikembangkan</h2><p>Setiap modul punya batas akses dan tahapan aktivasi. Label di bawah membedakan fondasi konsep dari fungsi yang belum tersedia.</p></div>
        <div className="module-grid">
          {KPD_MODULES.map((module) => (
            <article className="module-card" key={module.id}>
              <div className="module-card-top"><span className="module-number">MODUL {String(module.phase).padStart(2, "0")}</span><span className={`module-status module-status--${module.status}`}>{getKpdModuleStatusLabel(module.status)}</span></div>
              <h3>{module.name}</h3>
              <p className="module-tagline">{module.tagline}</p>
              <p className="module-description">{module.description}</p>
              <div className="module-guardrail"><strong>Pengaman:</strong> {module.guardrail}</div>
            </article>
          ))}
        </div>
      </section>

      <section className="welfare-section">
        <div><p className="eyebrow">INOVASI SOSIAL · DENGAN PEMBATASAN AKSES</p><h2>Welfare Bridge: menghubungkan kebutuhan, bukan membuka data keluarga</h2><p>KPD dapat dirancang untuk membantu sekolah mengarahkan keluarga ke program pendidikan yang relevan. Integrasi desil/DTSEN hanya dapat dipertimbangkan lewat sumber resmi, kewenangan, dasar pemrosesan, dan kerja sama yang disetujui.</p></div>
        <ul>
          <li>Desil tidak dicetak pada kartu dan tidak dimasukkan ke QR.</li>
          <li>Pemeriksa kartu umum tidak dapat melihat status sosial-ekonomi keluarga.</li>
          <li>Utamakan hasil verifikasi minimum, bukan salinan data keluarga.</li>
          <li>Hasil yang tidak tersedia atau disengketakan harus punya jalur pemeriksaan manusia.</li>
        </ul>
        <span className="gated-note">Belum terhubung ke DTSEN atau sistem bantuan pemerintah.</span>
      </section>


      <section className="emergency-section">
        <div className="emergency-copy">
          <p className="eyebrow">INOVASI KESELAMATAN · ANDROID</p>
          <h2>Emergency Guardian</h2>
          <p>Jika perangkat mendeteksi pola sensor yang mungkin menunjukkan insiden, KPD dapat memulai alur pemeriksaan keselamatan, memberi waktu konfirmasi, lalu mengirim peringatan dan lokasi terakhir kepada kontak yang telah disetujui.</p>
          <span className="gated-note">Konsep produk — belum aktif di aplikasi ini</span>
        </div>
        <div className="emergency-steps">
          <div><span>01</span><p><strong>Deteksi indikasi</strong><br />Sensor gerak dan konteks aktivitas memberi sinyal, bukan memastikan kecelakaan.</p></div>
          <div><span>02</span><p><strong>Konfirmasi keselamatan</strong><br />Peringatan berbunyi/getar dan hitung mundur untuk membatalkan alarm palsu bila pengguna mampu.</p></div>
          <div><span>03</span><p><strong>Hubungi wali</strong><br />Kirim notifikasi/SMS melalui mekanisme yang didukung, termasuk waktu kejadian dan lokasi yang tersedia.</p></div>
          <div><span>04</span><p><strong>Buka Google Maps</strong><br />Penerima mendapat tautan peta ke koordinat terakhir beserta usia data dan akurasi bila tersedia.</p></div>
        </div>
      </section>
\n      <section className="principles">
        <div><span>01</span><h3>Privasi sejak desain</h3><p>Data minimum, akses terbatas, permintaan koreksi, masa retensi, dan jejak audit.</p></div>
        <div><span>02</span><h3>QR tanpa data pribadi</h3><p>Token acak dan hasil verifikasi minimum; bukan nama, NISN, atau data keluarga.</p></div>
        <div><span>03</span><h3>Modular dan dapat di-upgrade</h3><p>Layanan baru diaktifkan setelah uji keamanan, dasar hukum, dan izin integrasi terpenuhi.</p></div>
      </section>
      <footer>KPD · Student ID OS · Fondasi pengembangan, belum untuk penggunaan produksi atau data siswa asli.</footer>
    </main>
  );
}
