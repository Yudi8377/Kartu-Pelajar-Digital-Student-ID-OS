import { createAuthClient } from "https://esm.sh/@neondatabase/auth@0.5.0-beta";

const AUTH_URL = "https://ep-twilight-block-b38mafb2.neonauth.c-4.ap-southeast-1.aws.neon.tech/neondb/auth";
const DATA_API_URL = "https://ep-twilight-block-b38mafb2.apirest.c-4.ap-southeast-1.aws.neon.tech/neondb/rest/v1";
const authClient = createAuthClient(AUTH_URL);

const $ = (id) => document.getElementById(id);
const state = { mode: "signIn", email: "", user: null, issuers: [], issuerId: "" };

function setStatus(id, message, kind = "") {
  const node = $(id);
  node.textContent = message;
  node.className = "status" + (kind ? " " + kind : "");
}
function showGlobal(message, kind = "success") {
  const node = $("globalStatus");
  node.textContent = message;
  node.className = "notice " + kind;
  node.classList.remove("hidden");
}
function hideGlobal() {
  $("globalStatus").classList.add("hidden");
}
function busy(button, value, label) {
  button.disabled = value;
  if (value) {
    button.dataset.originalLabel = button.textContent;
    button.textContent = label || "Memproses…";
  } else if (button.dataset.originalLabel) {
    button.textContent = button.dataset.originalLabel;
    delete button.dataset.originalLabel;
  }
}
function setMode(mode) {
  state.mode = mode;
  const signup = mode === "signUp";
  $("signInTab").setAttribute("aria-pressed", String(!signup));
  $("signUpTab").setAttribute("aria-pressed", String(signup));
  $("signInTab").classList.toggle("secondary", signup);
  $("signUpTab").classList.toggle("secondary", !signup);
  $("nameField").classList.toggle("hidden", !signup);
  $("name").required = signup;
  $("password").autocomplete = signup ? "new-password" : "current-password";
  $("authSubmit").textContent = signup ? "Buat akun" : "Masuk";
  $("magicLinkForm").classList.add("hidden");
  $("authForm").classList.remove("hidden");
  $("authLinks").classList.toggle("hidden", signup);
  setStatus("authStatus", "");
}
function showAuth() {
  $("authPanel").classList.remove("hidden");
  $("issuerPanel").classList.add("hidden");
  $("cardsPanel").classList.add("hidden");
}
function showConsole() {
  $("authPanel").classList.add("hidden");
  $("issuerPanel").classList.remove("hidden");
}
function normalizeError(error) {
  if (error && typeof error.message === "string") return error.message.slice(0, 240);
  return "Permintaan tidak berhasil. Coba lagi.";
}
async function getApiToken() {
  const result = await authClient.token();
  if (result?.error || !result?.data?.token) {
    throw new Error("Sesi belum siap. Masuk kembali dan coba lagi.");
  }
  return result.data.token;
}
async function callRpc(name, params = {}) {
  const token = await getApiToken();
  const response = await fetch(DATA_API_URL + "/rpc/" + encodeURIComponent(name), {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + token,
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify(params),
    cache: "no-store",
    credentials: "omit",
    redirect: "error"
  });
  let data = null;
  try { data = await response.json(); } catch { /* keep generic error */ }
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("Sesi tidak valid atau akun belum terverifikasi. Masuk ulang dan periksa email.");
    }
    throw new Error(typeof data?.message === "string" ? data.message.slice(0, 180) : "Permintaan tidak dapat diproses. Silakan coba lagi.");
  }
  return data;
}
async function startVerification(email) {
  state.email = email;
  $("verifyForm").classList.remove("hidden");
  $("otp").value = "";
  const sendButton = $("sendCode");
  busy(sendButton, true, "Mengirim kode…");
  try {
    if (!authClient.emailOtp?.sendVerificationOtp) {
      throw new Error("Verifikasi email belum tersedia untuk sesi ini. Silakan coba lagi nanti.");
    }
    const result = await authClient.emailOtp.sendVerificationOtp({ email, type: "email-verification" });
    if (result?.error) throw result.error;
    setStatus("authStatus", "Jika alamat email valid, kode verifikasi akan dikirim. Periksa kotak masuk dan folder spam.", "success");
  } catch (error) {
    setStatus("authStatus", normalizeError(error), "error");
  } finally {
    busy(sendButton, false);
  }
}
async function enterConsole(user) {
  state.user = user;
  $("signedInAs").textContent = user?.email || "Akun terverifikasi";
  $("verifyForm").classList.add("hidden");
  showConsole();
  hideGlobal();
  await loadIssuers();
}
async function refreshSession() {
  const result = await authClient.getSession();
  if (result?.error) throw result.error;
  const session = result?.data;
  const user = session?.user;
  if (!user) {
    state.user = null;
    showAuth();
    return;
  }
  state.email = user.email || state.email;
  if (user.emailVerified !== true) {
    showAuth();
    await startVerification(state.email);
    setStatus("authStatus", "Email belum terverifikasi. Verifikasi diperlukan sebelum membuat penerbit.", "warning");
    return;
  }
  await enterConsole(user);
}
async function loadIssuers() {
  setStatus("issuerStatus", "Memuat penerbit…");
  try {
    const result = await callRpc("list_digital_card_issuers");
    state.issuers = Array.isArray(result?.issuers) ? result.issuers : [];
    const select = $("issuerSelect");
    select.replaceChildren();
    if (!state.issuers.length) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "Belum ada penerbit";
      select.append(option);
      state.issuerId = "";
      $("cardsPanel").classList.add("hidden");
      setStatus("issuerStatus", "Belum ada penerbit. Isi formulir untuk membuat penerbit pertama.", "");
      return;
    }
    for (const issuer of state.issuers) {
      const option = document.createElement("option");
      option.value = issuer.issuerId;
      option.textContent = issuer.displayName + " · " + issuer.role;
      select.append(option);
    }
    const wanted = state.issuerId && state.issuers.some((x) => x.issuerId === state.issuerId)
      ? state.issuerId : state.issuers[0].issuerId;
    select.value = wanted;
    state.issuerId = wanted;
    setStatus("issuerStatus", "Informasi penerbit berhasil dimuat.", "success");
    await loadCards();
  } catch (error) {
    setStatus("issuerStatus", normalizeError(error), "error");
  }
}
async function loadCards() {
  if (!state.issuerId) return;
  $("cardsPanel").classList.remove("hidden");
  $("cardsList").replaceChildren();
  const loading = document.createElement("p");
  loading.className = "muted";
  loading.textContent = "Memuat kartu…";
  $("cardsList").append(loading);
  try {
    const result = await callRpc("list_digital_cards", { p_issuer_id: state.issuerId });
    const cards = Array.isArray(result?.cards) ? result.cards : [];
    $("cardsList").replaceChildren();
    if (!cards.length) {
      const empty = document.createElement("p");
      empty.className = "muted";
      empty.textContent = "Belum ada kartu terdaftar.";
      $("cardsList").append(empty);
    }
    for (const card of cards) {
      const row = document.createElement("div");
      row.className = "card-row";
      const meta = document.createElement("div");
      meta.className = "card-meta";
      const title = document.createElement("strong");
      title.textContent = card.cardNumber + " · " + card.cardTypeId;
      const status = document.createElement("span");
      status.className = "pill";
      status.textContent = card.status;
      meta.append(title, status);
      if (card.expiresAt) {
        const expiry = document.createElement("div");
        expiry.className = "muted";
        expiry.textContent = "Berlaku sampai " + new Date(card.expiresAt).toLocaleDateString("id-ID");
        meta.append(expiry);
      }
      row.append(meta);
      if (card.status === "active" || card.status === "pending") {
        const revoke = document.createElement("button");
        revoke.type = "button";
        revoke.className = "danger";
        revoke.textContent = "Cabut kartu";
        revoke.addEventListener("click", () => revokeCard(card.id, revoke));
        row.append(revoke);
      }
      $("cardsList").append(row);
    }
    setStatus("cardsStatus", "Menampilkan " + cards.length + " kartu. Token QR dan klaim privat tidak ditampilkan.", "success");
  } catch (error) {
    $("cardsList").replaceChildren();
    setStatus("cardsStatus", normalizeError(error), "error");
  }
}
async function revokeCard(cardId, button) {
  if (!confirm("Cabut kartu ini? Tindakan pencabutan tidak dapat dibatalkan dari konsol ini.")) return;
  busy(button, true, "Mencabut…");
  try {
    await callRpc("revoke_digital_card", {
      p_issuer_id: state.issuerId,
      p_card_id: cardId,
      p_reason_code: "issuer_request"
    });
    setStatus("cardsStatus", "Kartu dicabut dan audit event disimpan.", "success");
    await loadCards();
  } catch (error) {
    setStatus("cardsStatus", normalizeError(error), "error");
  } finally {
    busy(button, false);
  }
}

