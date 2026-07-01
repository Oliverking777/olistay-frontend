// Thin fetch wrapper around the backend's /auth/* endpoints.
//
// Access tokens are kept in memory only (a module-level variable), never in
// localStorage/sessionStorage — that's what avoids XSS token theft. The
// refresh token never touches JS at all; it lives in an httpOnly cookie set
// by the backend (see CookieUtil.java) and is sent automatically by the
// browser whenever credentials: 'include' is used.
//
// Because the access token lives only in memory, it is lost on a hard page
// refresh. AuthContext handles that by calling refreshRequest() once on app
// load to silently re-establish a session from the refresh cookie.

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8082';

let accessToken = null;

export function getAccessToken() {
  return accessToken;
}

function setAccessToken(token) {
  accessToken = token;
}

async function parseResponse(response) {
  // Some endpoints (logout) return 204 No Content — guard against empty bodies.
  const raw = await response.text();
  const data = raw ? JSON.parse(raw) : null;

  if (!response.ok) {
    const message = data?.message || 'Something went wrong. Please try again.';
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

/**
 * POST /auth/register
 * payload: { firstName, lastName, email, password, phoneNumber }
 */
export async function registerRequest(payload) {
  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // required so the httpOnly refresh cookie gets stored
    body: JSON.stringify(payload),
  });
  const data = await parseResponse(response);
  setAccessToken(data.accessToken);
  return data;
}

/**
 * POST /auth/login
 * payload: { email, password }
 */
export async function loginRequest(payload) {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const data = await parseResponse(response);
  setAccessToken(data.accessToken);
  return data;
}

/**
 * POST /auth/refresh
 * No body — the refresh token comes from the httpOnly cookie automatically.
 * Used both for explicit refresh-on-401 and for restoring a session on
 * app load / page refresh.
 */
export async function refreshRequest() {
  const response = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });
  const data = await parseResponse(response);
  setAccessToken(data.accessToken);
  return data;
}

/**
 * POST /auth/logout
 * Requires a valid access token (SecurityConfig: /auth/logout is authenticated).
 * Always clears the local in-memory token, even if the request fails, so the
 * UI never gets stuck "logged in" client-side.
 */
export async function logoutRequest() {
  try {
    await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });
  } finally {
    setAccessToken(null);
  }
}

/**
 * Wrapper for any authenticated API call elsewhere in the app (properties,
 * favourites, etc). Attaches the current access token, and if the server
 * responds 401 (token expired), attempts exactly one silent refresh + retry
 * before giving up — mirroring the backend's documented flow in
 * JwtAuthenticationFilter: "the frontend's baseQueryWithReauth is responsible
 * for calling /auth/refresh and retrying."
 *
 * Usage: const res = await authFetch('/properties', { method: 'GET' })
 */
export async function authFetch(path, options = {}) {
  const doFetch = (token) =>
    fetch(`${BASE_URL}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

  let response = await doFetch(accessToken);

  if (response.status === 401) {
    // Refresh failing here means the refresh cookie itself is gone/expired —
    // let the caller (or AuthContext) treat that as "logged out".
    const refreshed = await refreshRequest();
    response = await doFetch(refreshed.accessToken);
  }

  return response;
}