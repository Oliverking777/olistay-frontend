import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { searchProperties } from '../api/PropertyApi'
import PropertyCard from '../Components/PropertyCard'

// ─── Property types — must match olistay.backend.enums.PropertyType exactly ──
const PROPERTY_TYPES = [
  { value: 'STUDIO', label: 'Studio' },
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'HOUSE', label: 'House' },
  { value: 'LAND', label: 'Land' },
  { value: 'SHOP', label: 'Shop' },
  { value: 'STORE', label: 'Store' },
  { value: 'OFFICE', label: 'Office' },
  { value: 'WAREHOUSE', label: 'Warehouse' },
]

// Converts the UI's "2+" / "1.5+" pill values into the numeric minimum the
// backend's minBedrooms/minBathrooms params expect. "Any" → undefined (the
// filter is dropped entirely, matching how propertyApi's buildQueryString
// skips null/undefined values).
const parseMinValue = (pillValue) => {
  if (!pillValue || pillValue === 'Any') return undefined
  return parseFloat(pillValue.replace('+', ''))
}

const SORT_OPTIONS = [
  { label: 'Best match', sort: undefined },
  { label: 'Price (low to high)', sort: 'rentXaf,asc' },
  { label: 'Price (high to low)', sort: 'rentXaf,desc' },
  { label: 'Newest', sort: 'createdAt,desc' },
]

// ─── Filter dropdown wrapper ─────────────────────────────────────────────────
const FilterButton = ({ label, active, open, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg border text-sm font-medium whitespace-nowrap transition-colors ${
      active || open
        ? 'border-blue-600 text-blue-600 bg-blue-50'
        : 'border-gray-300 text-slate-700 hover:bg-gray-50'
    }`}
  >
    {label}
    <svg
      width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round"
      className={`transition-transform ${open ? 'rotate-180' : ''}`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  </button>
)

// ─── Property Type dropdown panel ────────────────────────────────────────────
const PropertyTypeDropdown = ({ selected, onChange, onApply, onClose }) => {
  const toggle = (value) => {
    onChange((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    )
  }

  return (
    <div className="absolute left-0 top-full mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-200 z-40 overflow-hidden">
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
        <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Property Type</h4>
      </div>
      <div className="px-5 py-4 grid grid-cols-2 gap-2">
        {PROPERTY_TYPES.map((pt) => {
          const isChecked = selected.includes(pt.value)
          return (
            <label
              key={pt.value}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-colors ${
                isChecked ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-slate-700 hover:bg-gray-50'
              }`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggle(pt.value)}
                className="accent-blue-600 w-3.5 h-3.5"
              />
              {pt.label}
            </label>
          )
        })}
      </div>
      <div className="px-5 pb-4 flex items-center justify-between">
        <button
          onClick={() => onChange([])}
          className="text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          Reset
        </button>
        <button
          onClick={() => { onApply(); onClose() }}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Apply
        </button>
      </div>
    </div>
  )
}

// ─── Bedrooms & Bathrooms dropdown panel ─────────────────────────────────────
const BedroomsDropdown = ({ selectedBeds, onChangeBeds, selectedBaths, onChangeBaths, onApply, onClose }) => {
  const bedOptions = ['Any', '1+', '2+', '3+', '4+', '5+']
  const bathOptions = ['Any', '1+', '1.5+', '2+', '3+', '4+']

  return (
    <div className="absolute left-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-40 overflow-hidden">
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
        <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Bedrooms & Bathrooms</h4>
      </div>
      <div className="px-5 py-4">
        <p className="text-sm font-semibold text-slate-700 mb-2">Bedrooms</p>
        <div className="flex flex-wrap gap-2">
          {bedOptions.map((opt) => {
            const isActive = selectedBeds === opt
            return (
              <button
                key={opt}
                onClick={() => onChangeBeds(opt)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-300 text-slate-700 hover:bg-gray-50'
                }`}
              >
                {opt}
              </button>
            )
          })}
        </div>
      </div>

      <div className="px-5 py-4 border-t border-gray-100">
        <p className="text-sm font-semibold text-slate-700 mb-2">Bathrooms</p>
        <div className="flex flex-wrap gap-2">
          {bathOptions.map((opt) => {
            const isActive = selectedBaths === opt
            return (
              <button
                key={opt}
                onClick={() => onChangeBaths(opt)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-300 text-slate-700 hover:bg-gray-50'
                }`}
              >
                {opt}
              </button>
            )
          })}
        </div>
      </div>

      <div className="px-5 pb-4 pt-2">
        <button
          onClick={() => { onApply(); onClose() }}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Apply
        </button>
      </div>
    </div>
  )
}

