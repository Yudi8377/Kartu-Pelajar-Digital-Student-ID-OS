export type KpdModuleStatus = "foundation" | "planned" | "gated";
export type KpdDataSensitivity = "public-minimal" | "school-confidential" | "sensitive-restricted";

export interface KpdModule {
  id: string;
  name: string;
  tagline: string;
  description: string;
  status: KpdModuleStatus;
  sensitivity: KpdDataSensitivity;
  phase: number;
  access: string;
  guardrail: string;
}

/**
 * Product registry for the modular KPD roadmap.
 * "planned" and "gated" modules are not live integrations and must not be
 * presented as connected to government systems or as making eligibility decisions.
 */
export const KPD_MODULES: readonly KpdModule[] = [
  {
    id: "digital-identity",
    name: "Identitas Pelajar Digital",
    tagline: "Kartu, status, dan verifikasi",
    description: "Identitas pelajar, afiliasi sekolah, status kartu, masa berlaku, serta penerbitan dan pencabutan kartu.",
    status: "foundation",
    sensitivity: "public-minimal",
    phase: 1,
    access: "Siswa, wali yang terverifikasi, petugas sekolah sesuai tugas, dan pemeriksa dengan hasil terbatas.",
    guardrail: "QR berisi token acak; tidak menaruh nama, NISN, tanggal lahir, desil, atau data keluarga pada QR."
  },
  {
    id: "school-operations",
    name: "Administrasi Sekolah",
    tagline: "Data induk dan siklus kartu",
    description: "Pengelolaan siswa, sekolah, kelas, status, kartu aktif, penggantian, dan riwayat tindakan yang dapat diaudit.",
    status: "planned",
    sensitivity: "school-confidential",
    phase: 1,
    access: "Operator sekolah hanya dalam tenant sekolahnya; tindakan administratif mengikuti role.",
    guardrail: "Pemisahan tenant diuji di server dan database; UI bukan batas keamanan."
  },
  {
    id: "family-portal",
    name: "Ruang Siswa & Wali",
    tagline: "Informasi yang relevan untuk keluarga",
    description: "Kartu digital, permintaan koreksi data, pengumuman, dokumen yang diizinkan, dan status permohonan layanan.",
    status: "planned",
    sensitivity: "school-confidential",
    phase: 2,
    access: "Siswa dan wali hanya dapat mengakses profil yang sudah diverifikasi dan ditautkan secara sah.",
    guardrail: "Hubungan wali diverifikasi; akses anak dan wali mengikuti usia, kebijakan sekolah, dan ketentuan yang berlaku."
  },
  {
    id: "welfare-bridge",
    name: "Jembatan Kesejahteraan & Bantuan Pendidikan",
    tagline: "Rujukan layanan yang adil",
    description: "Alur rujukan dan verifikasi kelayakan program pendidikan melalui sumber resmi, bila tersedia kerja sama, kewenangan, dan dasar pemrosesan yang sah.",
    status: "gated",
    sensitivity: "sensitive-restricted",
    phase: 3,
    access: "Petugas berwenang berdasarkan program dan tujuan tertentu; tidak tersedia bagi pemeriksa QR umum.",
    guardrail: "Tidak menyimpan atau menampilkan desil pada kartu. Tidak menganggap desil sebagai satu-satunya penentu bantuan. Tidak melakukan pencocokan DTSEN tanpa persetujuan institusional dan jalur resmi."
  },
  {
    id: "learning-passport",
    name: "Paspor Pendidikan",
    tagline: "Prestasi dan perjalanan belajar",
    description: "Portofolio prestasi, sertifikat, kegiatan, dan rekam perkembangan yang dapat dibawa lintas jenjang dengan persetujuan dan validasi sumber.",
    status: "planned",
    sensitivity: "school-confidential",
    phase: 3,
    access: "Siswa/wali untuk data yang berhak dilihat; sekolah hanya untuk kebutuhan pendidikan yang sah.",
    guardrail: "Tidak membuat peringkat permanen siswa atau inferensi sensitif; setiap catatan memiliki sumber, waktu, dan mekanisme koreksi."
  },
  {
    id: "student-services",
    name: "Layanan Siswa",
    tagline: "Perpustakaan, kegiatan, dan fasilitas",
    description: "Integrasi bertahap untuk perpustakaan, ekstrakurikuler, peminjaman fasilitas, dan layanan sekolah lain melalui izin yang jelas.",
    status: "planned",
    sensitivity: "school-confidential",
    phase: 4,
    access: "Petugas layanan hanya melihat atribut minimum yang diperlukan untuk transaksi.",
    guardrail: "Tidak ada pelacakan lokasi terus-menerus; aktivitas hanya dicatat bila diperlukan dan diberitahukan."
  },
  {
    id: "emergency-guardian",
    name: "Emergency Guardian",
    tagline: "Deteksi indikasi insiden dan bantuan darurat",
    description: "Rancangan fitur Android untuk menilai indikasi jatuh atau benturan, menyediakan tombol SOS, memberi peringatan kepada wali, dan membagikan lokasi terakhir yang tersedia dengan tautan Google Maps.",
    status: "planned",
    sensitivity: "sensitive-restricted",
    phase: 2,
    access: "Siswa/pemegang KPD mengatur kontak dan izin; wali terverifikasi menerima alarm; akses petugas hanya sesuai kewenangan dan kebutuhan insiden.",
    guardrail: "Deteksi sensor bukan diagnosis dan dapat salah. Minta konfirmasi bila memungkinkan; jangan menghubungi layanan publik otomatis tanpa mekanisme yang disetujui. Lokasi hanya saat mode darurat aktif, dengan indikator, retensi singkat, dan akses terbatas."
  },
  {
    id: "trust-center",
    name: "Trust, Privacy & Audit Center",
    tagline: "Kontrol data dan jejak akses",
    description: "Pusat izin, riwayat akses, permintaan koreksi, masa retensi, pelaporan insiden, dan pemantauan penyalahgunaan.",
    status: "planned",
    sensitivity: "sensitive-restricted",
    phase: 1,
    access: "Pemilik data melalui alur yang sesuai; petugas privasi dan auditor sesuai kewenangan.",
    guardrail: "Log tidak memuat isi data sensitif secara berlebihan; akses istimewa tercatat dan ditinjau."
  }
];

export function getKpdModuleStatusLabel(status: KpdModuleStatus): string {
  switch (status) {
    case "foundation":
      return "Fondasi";
    case "planned":
      return "Tahap berikutnya";
    case "gated":
      return "Menunggu izin resmi";
  }
}