$("togglePassword").addEventListener("click", () => {
  const visible = $("password").type === "password";
  $("password").type = visible ? "text" : "password";
  $("togglePassword").setAttribute("aria-pressed", String(visible));
  $("togglePassword").setAttribute("aria-label", visible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi");
  $("togglePassword").title = visible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi";
});
$("showMagicLink").addEventListener("click", () => {
  const email = $("email").value.trim().toLowerCase();
  if (email) $("magicEmail").value = email;
  $("authForm").classList.add("hidden");
  $("forgotForm").classList.add("hidden");
  $("verifyForm").classList.add("hidden");
  $("magicLinkForm").classList.remove("hidden");
  $("authLinks").classList.add("hidden");
  setStatus("magicStatus", "");
  $("magicEmail").focus();
});
$("backToPassword").addEventListener("click", () => {
  $("magicLinkForm").classList.add("hidden");
  $("authForm").classList.remove("hidden");
  $("authLinks").classList.toggle("hidden", state.mode === "signUp");
  setStatus("magicStatus", "");
});
$("magicLinkForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = $("magicEmail").value.trim().toLowerCase();
  const button = $("sendMagicLink");
  busy(button, true, "Mengirim tautan…");
  setStatus("magicStatus", "");
  try {
    const callbackURL = new URL("./", window.location.href).href;
    const response = await fetch(AUTH_URL + "/sign-in/magic-link", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ email, callbackURL, newUserCallbackURL: callbackURL, errorCallbackURL: callbackURL }),
      credentials: "include",
      cache: "no-store",
      redirect: "error"
    });
    let result = null;
    try { result = await response.json(); } catch { /* response may be empty */ }
    if (!response.ok || result?.error) {
      if (response.status === 429) {
        throw new Error("Terlalu banyak permintaan. Tunggu beberapa menit lalu coba lagi.");
      }
      const serverMessage = typeof result?.message === "string" ? result.message
        : typeof result?.error?.message === "string" ? result.error.message
        : typeof result?.code === "string" ? result.code
        : typeof result?.error === "string" ? result.error
        : "";
      const detail = serverMessage.replace(/[\\r\\n\\t]+/g, " ").slice(0, 180);
      throw new Error("Tautan masuk belum dapat dikirim. Periksa alamat email atau coba lagi nanti.");
    }
    state.email = email;
    setStatus("magicStatus", "Jika email dapat digunakan, tautan masuk akan dikirim. Periksa kotak masuk dan folder spam. Buka tautan pada perangkat dan browser yang sama.", "success");
  } catch (error) {
    setStatus("magicStatus", normalizeError(error), "error");
  } finally {
    busy(button, false);
  }
});

