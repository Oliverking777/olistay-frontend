// Thin fetch wrapper around the backend's /appointments/* endpoints.
//
// Every call goes through authFetch (AuthApi.js) — appointments are always
// scoped to the authenticated user (as tenant or host) and there are no
// public appointment endpoints.
//
// Status transition rules (enforced server-side, mirrored here as comments):
//   CONFIRMED — only the HOST may confirm a PENDING appointment
//   CANCELLED — either the tenant or host may cancel PENDING or CONFIRMED
//   PENDING   — creation-only state, never settable via updateStatus

import { authFetch } from './AuthApi'

async function parseResponse(response) {
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
// Tenant actions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /appointments
 * Tenant requests a visit for a property.
 *
 * payload: {
 *   propertyId:    number   (required)
 *   scheduledDate: string   ISO date "YYYY-MM-DD" (required, must be future)
 *   scheduledTime: string   "HH:MM" (optional)
 *   message:       string   (optional, max 1000 chars)
 * }
 *
 * Returns AppointmentResponseDTO (201 Created).
 * Throws 409 if the tenant already has an active request for this property.
 * Throws 409 if the property is not AVAILABLE.
 * Throws 403 if the caller is the property's own host.
 */
export async function requestAppointment(payload) {
  const response = await authFetch('/appointments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return parseResponse(response)
}

/**
 * GET /appointments/tenant/me?page=0&size=10&sort=createdAt,desc
 * The authenticated tenant's full appointment history, paginated.
 * Returns Page<AppointmentResponseDTO>.
 *
 * pageable: { page, size, sort } — all optional
 */
export async function getMyAppointmentsAsTenant(pageable = {}) {
  const qs = buildQueryString(pageable)
  const response = await authFetch(
    `/appointments/tenant/me${qs ? `?${qs}` : ''}`,
    { method: 'GET' }
  )
  return parseResponse(response)
}

/**
 * Cancel an appointment as the tenant.
 * Delegates to updateAppointmentStatus with status CANCELLED.
 *
 * reason: optional cancellation message shown to the host.
 */
export async function cancelAppointmentAsTenant(appointmentId, reason = null) {
  return updateAppointmentStatus(appointmentId, {
    status: 'CANCELLED',
    cancellationReason: reason,
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Host actions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /appointments/host/me?page=0&size=10
 * All visit requests across the authenticated host's properties, paginated.
 * Returns Page<AppointmentResponseDTO>.
 */
export async function getMyAppointmentsAsHost(pageable = {}) {
  const qs = buildQueryString(pageable)
  const response = await authFetch(
    `/appointments/host/me${qs ? `?${qs}` : ''}`,
    { method: 'GET' }
  )
  return parseResponse(response)
}

/**
 * GET /appointments/property/{propertyId}?page=0&size=10
 * All appointments for one specific property. Caller must be the owning
 * host — 403 otherwise. Returns Page<AppointmentResponseDTO>.
 */
export async function getAppointmentsForProperty(propertyId, pageable = {}) {
  const qs = buildQueryString(pageable)
  const response = await authFetch(
    `/appointments/property/${propertyId}${qs ? `?${qs}` : ''}`,
    { method: 'GET' }
  )
  return parseResponse(response)
}

/**
 * Confirm a PENDING appointment as the host.
 * Delegates to updateAppointmentStatus with status CONFIRMED.
 * Throws 403 if caller is not the host.
 * Throws 409 if the appointment is not PENDING.
 */
export async function confirmAppointment(appointmentId) {
  return updateAppointmentStatus(appointmentId, {
    status: 'CONFIRMED',
    cancellationReason: null,
  })
}

/**
 * Cancel an appointment as the host.
 * Delegates to updateAppointmentStatus with status CANCELLED.
 *
 * reason: optional cancellation message shown to the tenant.
 */
export async function cancelAppointmentAsHost(appointmentId, reason = null) {
  return updateAppointmentStatus(appointmentId, {
    status: 'CANCELLED',
    cancellationReason: reason,
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /appointments/{id}
 * Returns a single AppointmentResponseDTO.
 * Caller must be the tenant or host on the appointment — 403 otherwise.
 */
export async function getAppointmentById(id) {
  const response = await authFetch(`/appointments/${id}`, { method: 'GET' })
  return parseResponse(response)
}

/**
 * PATCH /appointments/{id}/status
 * Low-level status updater — prefer the named wrappers above
 * (confirmAppointment, cancelAppointmentAsTenant, cancelAppointmentAsHost)
 * which make the intent explicit at the call site.
 *
 * payload: {
 *   status:             'CONFIRMED' | 'CANCELLED'  (required)
 *   cancellationReason: string | null               (optional, for CANCELLED)
 * }
 *
 * Returns updated AppointmentResponseDTO.
 * Throws 403 if caller lacks permission for the requested transition.
 * Throws 409 if the transition is not valid for the current status.
 */
export async function updateAppointmentStatus(appointmentId, payload) {
  const response = await authFetch(`/appointments/${appointmentId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return parseResponse(response)
}