"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";

type Membership = { school_id: string; school_name: string; role: string };
type Student = {
  id: string;
  student_number: string;
  full_name: string;
  class_label: string | null;
  status: string;
  created_at: string;
};
type Profile = {
  user: { display_name: string; email: string | null };
  memberships: Membership[];
  accessState: string;
};

export default function WorkspacePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [schoolId, setSchoolId] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [classLabel, setClassLabel] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadStudents = useCallback(async (selectedSchool: string) => {
    if (!selectedSchool) {
      setStudents([]);
      return;
    }
    const response = await fetch(`/api/students?school_id=${encodeURIComponent(selectedSchool)}`, {
      cache: "no-store",
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Data siswa tidak dapat dimuat.");
    setStudents(data.students ?? []);
  }, []);

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      try {
        const response = await fetch("/api/me", { cache: "no-store" });
        const data = await response.json();
        if (!active) return;
        if (response.status === 401) {
          setError("Silakan masuk menggunakan akun institusi.");
          setLoading(false);
          return;
        }
        if (!response.ok) throw new Error(data.error || "Profil belum dapat dimuat.");
        const nextProfile = data as Profile;
        setProfile(nextProfile);
        const firstSchool = nextProfile.memberships[0]?.school_id ?? "";
        setSchoolId(firstSchool);
        if (firstSchool) await loadStudents(firstSchool);
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Layanan belum siap.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadProfile();
    return () => { active = false; };
  }, [loadStudents]);

  async function changeSchool(nextSchool: string) {
    setSchoolId(nextSchool);
    setError("");
    setMessage("");
    try {
      await loadStudents(nextSchool);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Data siswa tidak dapat dimuat.");
    }
  }

  async function handleCreateStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          school_id: schoolId,
          student_number: studentNumber.trim(),
          full_name: fullName.trim(),
          class_label: classLabel.trim() || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Siswa belum dapat disimpan.");
      setStudents((current) => [...current, data.student].sort((a, b) => a.full_name.localeCompare(b.full_name)));
      setStudentNumber("");
      setFullName("");
      setClassLabel("");
      setMessage("Data siswa berhasil ditambahkan.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Siswa belum dapat disimpan.");
    } finally {
      setSaving(false);
    }
  }

  const selectedMembership = profile?.memberships.find((item) => item.school_id === schoolId);
  const canCreate = selectedMembership && ["school_admin", "operator"].includes(selectedMembership.role);

  return (
    <main className="page-shell workspace-shell">
      <header className="topbar">
        <span className="brand-mark">KPD</span>
        <div><p className="eyebrow">STUDENT ID OS</p><strong>Ruang Institusi</strong></div>
        <Link className="topbar-signin" href="/">Halaman utama</Link>
      </header>

      <section className="workspace-heading">
        <p className="eyebrow">RUANG KERJA · DATA INSTITUSI</p>
        <h1>Ruang operasional KPD</h1>
        <p>Data ditampilkan sesuai sesi masuk dan keanggotaan institusi. Setiap perubahan dicatat sebagai aktivitas audit.</p>
      </section>

      {loading ? <section className="workspace-panel">Memeriksa sesi dan hak akses...</section> : null}

      {!loading && !profile ? (
        <section className="workspace-panel">
          <h2>Sesi belum aktif</h2>
          <p>{error || "Masuk terlebih dahulu untuk mengakses ruang institusi."}</p>
          <Link className="workspace-primary-link" href="/sign-in">Masuk ke KPD</Link>
        </section>
      ) : null}

      {!loading && profile ? (
        <>
          <section className="workspace-profile">
            <div>
              <p className="eyebrow">AKUN AKTIF</p>
              <h2>{profile.user.display_name}</h2>
              <p>{profile.user.email || "Email tidak tersedia"}</p>
            </div>
            <div className="workspace-status">
              <span className="module-status">{profile.accessState === "active" ? "Akses institusi tersedia" : "Menunggu penetapan institusi"}</span>
              <p>Login tidak otomatis memberikan akses sekolah.</p>
            </div>
          </section>

          {profile.memberships.length === 0 ? (
            <section className="workspace-panel">
              <h2>Akun terverifikasi, institusi belum ditetapkan</h2>
              <p>Administrator perlu menautkan akun ini ke sekolah dan menetapkan peran yang sesuai. Tidak ada data siswa yang dapat diakses sampai penetapan tersebut selesai.</p>
            </section>
          ) : (
            <>
              <section className="workspace-panel">
                <div className="workspace-panel-heading">
                  <div><p className="eyebrow">INSTITUSI</p><h2>Pilih ruang sekolah</h2></div>
                  <label className="workspace-select-label">Sekolah
                    <select value={schoolId} onChange={(event) => void changeSchool(event.target.value)}>
                      {profile.memberships.map((membership) => (
                        <option key={membership.school_id} value={membership.school_id}>
                          {membership.school_name} · {membership.role}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="workspace-metrics">
                  <div><span>Data siswa yang dapat dilihat</span><strong>{students.length}</strong></div>
                  <div><span>Peran akun</span><strong>{selectedMembership?.role || "—"}</strong></div>
                  <div><span>Mode data</span><strong>Terbatas per sekolah</strong></div>
                </div>
              </section>

              {canCreate ? (
                <section className="workspace-panel">
                  <p className="eyebrow">MASTER DATA SISWA</p>
                  <h2>Tambah siswa</h2>
                  <form className="workspace-form" onSubmit={handleCreateStudent}>
                    <label>Nomor siswa<input value={studentNumber} onChange={(event) => setStudentNumber(event.target.value)} required maxLength={80} /></label>
                    <label>Nama lengkap<input value={fullName} onChange={(event) => setFullName(event.target.value)} required minLength={2} maxLength={200} /></label>
                    <label>Kelas (opsional)<input value={classLabel} onChange={(event) => setClassLabel(event.target.value)} maxLength={120} /></label>
                    <button className="auth-submit" type="submit" disabled={saving}>{saving ? "Menyimpan..." : "Simpan data siswa"}</button>
                  </form>
                </section>
              ) : null}

              <section className="workspace-panel">
                <div className="workspace-panel-heading"><div><p className="eyebrow">DAFTAR SISWA</p><h2>Data siswa institusi</h2></div><span className="module-status">Maks. 200 data per tampilan</span></div>
                {error ? <p className="auth-error" role="alert">{error}</p> : null}
                {message ? <p className="workspace-success" role="status">{message}</p> : null}
                {students.length === 0 ? <p className="workspace-muted">Belum ada data yang dapat ditampilkan atau akun ini tidak memiliki izin untuk melihat data siswa.</p> : (
                  <div className="workspace-table-wrap">
                    <table className="workspace-table">
                      <thead><tr><th>Nomor siswa</th><th>Nama</th><th>Kelas</th><th>Status</th></tr></thead>
                      <tbody>{students.map((student) => <tr key={student.id}><td>{student.student_number}</td><td>{student.full_name}</td><td>{student.class_label || "—"}</td><td>{student.status}</td></tr>)}</tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}
        </>
      ) : null}
    </main>
  );
}
