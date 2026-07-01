// Thin fetch wrapper around the backend's /users/* endpoints.
//
// Every call goes through authFetch (AuthApi.js) so the in-memory access
// token is attached automatically, and a 401 triggers exactly one silent
// refresh + retry before failing — same contract as the rest of the app.

import { authFetch } from './AuthApi'

async function parseResponse(response) {
  // DELETE /users/me returns 204 No Content — guard against empty bodies.
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

/**
 * GET /users/me
 * Returns the authenticated user's own profile.
 */
export async function getCurrentUserRequest() {
  const response = await authFetch('/users/me', { method: 'GET' })
  return parseResponse(response)
}

/**
 * PATCH /users/me
 * payload: { firstName?, lastName?, phoneNumber? }
 * Only send the fields that actually changed — backend applies PATCH
 * semantics (null/omitted fields are left untouched). Email and role are
 * not editable through this endpoint.
 */
export async function updateCurrentUserRequest(payload) {
  const response = await authFetch('/users/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return parseResponse(response)
}

/**
 * GET /users/:id
 * Public profile lookup (e.g. for displaying host info on listings).
 */
export async function getUserByIdRequest(id) {
  const response = await authFetch(`/users/${id}`, { method: 'GET' })
  return parseResponse(response)
}

/**
 * DELETE /users/me
 * Permanently deletes the authenticated user's account and revokes all
 * refresh tokens server-side. Caller is responsible for clearing local
 * auth state (AuthContext.logout / navigate away) afterwards.
 */
export async function deleteCurrentUserRequest() {
  const response = await authFetch('/users/me', { method: 'DELETE' })
  if (!response.ok) {
    // Will throw with the backend's error message via parseResponse.
    await parseResponse(response)
  }
  return null
}

/**
 * PATCH /users/me/become-host
 * Promotes the authenticated GUEST to a HOST role.
 * payload: { nationalIdNumber, cityOfOperation, intendedPropertyCount }
 */
export async function becomeHostRequest(payload) {
  const response = await authFetch('/users/me/become-host', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return parseResponse(response)
}