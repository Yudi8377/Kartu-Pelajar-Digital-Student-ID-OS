(() => {
  const byId = (id) => document.getElementById(id);
  const fields = ["schoolName", "schoolCode", "studentName", "studentNumber", "studentClass", "theme"];
  function normalizedPreviewId() {
    const school = byId("schoolCode").value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8) || "SEKOLAH";
    const number = byId("studentNumber").value.trim().replace(/[^A-Za-z0-9-]/g, "").slice(0, 24) || "NOMOR-BELUM-ADA";
    return school + "-" + number;
  }
  function render() {
    const schoolName = byId("schoolName").value.trim() || "Nama Sekolah";
    const studentName = byId("studentName").value.trim() || "Nama Siswa";
    const studentClass = byId("studentClass").value.trim() || "—";
    const id = normalizedPreviewId();
    byId("cardSchool").textContent = schoolName;
    byId("cardStudent").textContent = studentName;
    byId("cardClass").textContent = "Kelas " + studentClass;
    byId("cardId").textContent = id;
    byId("previewId").textContent = id;
    byId("studentCard").className = "student-card " + byId("theme").value;
  }
  fields.forEach((id) => byId(id).addEventListener("input", render));
  render();
})();
