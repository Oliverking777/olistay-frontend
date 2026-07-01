// Thin fetch wrapper around the backend's /tenant/financial-profile/* endpoints.
//
// Goes through authFetch (AuthApi.js) for token attach + 401 refresh-retry.
//
// IMPORTANT — two different JSON shapes:
//   - POST/PUT/GET /tenant/financial-profile and the request payload all use
//     plain camelCase (TenantFinancialProfileRequestDTO/ResponseDTO have no
//     @JsonProperty overrides), e.g. { monthlyIncome, expenseBreakdown: { housingUtilities } }
//   - GET /tenant/financial-profile/compute returns FinancialProfileMlResponseDTO,
//     which DOES use @JsonProperty snake_case overrides (it mirrors FastAPI's
//     own response shape), e.g. { max_sustainable_rent, financial_health }
// Don't camelCase the compute() response — consume it as snake_case as-is.

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

/**
 * GET /tenant/financial-profile
 * Returns the raw saved profile (camelCase), or throws with status 404
 * if the user hasn't created one yet — callers should treat that as
 * "show the create wizard", not as an error to surface.
 */
export async function getFinancialProfileRequest() {
  const response = await authFetch('/tenant/financial-profile', { method: 'GET' })
  return parseResponse(response)
}

/**
 * POST /tenant/financial-profile
 * Creates the profile. 409 if one already exists.
 * payload must match TenantFinancialProfileRequestDTO field-for-field (camelCase).
 */
export async function createFinancialProfileRequest(payload) {
  const response = await authFetch('/tenant/financial-profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return parseResponse(response)
}

/**
 * PUT /tenant/financial-profile
 * Fully replaces the existing profile. 404 if none exists yet.
 */
export async function updateFinancialProfileRequest(payload) {
  const response = await authFetch('/tenant/financial-profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return parseResponse(response)
}

/**
 * GET /tenant/financial-profile/compute
 * Calls FastAPI live and returns computed affordability figures
 * (snake_case keys — see file header note).
 */
export async function computeFinancialProfileRequest() {
  const response = await authFetch('/tenant/financial-profile/compute', { method: 'GET' })
  return parseResponse(response)
}

/**
 * DELETE /tenant/financial-profile
 */
export async function deleteFinancialProfileRequest() {
  const response = await authFetch('/tenant/financial-profile', { method: 'DELETE' })
  if (!response.ok) {
    await parseResponse(response)
  }
  return null
}