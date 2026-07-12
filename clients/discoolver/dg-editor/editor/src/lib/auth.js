import { api } from "./api";

const TOKEN_KEY = "dg_editor_token";
const USER_KEY  = "dg_editor_user";

export function getToken() { return localStorage.getItem(TOKEN_KEY); }
export function getUser()  {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || "null"); }
  catch { return null; }
}
export function isLoggedIn() { return !!getToken(); }

// ── Login con credenciales propias (modo standalone) ─────────────────────────
export async function login(email, password) {
  const form = new FormData();
  form.append("username", email);
  form.append("password", password);
  const { data } = await api.post("/v2/auth/token", form, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  _storeToken(data.access_token, { name: data.name, role: data.role, email });
  return data;
}

// ── Login con token del CMS de Discoolver (modo embedded) ────────────────────
// Cuando el editor vive dentro de cms.discoolver.com, el token del CMS se pasa
// directamente como ?cms_token=XXX en la URL. No hace falta exchange.
export async function cmsLogin(cmsToken) {
  // Intentar exchange (modo FastAPI legacy)
  // En modo Spring Boot, el token del CMS es directamente válido — lo usamos tal cual
  try {
    const { data } = await api.post("/v2/auth/cms-login", { cms_token: cmsToken });
    _storeToken(data.access_token, { name: data.name, role: data.role });
    return data;
  } catch {
    // Si el backend no tiene /cms-login (Spring Boot), usar el token directamente
    _storeToken(cmsToken, { name: "Usuario CMS", role: "editor" });
    return { access_token: cmsToken };
  }
}

// ── Login silencioso: token inyectado por la página padre (Next.js) ───────────
// Tres formas de inyectar token (en orden de prioridad):
// 1. URL param: ?token=XXX o ?cms_token=XXX (iFrame desde CMS)
// 2. window.DISCOOLVER_TOKEN (Next.js injectando variable global)
// 3. localStorage (sesión local previa)
export function tryInjectToken() {
  // 1. Buscar en URL params (?token=XXX, ?cms_token=XXX, ?cmsToken=XXX)
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token") || params.get("cms_token") || params.get("cmsToken");

    if (urlToken && urlToken !== getToken()) {
      _storeToken(urlToken, { name: "Usuario CMS", role: "editor" });
      // Limpiar URL (no mostrar token en address bar después de usar)
      window.history.replaceState({}, document.title, window.location.pathname);
      return true;
    }
  }

  // 2. Buscar en window.DISCOOLVER_TOKEN (Next.js embedding)
  const windowToken = typeof window !== "undefined" && window.DISCOOLVER_TOKEN;
  if (windowToken && windowToken !== getToken()) {
    _storeToken(windowToken, { name: "Usuario CMS", role: "editor" });
    return true;
  }

  return false;
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  delete api.defaults.headers.common["Authorization"];
  // En modo embedded, notificar al padre en lugar de redirigir
  if (typeof window !== "undefined" && window.parent !== window) {
    window.parent.postMessage({ type: "DISCOOLVER_LOGOUT" }, "*");
  } else {
    window.location.replace("/login");
  }
}

function _storeToken(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

// ── Auto-attach token al cargar el módulo ────────────────────────────────────
tryInjectToken();
const token = getToken();
if (token) api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
