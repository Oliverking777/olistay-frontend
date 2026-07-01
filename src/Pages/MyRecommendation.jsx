import { useEffect, useMemo, useState } from 'react'
import { getFinancialProfileRequest, computeFinancialProfileRequest } from '../api/FinancialProfileApi'
import { getRecommendations, getPropertyById } from '../api/PropertyApi'
import PropertyCard from '../Components/PropertyCard'

// ─── Feature Labels ───────────────────────────────────────────────────────────
const FEATURE_LABELS = {
  financial: 'Correspond bien à votre budget',
  goal_alignment: "Aligné avec vos objectifs d'épargne",
  household: 'Adapté à la taille de votre ménage',
  lifestyle: 'Correspond à vos préférences de style de vie',
  safety: 'Bon niveau de sécurité du quartier',
  stability: 'Bonne stabilité (bail, quartier)',
  rent: 'Loyer compétitif pour ce secteur',
  near_school: "Proche d'une école",
  near_market: "Proche d'un marché",
  near_hospital: "Proche d'un hôpital",
  near_highway: 'Bon accès routier',
  near_university: "Proche d'une université",
  has_parking: 'Dispose d\u2019un parking',
  has_generator: 'Accès générateur — utile en cas de coupures',
  has_water_meter: "Compteur d'eau individuel",
  fiber_internet: 'Internet fibre disponible',
  security_gate: 'Portail sécurisé',
  transport_score: 'Bon accès aux transports',
  landlord_reputation: 'Propriétaire bien noté',
  lease_security: 'Conditions de bail sécurisées',
  structural_quality: 'Bonne qualité de construction',
  condition_score: 'Logement en bon état',
}

// ─── Helpers ────────────────────────────────────────────────────────────────
const fmt = (n) => `${Math.round(n ?? 0).toLocaleString('fr-CM')} XAF`

function humanizeKey(key) {
  return key.replace(/_/g, ' ')
}

function buildMatchReasons(contributions) {
  if (!contributions || typeof contributions !== 'object') return []
  return Object.entries(contributions)
    .filter(([, v]) => typeof v === 'number' && v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([key]) => FEATURE_LABELS[key] || humanizeKey(key))
}

// hybrid/content/collaborative scores aren't documented as 0-1 vs 0-100 —
// normalize defensively rather than assuming.
function normalizeScore(raw) {
  if (typeof raw !== 'number' || Number.isNaN(raw)) return 0
  const pct = raw <= 1 ? raw * 100 : raw
  return Math.max(0, Math.min(100, Math.round(pct)))
}