// ─── Price Range dropdown panel ──────────────────────────────────────────────
const PriceDropdown = ({ min, max, onChangeMin, onChangeMax, onApply, onClose }) => {
  const presets = [50000, 100000, 150000, 250000, 400000, 600000]

  return (
    <div className="absolute left-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-40 overflow-hidden">
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
        <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Price Range (XAF / month)</h4>
      </div>
      <div className="px-5 py-4 flex items-center gap-3">
        <div className="flex-1">
          <label className="block text-xs text-slate-500 mb-1">Min</label>
          <select
            value={min}
            onChange={(e) => onChangeMin(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
          >
            <option value="">No min</option>
            {presets.map((p) => (
              <option key={p} value={p}>{p.toLocaleString()} XAF</option>
            ))}
          </select>
        </div>
        <span className="text-slate-400 mt-5">—</span>
        <div className="flex-1">
          <label className="block text-xs text-slate-500 mb-1">Max</label>
          <select
            value={max}
            onChange={(e) => onChangeMax(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
          >
            <option value="">No max</option>
            {presets.map((p) => (
              <option key={p} value={p}>{p.toLocaleString()} XAF</option>
            ))}
          </select>
        </div>
      </div>
      <div className="px-5 pb-4">
        <button
          onClick={() => { onApply(); onClose() }}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Apply
        </button>
      </div>
    </div>
  )
}

// ─── Helpers to adapt PropertySummaryDTO → UI display shape ─────────────────
const formatPrice = (rentXaf) =>
  rentXaf != null ? `${Number(rentXaf).toLocaleString()} XAF/mo` : 'Price on request'

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=70'

function ListingCard({ listing, onHover }) {
  const propertyForCard = {
    id: listing.id,
    title: listing.title || listing.neighbourhood || 'Property',
    unitType: listing.unitType || 'T1',
    city: listing.city,
    neighbourhood: listing.neighbourhood,
    zone: listing.infraZone,
    rentMonthly: listing.rentXaf,
    advanceMonths: listing.advanceMonths,
    hasGenerator: listing.hasGenerator,
    hasParking: listing.hasParking,
    hasSharedWC: listing.sharedWc,
    landlordName: listing.hostName,
    landlordReputation: listing.landlordReputation,
    primaryImage: listing.primaryImageUrl || FALLBACK_IMG,
    matchScore: null,
  }

  return (
    <div
      onMouseEnter={() => onHover(listing.id)}
      onMouseLeave={() => onHover(null)}
      className="block no-underline transition-shadow"
    >
      <PropertyCard property={propertyForCard} />
    </div>
  )
}

// ─── Custom price-bubble marker icon ─────────────────────────────────────────
const createPriceIcon = (priceLabel, isHovered) =>
  L.divIcon({
    className: 'custom-price-marker',
    html: `<div style="
      background:${isHovered ? '#1d4ed8' : '#dc2626'};
      color:white;
      font-weight:600;
      font-size:12px;
      padding:6px 10px;
      border-radius:9999px;
      box-shadow:0 2px 6px rgba(0,0,0,0.3);
      white-space:nowrap;
      transform:${isHovered ? 'scale(1.1)' : 'scale(1)'};
      transition: transform 0.15s ease, background 0.15s ease;
    ">${priceLabel}</div>`,
    iconSize: null,
    iconAnchor: [30, 16],
  })

// Recenters the map when the listing set changes (e.g. after a new search)
const MapAutoBounds = ({ listings }) => {
  const map = useMap()
  useEffect(() => {
    const withCoords = listings.filter((l) => l.gpsLat != null && l.gpsLon != null)
    if (withCoords.length === 0) return
    const bounds = L.latLngBounds(withCoords.map((l) => [l.gpsLat, l.gpsLon]))
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
  }, [listings, map])
  return null
}

// ─── Map panel — real interactive Leaflet map ───────────────────────────────
const MapPanel = ({ listings, hoveredId, onHover }) => {
  const withCoords = listings.filter((l) => l.gpsLat != null && l.gpsLon != null)
  const center = withCoords.length
    ? [withCoords[0].gpsLat, withCoords[0].gpsLon]
    : [3.87, 11.52] // fallback: Yaoundé

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapAutoBounds listings={withCoords} />

        {withCoords.map((listing) => {
          const isHovered = hoveredId === listing.id
          const priceLabel = listing.rentXaf
            ? `${Math.round(listing.rentXaf / 1000)}K`
            : '—'
          return (
            <Marker
              key={listing.id}
              position={[listing.gpsLat, listing.gpsLon]}
              icon={createPriceIcon(priceLabel, isHovered)}
              eventHandlers={{
                mouseover: () => onHover(listing.id),
                mouseout: () => onHover(null),
              }}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-bold text-slate-800">{formatPrice(listing.rentXaf)}</p>
                  <p className="text-slate-600">
                    {listing.numBedrooms ?? 0} bd | {listing.numBathrooms ?? 0} ba
                    {listing.areaM2 ? ` | ${listing.areaM2} m²` : ''}
                  </p>
                  <p className="text-slate-500">{listing.neighbourhood}, {listing.city}</p>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      {/* Results chip overlay */}
      <div className="absolute top-4 left-4 z-[1000] bg-slate-800/90 text-white text-xs font-medium px-3 py-1.5 rounded-md shadow pointer-events-none">
        Showing {listings.length} results in this area
      </div>
    </div>
  )
}

// ─── Main Search Page ─────────────────────────────────────────────────────────
const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [hoveredId, setHoveredId] = useState(null)
  const [sortOpen, setSortOpen] = useState(false)
  const [sortBy, setSortBy] = useState('Best match')

  // Filter state
  const [openDropdown, setOpenDropdown] = useState(null) // 'propertyType' | 'bedrooms' | 'price' | null
  const [propertyTypes, setPropertyTypes] = useState([])
  const [bedrooms, setBedrooms] = useState('Any')
  const [bathrooms, setBathrooms] = useState('Any')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')

  // Results state
  const [listings, setListings] = useState([])
  const [totalResults, setTotalResults] = useState(0)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const toggleDropdown = (name) => setOpenDropdown((cur) => (cur === name ? null : name))

  const propertyTypeLabel = propertyTypes.length
    ? `Property type (${propertyTypes.length})`
    : 'Property type'
  const bedBathLabel = (bedrooms === 'Any' && bathrooms === 'Any')
    ? 'Beds & baths'
    : [bedrooms !== 'Any' ? `${bedrooms} bd` : null, bathrooms !== 'Any' ? `${bathrooms} ba` : null]
        .filter(Boolean)
        .join(', ')
  const priceLabel = (priceMin || priceMax)
    ? `${priceMin ? Number(priceMin).toLocaleString() : 'Any'} – ${priceMax ? Number(priceMax).toLocaleString() : 'Any'}`
    : 'Price'

  // Fetch results whenever query, filters, sort, or page change.
  const runSearch = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const sortValue = SORT_OPTIONS.find((s) => s.label === sortBy)?.sort
      const filter = {
        keyword: query || undefined,
        propertyTypes,
        minBedrooms: parseMinValue(bedrooms),
        minBathrooms: parseMinValue(bathrooms),
        minPrice: priceMin || undefined,
        maxPrice: priceMax || undefined,
      }
      const pageable = {
        page,
        size: 12,
        sort: sortValue,
      }

      const data = await searchProperties(filter, pageable)
      setListings(data.content || [])
      setTotalResults(data.totalElements ?? (data.content || []).length)
      setTotalPages(data.totalPages ?? 1)
    } catch (err) {
      setError(err.message || 'Could not load listings. Please try again.')
      setListings([])
    } finally {
      setIsLoading(false)
    }
  }, [query, propertyTypes, bedrooms, bathrooms, priceMin, priceMax, sortBy, page])

  useEffect(() => {
    runSearch()
  }, [runSearch])

  // Reset to page 0 whenever a filter actually changes (not on page itself).
  useEffect(() => {
    setPage(0)
  }, [query, propertyTypes, bedrooms, bathrooms, priceMin, priceMax, sortBy])

  // Keep the URL's ?q= in sync so the search is shareable/bookmarkable.
  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setSearchParams(query ? { q: query } : {})
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search / filter bar */}
      <div className="relative flex items-center gap-2.5 px-6 py-3 border-b border-gray-200 bg-white flex-wrap">
        {/* Address search */}
        <form
          onSubmit={handleSearchSubmit}
          className="flex items-center gap-2 flex-1 min-w-[220px] max-w-md border border-gray-300 rounded-lg px-3.5 py-2.5"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Address, neighbourhood, city"
            className="flex-1 text-sm outline-none placeholder-slate-400"
          />
        </form>

        {/* Property Type */}
        <div className="relative">
          <FilterButton
            label={propertyTypeLabel}
            active={propertyTypes.length > 0}
            open={openDropdown === 'propertyType'}
            onClick={() => toggleDropdown('propertyType')}
          />
          {openDropdown === 'propertyType' && (
            <PropertyTypeDropdown
              selected={propertyTypes}
              onChange={setPropertyTypes}
              onApply={runSearch}
              onClose={() => setOpenDropdown(null)}
            />
          )}
        </div>

        {/* Bedrooms & Bathrooms */}
        <div className="relative">
          <FilterButton
            label={bedBathLabel}
            active={bedrooms !== 'Any' || bathrooms !== 'Any'}
            open={openDropdown === 'bedrooms'}
            onClick={() => toggleDropdown('bedrooms')}
          />
          {openDropdown === 'bedrooms' && (
            <BedroomsDropdown
              selectedBeds={bedrooms}
              onChangeBeds={setBedrooms}
              selectedBaths={bathrooms}
              onChangeBaths={setBathrooms}
              onApply={runSearch}
              onClose={() => setOpenDropdown(null)}
            />
          )}
        </div>

        {/* Price */}
        <div className="relative">
          <FilterButton
            label={priceLabel}
            active={Boolean(priceMin || priceMax)}
            open={openDropdown === 'price'}
            onClick={() => toggleDropdown('price')}
          />
          {openDropdown === 'price' && (
            <PriceDropdown
              min={priceMin}
              max={priceMax}
              onChangeMin={setPriceMin}
              onChangeMax={setPriceMax}
              onApply={runSearch}
              onClose={() => setOpenDropdown(null)}
            />
          )}
        </div>
      </div>

      {/* Click-away overlay to close dropdowns */}
      {openDropdown && (
        <div className="fixed inset-0 z-30" onClick={() => setOpenDropdown(null)} />
      )}

      {/* Body: map + listings */}
      <div className="flex flex-1 min-h-0">
        {/* Map panel */}
        <div className="w-[42%] min-w-[320px] hidden md:block">
          <MapPanel listings={listings} hoveredId={hoveredId} onHover={setHoveredId} />
        </div>

        {/* Listings panel */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <h1 className="text-xl font-bold text-slate-800">
                Rentals in Cameroon
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {isLoading ? 'Searching…' : `${totalResults} result${totalResults === 1 ? '' : 's'}`}
              </p>
            </div>

            {/* Sort dropdown */}
            <div className="relative">
              <button
                onClick={() => setSortOpen((o) => !o)}
                className="flex items-center gap-1.5 text-sm font-semibold text-blue-600"
              >
                Sort: {sortBy}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {sortOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-30">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => { setSortBy(opt.label); setSortOpen(false) }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                        sortBy === opt.label ? 'text-blue-600 font-medium' : 'text-slate-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
                  <div className="h-44 bg-gray-200" />
                  <div className="p-3.5 space-y-2">
                    <div className="h-4 w-1/3 bg-gray-200 rounded" />
                    <div className="h-3 w-2/3 bg-gray-100 rounded" />
                    <div className="h-3 w-1/2 bg-gray-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error state */}
          {!isLoading && error && (
            <div className="flex flex-col items-center justify-center text-center py-16 px-6">
              <p className="text-sm text-red-600 font-medium mb-2">{error}</p>
              <button
                onClick={runSearch}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Try again
              </button>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !error && listings.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center py-16 px-6">
              <p className="text-base font-semibold text-slate-700 mb-1">No listings match your search</p>
              <p className="text-sm text-slate-500">Try widening your price range or removing a filter.</p>
            </div>
          )}

{/* Listings grid */}
           {!isLoading && !error && listings.length > 0 && (
             <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-4">
               {listings.map((listing) => (
                 <ListingCard
                   key={listing.id}
                   listing={listing}
                   onHover={setHoveredId}
                 />
               ))}
             </div>
           )}

          {/* Pagination */}
          {!isLoading && !error && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8 pb-4">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-slate-600 disabled:text-slate-300 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
              </button>

              {Array.from({ length: totalPages }).slice(0, 5).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                    page === i
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-200 text-slate-600 hover:bg-gray-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-slate-600 disabled:text-slate-300 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SearchPage