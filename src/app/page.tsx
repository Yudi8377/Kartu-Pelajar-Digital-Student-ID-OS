export default function HomePage() {
  return (
    <main className="page-shell">
      <header className="topbar"><span className="brand-mark">ID</span><div><p className="eyebrow">STUDENT ID OS</p><strong>Kartu Pelajar Digital</strong></div><span className="status-pill">Fondasi demo</span></header>
      <section className="hero"><p className="eyebrow">IDENTITAS PELAJAR DIGITAL</p><h1>Satu identitas.<br /><span>Banyak kemungkinan.</span></h1><p className="hero-copy">Fondasi platform kartu pelajar digital untuk sekolah Indonesia, dirancang dengan privasi dan keamanan sebagai prioritas.</p></section>
      <section className="card-wrap" aria-label="Contoh kartu pelajar">
        <article className="student-card"><div className="card-head"><div><p className="eyebrow">KARTU PELAJAR</p><h2>STUDENT ID</h2></div><div className="seal">ID</div></div><div className="avatar-placeholder" aria-hidden="true">SISWA</div><p className="demo-label">CONTOH TAMPILAN — BUKAN KARTU VALID</p><h3>Nama Siswa</h3><p className="student-meta">Nama sekolah · Kelas</p><div className="card-foot"><span>Nomor identitas: belum diterbitkan</span><span className="dot-status">● DEMO</span></div></article>
        <aside className="notice"><strong><span aria-hidden="true">ⓘ</span> Mode fondasi</strong><p>Belum terhubung ke autentikasi atau database. Jangan masukkan data siswa asli. QR dan verifikasi belum aktif.</p></aside>
      </section>
      <section className="features"><div><span>01</span><h3>Aman sejak awal</h3><p>Data sekolah dibatasi berdasarkan hak akses dan keanggotaan.</p></div><div><span>02</span><h3>Verifikasi bertanggung jawab</h3><p>QR direncanakan memakai token acak tanpa data pribadi di dalamnya.</p></div><div><span>03</span><h3>Siap dikembangkan</h3><p>Fondasi PWA, skema Neon, pengujian, dan alur rilis bertahap.</p></div></section>
      <footer>Student ID OS · Fondasi pengembangan · Belum untuk penggunaan produksi</footer>
    </main>
  );
}
