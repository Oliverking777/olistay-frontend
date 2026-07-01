// Thin fetch wrapper around the backend's /properties/* endpoints.
//
// Uses authFetch from AuthApi.js for endpoints that need an access token
// (create/update/delete/my-listings) and a plain fetch for public browse/
// search endpoints, since those don't require auth and shouldn't trigger
// a refresh attempt on a 401 that will never come.

import { authFetch } from './AuthApi'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8082'

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
 * Builds a URLSearchParams string from a filter object, skipping
 * null/undefined/empty values and repeating the key for array values
 * (matches Spring's @RequestParam List<T> binding style:
 * ?propertyTypes=APARTMENT&propertyTypes=STUDIO).
 */
function buildQueryString(params) {
  const qs = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') return

    if (Array.isArray(value)) {
      if (value.length === 0) return
      value.forEach((v) => qs.append(key, v))
    } else {
      qs.append(key, value)
    }
  })

  return qs.toString()
}

/**
 * GET /properties — default browse feed, AVAILABLE only, paginated.
 * pageable: { page, size, sort } — all optional, mirrors Spring's Pageable
 * query param binding (e.g. ?page=0&size=20&sort=rentXaf,asc).
 */
export async function browseProperties(pageable = {}) {
  const qs = buildQueryString(pageable)
  const response = await fetch(`${BASE_URL}/properties${qs ? `?${qs}` : ''}`)
  return parseResponse(response)
}

/**
 * GET /properties/filter — combined search backing SearchPage.jsx.
 *
 * filter: {
 * keyword?: string,
 * city?: string,
 * propertyTypes?: string[],   // e.g. ['APARTMENT', 'STUDIO'] — must match
 * // the PropertyType enum values exactly
 * minBedrooms?: number,
 * minBathrooms?: number,
 * minPrice?: number,
 * maxPrice?: number,
 * }
 * pageable: { page, size, sort }
 */
export async function searchProperties(filter = {}, pageable = {}) {
  const qs = buildQueryString({ ...filter, ...pageable })
  const response = await fetch(`${BASE_URL}/properties/filter${qs ? `?${qs}` : ''}`)
  return parseResponse(response)
}

/**
 * GET /properties/search?keyword=... — plain keyword search (no filters).
 * Kept for places that just need a simple text search without the full
 * filter bar (e.g. a quick search box elsewhere in the app).
 */
export async function searchByKeyword(keyword, pageable = {}) {
  const qs = buildQueryString({ keyword, ...pageable })
  const response = await fetch(`${BASE_URL}/properties/search?${qs}`)
  return parseResponse(response)
}

/**
 * GET /properties/{id} — public detail view, AVAILABLE only, full images.
 */
export async function getPropertyById(id) {
  const response = await fetch(`${BASE_URL}/properties/${id}`)
  return parseResponse(response)
}

/**
 * GET /properties/city/{city}
 */
export async function browseByCity(city, pageable = {}) {
  const qs = buildQueryString(pageable)
  const response = await fetch(`${BASE_URL}/properties/city/${encodeURIComponent(city)}${qs ? `?${qs}` : ''}`)
  return parseResponse(response)
}

/**
 * GET /properties/city/{city}/neighbourhood/{neighbourhood}
 */
export async function browseByCityAndNeighbourhood(city, neighbourhood, pageable = {}) {
  const qs = buildQueryString(pageable)
  const response = await fetch(
    `${BASE_URL}/properties/city/${encodeURIComponent(city)}/neighbourhood/${encodeURIComponent(neighbourhood)}${qs ? `?${qs}` : ''}`
  )
  return parseResponse(response)
}

/**
 * GET /properties/me — authenticated HOST's full portfolio.
 */
export async function getMyListings() {
  const response = await authFetch('/properties/me', { method: 'GET' })
  return parseResponse(response)
}

/**
 * GET /properties/recommendations?city=&topN=
 * Runs the full hybrid recommendation pipeline for the authenticated tenant.
 * 404 if the tenant has no financial profile yet (callers should treat that
 * as "send them to create one", same convention as
 * getFinancialProfileRequest's 404).
 */
export async function getRecommendations({ city, topN } = {}) {
  const qs = buildQueryString({ city, topN })
  const response = await authFetch(`/properties/recommendations${qs ? `?${qs}` : ''}`, { method: 'GET' })
  return parseResponse(response)
}

/**
 * GET /properties/{id}/details — full detail regardless of status, for the
 * owning HOST or ADMIN (e.g. previewing an UNDER_REVIEW listing).
 */
export async function getPropertyDetails(id) {
  const response = await authFetch(`/properties/${id}/details`, { method: 'GET' })
  return parseResponse(response)
}

/**
 * POST /properties/suggest-rent
 * Calls the AI Engine's XGBoost rent predictor for the property data filled out so far.
 * Requires authentication (any authenticated user).
 */
export async function suggestRent(propertyData) {
  const response = await authFetch('/properties/suggest-rent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(propertyData),
  })
  return parseResponse(response)
}

/**
 * GET /properties/{id}/score
 * Scores how well this property fits the authenticated tenant based on their saved financial profile.
 */
export async function getPropertyScore(id) {
  const response = await authFetch(`/properties/${id}/score`, { method: 'GET' })
  return parseResponse(response)
}

/**
 * GET /properties/{id}/hidden-costs
 * Computes the true total cost of occupancy for this property against the tenant's profile.
 */
export async function getPropertyHiddenCosts(id) {
  const response = await authFetch(`/properties/${id}/hidden-costs`, { method: 'GET' })
  return parseResponse(response)
}

/**
 * POST /properties — create a listing (HOST/ADMIN only).
 * propertyData: object matching PropertyRequestDTO
 * imageFiles: File[] (optional) — first file becomes the primary image.
 */
export async function createProperty(propertyData, imageFiles = []) {
  const formData = new FormData()
  formData.append('property', new Blob([JSON.stringify(propertyData)], { type: 'application/json' }))
  imageFiles.forEach((file) => formData.append('images', file))

  const response = await authFetch('/properties', {
    method: 'POST',
    body: formData,
  })
  return parseResponse(response)
}

/**
 * PUT /properties/{id} — full update (HOST/ADMIN only). JSON body.
 */
export async function updateProperty(id, propertyData) {
  const response = await authFetch(`/properties/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(propertyData),
  })
  return parseResponse(response)
}

/**
 * PATCH /properties/{id}/status?status=AVAILABLE
 */
export async function updatePropertyStatus(id, status) {
  const response = await authFetch(`/properties/${id}/status?status=${status}`, {
    method: 'PATCH',
  })
  return parseResponse(response)
}

/**
 * DELETE /properties/{id}
 */
export async function deleteProperty(id) {
  const response = await authFetch(`/properties/${id}`, { method: 'DELETE' })
  if (!response.ok) {
    const raw = await response.text()
    const data = raw ? JSON.parse(raw) : null
    const error = new Error(data?.message || 'Failed to delete property')
    error.status = response.status
    throw error
  }
}

/**
 * POST /properties/{id}/images — add images to an existing listing.
 */
export async function uploadPropertyImages(id, imageFiles) {
  const formData = new FormData()
  imageFiles.forEach((file) => formData.append('images', file))

  const response = await authFetch(`/properties/${id}/images`, {
    method: 'POST',
    body: formData,
  })
  return parseResponse(response)
}

/**
 * DELETE /properties/{id}/images/{imageId}
 */
export async function deletePropertyImage(propertyId, imageId) {
  const response = await authFetch(`/properties/${propertyId}/images/${imageId}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    const raw = await response.text()
    const data = raw ? JSON.parse(raw) : null
    const error = new Error(data?.message || 'Failed to delete image')
    error.status = response.status
    throw error
  }
}