function haversineKm(lat1, lon1, lat2, lon2) {
  if ([lat1, lon1, lat2, lon2].some((v) => typeof v !== 'number')) return null
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Merges one recommendation entry (raw ML dict: property_id + scores +
 * feature_contributions) with that property's full PropertyResponseDTO
 * (title, images, host name, etc — not present in the ML dict) into the
 * shape the card UI needs.
 */
function buildCard(rec, details, tenantCoords) {
  const primaryImage =
    details.images?.find((img) => img.isPrimary)?.imageUrl || details.images?.[0]?.imageUrl || null

  const distanceKm = tenantCoords
    ? haversineKm(tenantCoords.lat, tenantCoords.lon, details.gpsLat, details.gpsLon)
    : null

  const matchScoreRaw = rec.hybrid_score ?? rec.content_similarity_score ?? rec.collaborative_score

  return {
    id: details.id,
    title: details.title,
    unitType: details.unitType,
    city: details.city,
    neighbourhood: details.neighbourhood,
    zone: details.infraZone,
    rentMonthly: details.rentXaf,
    advanceMonths: details.advanceMonths,
    hasGenerator: details.hasGenerator,
    hasSharedWC: details.sharedWc,
    hasParking: details.hasParking,
    landlordName: details.hostName,
    landlordReputation: details.landlordReputation,
    distanceKm: distanceKm != null ? Math.round(distanceKm * 10) / 10 : null,
    primaryImage,
    matchScore: normalizeScore(matchScoreRaw),
    matchReasons: buildMatchReasons(rec.feature_contributions),
  }
}



// ─── Main Page ────────────────────────────────────────────────────────────────
const SORT_OPTIONS = {
  match: 'Meilleure correspondance',
  price_asc: 'Prix croissant',
  price_desc: 'Prix décroissant',
}

const MyRecommendation = () => {
  const [sortBy, setSortBy] = useState('match')
  const [budgetOnly, setBudgetOnly] = useState(false)

  // loading | no-profile | error | ready
  const [status, setStatus] = useState('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [budget, setBudget] = useState(null)
  const [rawProperties, setRawProperties] = useState([])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setStatus('loading')
      try {
        // 404 here means "no financial profile yet" — treated as a distinct
        // page state below, not an error.
        const profile = await getFinancialProfileRequest()
        const computed = await computeFinancialProfileRequest()
        const recommendResponse = await getRecommendations({ topN: 12 })

        const tenantCoords =
          typeof profile.gpsLat === 'number' && typeof profile.gpsLon === 'number'
            ? { lat: profile.gpsLat, lon: profile.gpsLon }
            : null

        const entries = recommendResponse.recommendations || []
        const cards = await Promise.all(
          entries.map(async (rec) => {
            try {
              const details = await getPropertyById(Number(rec.property_id))
              return buildCard(rec, details, tenantCoords)
            } catch {
              // Property may have changed status since the pipeline ran
              // (e.g. no longer AVAILABLE) — drop it rather than failing
              // the whole page.
              return null
            }
          })
        )

        if (cancelled) return
        setBudget({
          maxSustainableRent: computed.max_sustainable_rent,
          recommendedMin: computed.recommended_rent_range_min,
          recommendedMax: computed.recommended_rent_range_max,
          financialHealth: computed.financial_health,
        })
        setRawProperties(cards.filter(Boolean))
        setStatus('ready')
      } catch (err) {
        if (cancelled) return
        if (err.status === 404) {
          setStatus('no-profile')
        } else {
          // Never surface raw backend/ML-engine exception text to the user
          // (e.g. "AI Engine call to /financial/profile failed with status
          // 422 ..."). Log the technical detail for debugging and show a
          // friendly, actionable message instead.
          console.error('Failed to load recommendations:', err)
          setErrorMessage(
            'Un problème est survenu lors du calcul de vos recommandations. ' +
            'Veuillez réessayer dans quelques instants.'
          )
          setStatus('error')
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const properties = useMemo(() => {
    let list = [...rawProperties]
    if (budgetOnly && budget?.maxSustainableRent != null) {
      list = list.filter((p) => p.rentMonthly <= budget.maxSustainableRent)
    }

    if (sortBy === 'price_asc') list.sort((a, b) => a.rentMonthly - b.rentMonthly)
    else if (sortBy === 'price_desc') list.sort((a, b) => b.rentMonthly - a.rentMonthly)
    else list.sort((a, b) => b.matchScore - a.matchScore)

    return list
  }, [rawProperties, sortBy, budgetOnly, budget])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-slate-400">Calcul de vos recommandations…</p>
      </div>
    )
  }

  if (status === 'no-profile') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-lg font-bold text-slate-800 mb-2">Complétez votre profil financier</h1>
          <p className="text-sm text-slate-500">
            Pour recevoir des recommandations personnalisées, OLISTAY a besoin de connaître votre
            budget et votre situation. Rendez-vous dans la section « Mon profil financier » pour le
            renseigner — cela prend environ 5 minutes.
          </p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-lg font-bold text-slate-800 mb-2">Impossible de charger vos recommandations</h1>
          <p className="text-sm text-slate-500">{errorMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Page Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Vos Recommandations</h1>
            <p className="text-xs text-slate-500">Logements classés par l'IA Olistay selon votre profil financier</p>
          </div>
        </div>

        {/* Budget context banner */}
        {budget && (
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-5 text-white mt-5 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-1">Budget loyer recommandé</p>
                <p className="text-2xl font-extrabold">
                  {budget.recommendedMin != null && budget.recommendedMax != null
                    ? `${fmt(budget.recommendedMin)} – ${fmt(budget.recommendedMax)}`
                    : '—'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-blue-200 text-xs mb-1">Maximum soutenable</p>
                <p className="text-sm font-bold">
                  {budget.maxSustainableRent != null ? `${fmt(budget.maxSustainableRent)} / mois` : '—'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <p className="text-sm text-slate-500">{properties.length} logement(s) recommandé(s)</p>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => setBudgetOnly((b) => !b)}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  budgetOnly ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'
                }`}
              >
                {budgetOnly && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-slate-600">Dans mon budget uniquement</span>
            </label>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
            >
              {Object.entries(SORT_OPTIONS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results grid */}
        {properties.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-400">
            Aucun logement ne correspond à ces filtres pour le moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {properties.map((p) => (
              <PropertyCard key={p.id} property={p} maxSustainableRent={budget?.maxSustainableRent} matchReasons={p.matchReasons} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyRecommendation