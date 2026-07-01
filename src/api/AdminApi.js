// Thin fetch wrapper around the backend's /admin/* endpoints.
//
// Every call goes through authFetch (AuthApi.js) — the in-memory access
// token is attached automatically, and a 401 triggers exactly one silent
// refresh + retry before failing.
//
// All /admin/** routes are protected server-side by SecurityConfig
// (.requestMatchers("/admin/**").hasRole("ADMIN")) and by
// @PreAuthorize("hasRole('ADMIN')") on the controller class — these
// wrappers don't add client-side guards; the backend enforces them.

import { authFetch } from './AuthApi'

async function parseResponse(response) {
  // Some endpoints (revoke-sessions) return 204 No Content.
  const raw = await response.text()
  const data = raw ? JSON.parse(raw) : null

  if (!response.ok) {
    const message = data?.message || 'Something went wrong. Please try again.'
    const error = new Error(message)
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

function buildQueryString(params) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') return
    qs.append(key, value)
  })
  return qs.toString()
}

// ─────────────────────────────────────────────────────────────────────────────
// Listing moderation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /admin/listings/pending?page=0&size=20&sort=createdAt,desc
 * Returns paginated PropertySummaryDTO (with primaryImageUrl).
 * pageable: { page, size, sort } — all optional.
 */
export async function getPendingListings(pageable = {}) {
  const qs = buildQueryString(pageable)
  const response = await authFetch(
    `/admin/listings/pending${qs ? `?${qs}` : ''}`,
    { method: 'GET' }
  )
  return parseResponse(response)
}

/**
 * POST /admin/listings/{id}/approve
 * Transitions UNDER_REVIEW → AVAILABLE. Returns updated PropertyResponseDTO.
 * 409 if the listing is not currently UNDER_REVIEW.
 */
export async function approveListing(id) {
  const response = await authFetch(`/admin/listings/${id}/approve`, { method: 'POST' })
  return parseResponse(response)
}

/**
 * POST /admin/listings/{id}/reject
 * Transitions UNDER_REVIEW → ARCHIVED. Returns updated PropertyResponseDTO.
 * reason is optional but recommended for host UX.
 * 409 if the listing is not currently UNDER_REVIEW.
 */
export async function rejectListing(id, reason = null) {
  const response = await authFetch(`/admin/listings/${id}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  })
  return parseResponse(response)
}

/**
 * POST /admin/listings/{id}/archive
 * Forces any listing to ARCHIVED regardless of current status.
 * Used when a listing violates platform rules after it was already live.
 */
export async function archiveListing(id) {
  const response = await authFetch(`/admin/listings/${id}/archive`, { method: 'POST' })
  return parseResponse(response)
}

// ─────────────────────────────────────────────────────────────────────────────
// User management
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /admin/users?role=HOST&page=0&size=20
 * Returns paginated AdminUserResponseDTO (includes enabled, accountNonLocked,
 * createdAt — fields the public UserResponseDTO never exposes).
 * role: 'GUEST' | 'HOST' | 'ADMIN' | null (null = all users)
 */
export async function getUsers({ role = null, page, size, sort } = {}) {
  const qs = buildQueryString({ role, page, size, sort })
  const response = await authFetch(`/admin/users${qs ? `?${qs}` : ''}`, { method: 'GET' })
  return parseResponse(response)
}

/**
 * GET /admin/users/{id}
 * Returns a single AdminUserResponseDTO.
 */
export async function getAdminUserById(id) {
  const response = await authFetch(`/admin/users/${id}`, { method: 'GET' })
  return parseResponse(response)
}

/**
 * POST /admin/users/{id}/lock
 * Sets accountNonLocked = false. User can no longer log in. Existing
 * short-lived access tokens remain valid until they expire — combine with
 * revokeAllUserSessions() for immediate effect.
 */
export async function lockUser(id) {
  const response = await authFetch(`/admin/users/${id}/lock`, { method: 'POST' })
  return parseResponse(response)
}

/**
 * POST /admin/users/{id}/unlock
 * Sets accountNonLocked = true.
 */
export async function unlockUser(id) {
  const response = await authFetch(`/admin/users/${id}/unlock`, { method: 'POST' })
  return parseResponse(response)
}

/**
 * POST /admin/users/{id}/disable
 * Sets enabled = false — stronger than lock (Spring Security checks
 * isEnabled() before isAccountNonLocked()).
 */
export async function disableUser(id) {
  const response = await authFetch(`/admin/users/${id}/disable`, { method: 'POST' })
  return parseResponse(response)
}

/**
 * POST /admin/users/{id}/enable
 * Sets enabled = true.
 */
export async function enableUser(id) {
  const response = await authFetch(`/admin/users/${id}/enable`, { method: 'POST' })
  return parseResponse(response)
}

/**
 * POST /admin/users/{id}/revoke-sessions
 * Nukes all refresh tokens for the user — forces all open sessions to
 * expire at their next refresh cycle. Returns 204 No Content.
 * Call after lock/disable for immediate logout effect.
 */
export async function revokeAllUserSessions(id) {
  const response = await authFetch(`/admin/users/${id}/revoke-sessions`, { method: 'POST' })
  if (!response.ok) await parseResponse(response)
  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// Host management
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /admin/hosts?page=0&size=20
 * Returns paginated HostProfileAdminResponseDTO — includes nationalIdNumber,
 * cityOfOperation, intendedPropertyCount, promotedAt, plus host's user info.
 */
export async function getHosts({ page, size, sort } = {}) {
  const qs = buildQueryString({ page, size, sort })
  const response = await authFetch(`/admin/hosts${qs ? `?${qs}` : ''}`, { method: 'GET' })
  return parseResponse(response)
}

/**
 * GET /admin/hosts/{userId}
 * Returns a single HostProfileAdminResponseDTO by user ID (not host profile ID).
 */
export async function getHostByUserId(userId) {
  const response = await authFetch(`/admin/hosts/${userId}`, { method: 'GET' })
  return parseResponse(response)
}

/**
 * POST /admin/hosts/{userId}/demote
 * Downgrades HOST → GUEST role and revokes all their sessions immediately.
 * The HostProfile row is retained for audit — only the role changes.
 * Returns the updated AdminUserResponseDTO (role will now be GUEST).
 * 409 if the user is not currently a HOST.
 */
export async function demoteHost(userId) {
  const response = await authFetch(`/admin/hosts/${userId}/demote`, { method: 'POST' })
  return parseResponse(response)
}