$("forgotPassword").addEventListener("click", () => {
  const email = $("email").value.trim().toLowerCase();
  if (email) $("resetEmail").value = email;
  $("authForm").classList.add("hidden");
  $("verifyForm").classList.add("hidden");
  $("magicLinkForm").classList.add("hidden");
  $("forgotForm").classList.remove("hidden");
  $("authLinks").classList.add("hidden");
  setStatus("forgotStatus", "");
  $("resetEmail").focus();
});
$("backToLogin").addEventListener("click", () => {
  $("forgotForm").classList.add("hidden");
  $("magicLinkForm").classList.add("hidden");
  $("authForm").classList.remove("hidden");
  $("authLinks").classList.toggle("hidden", state.mode === "signUp");
  setStatus("forgotStatus", "");
});
$("forgotForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = $("resetEmail").value.trim().toLowerCase();
  const button = $("sendResetLink");
  busy(button, true, "Mengirim tautan…");
  setStatus("forgotStatus", "");
  try {
    const redirectTo = new URL("./reset-password/", window.location.href).href;
    const response = await fetch(AUTH_URL + "/request-password-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ email, redirectTo }),
      credentials: "omit",
      cache: "no-store",
      redirect: "error"
    });
    let result = null;
    try { result = await response.json(); } catch { /* response may be empty */ }
    if (!response.ok) {
      throw new Error(response.status === 429
        ? "Terlalu banyak permintaan reset. Tunggu beberapa menit lalu coba lagi."
        : "Permintaan reset ditolak layanan autentikasi (" + response.status + ").");
    }
    if (result?.error) throw new Error(result.message || result.error.message || "Permintaan reset gagal.");
    setStatus("forgotStatus", "Jika email tersebut terdaftar, tautan reset akan segera dikirim. Periksa kotak masuk dan folder spam. Tautan berlaku 15 menit.", "success");
  } catch (error) {
    setStatus("forgotStatus", normalizeError(error), "error");
  } finally {
    busy(button, false);
  }
});
$("signInTab").addEventListener("click", () => setMode("signIn"));
$("signUpTab").addEventListener("click", () => setMode("signUp"));
$("authForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  hideGlobal();
  const button = $("authSubmit");
  busy(button, true);
  const email = $("email").value.trim().toLowerCase();
  const password = $("password").value;
  state.email = email;
  try {
    let result;
    if (state.mode === "signUp") {
      result = await authClient.signUp.email({
        name: $("name").value.trim(),
        email,
        password
      });
    } else {
      result = await authClient.signIn.email({ email, password });
    }
    if (result?.error) throw result.error;
    const session = await authClient.getSession();
    const user = session?.data?.user;
    if (user?.emailVerified === true) {
      await enterConsole(user);
    } else {
      await startVerification(email);
      setStatus("authStatus", "Akun dibuat atau sesi dimulai. Verifikasi email untuk melanjutkan.", "warning");
    }
  } catch (error) {
    setStatus("authStatus", normalizeError(error), "error");
  } finally {
    busy(button, false);
  }
});
$("sendCode").addEventListener("click", async () => {
  if (!state.email) {
    setStatus("authStatus", "Masukkan email terlebih dahulu.", "error");
    return;
  }
  await startVerification(state.email);
});
$("verifyForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const code = $("otp").value.trim();
  if (!/^[0-9]{6}$/.test(code)) {
    setStatus("authStatus", "Masukkan kode enam digit dari email.", "error");
    return;
  }
  const button = event.submitter;
  if (button) busy(button, true, "Memverifikasi…");
  try {
    if (!authClient.emailOtp?.verifyEmail) {
      throw new Error("Metode verifikasi email belum tersedia pada SDK yang dimuat.");
    }
    const result = await authClient.emailOtp.verifyEmail({ email: state.email, otp: code });
    if (result?.error) throw result.error;
    const session = await authClient.getSession();
    const user = session?.data?.user;
    if (!user || user.emailVerified !== true) {
      throw new Error("Email belum terverifikasi. Coba masuk kembali setelah verifikasi.");
    }
    await enterConsole(user);
    showGlobal("Email terverifikasi. Akses penerbit telah diaktifkan.", "success");
  } catch (error) {
    setStatus("authStatus", normalizeError(error), "error");
  } finally {
    if (button) busy(button, false);
  }
});
$("issuerForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = event.submitter;
  if (button) busy(button, true, "Mendaftarkan…");
  try {
    const result = await callRpc("register_digital_card_issuer", {
      p_issuer_key: $("issuerKey").value.trim().toLowerCase(),
      p_display_name: $("issuerName").value.trim(),
      p_issuer_type: $("issuerType").value
    });
    state.issuerId = result?.issuerId || "";
    setStatus("issuerStatus", "Penerbit berhasil didaftarkan.", "success");
    await loadIssuers();
    showGlobal("Penerbit berhasil didaftarkan.", "success");
  } catch (error) {
    setStatus("issuerStatus", normalizeError(error), "error");
  } finally {
    if (button) busy(button, false);
  }
});
$("issuerSelect").addEventListener("change", async () => {
  state.issuerId = $("issuerSelect").value;
  await loadCards();
});
$("refreshIssuers").addEventListener("click", loadIssuers);
$("refreshCards").addEventListener("click", loadCards);
$("signOut").addEventListener("click", async () => {
  const button = $("signOut");
  busy(button, true, "Keluar…");
  try {
    await authClient.signOut();
    state.user = null;
    state.issuers = [];
    state.issuerId = "";
    showAuth();
    setMode("signIn");
    showGlobal("Anda telah keluar.", "success");
  } catch (error) {
    setStatus("issuerStatus", normalizeError(error), "error");
  } finally {
    busy(button, false);
  }
});

setMode("signIn");
refreshSession().catch((error) => {
  showAuth();
  setStatus("authStatus", normalizeError(error), "error");
});
