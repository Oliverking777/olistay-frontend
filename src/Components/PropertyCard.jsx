import { Link } from 'react-router-dom'

const UNIT_TYPE_LABELS = {
  chambre: 'Chambre',
  T1: 'Studio (T1)',
  T2: 'Appartement T2',
  T3: 'Appartement T3',
  T4: 'Appartement T4',
  T5: 'Appartement T5',
}

const ZONE_COLORS = {
  I: 'bg-emerald-100 text-emerald-700',
  II: 'bg-emerald-100 text-emerald-700',
  III: 'bg-amber-100 text-amber-700',
  IV: 'bg-orange-100 text-orange-700',
  V: 'bg-red-100 text-red-700',
}

const fmt = (n) => `${Math.round(n ?? 0).toLocaleString('fr-CM')} XAF`

function matchTone(score) {
  if (score >= 85) return { label: 'Excellent', classes: 'bg-emerald-100 text-emerald-700' }
  if (score >= 70) return { label: 'Bon', classes: 'bg-blue-100 text-blue-700' }
  if (score >= 50) return { label: 'Moyen', classes: 'bg-amber-100 text-amber-700' }
  return { label: 'Faible', classes: 'bg-red-100 text-red-700' }
}

function PropertyThumb({ zone, imageUrl, title }) {
  const zoneBadge = zone && (
    <span className={`absolute top-2 left-2 px-2 py-1 rounded-md text-[10px] font-semibold ${ZONE_COLORS[zone] || 'bg-slate-100 text-slate-600'}`}>
      Zone {zone}
    </span>
  )

  if (imageUrl) {
    return (
      <div className="relative h-36 rounded-t-xl overflow-hidden bg-slate-200">
        <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
        {zoneBadge}
      </div>
    )
  }

  return (
    <div className="relative h-36 rounded-t-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center overflow-hidden">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.85">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
      {zoneBadge}
    </div>
  )
}

export default function PropertyCard({ property, maxSustainableRent, matchReasons }) {
  const tone = matchTone(property.matchScore)
  const withinBudget = maxSustainableRent == null || property.rentMonthly <= maxSustainableRent

  return (
    <Link
      to={`/property/${property.id}`}
      className="block bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow no-underline"
    >
      <PropertyThumb zone={property.zone} imageUrl={property.primaryImage} title={property.title} />

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="text-sm font-bold text-slate-900 leading-snug">{property.title}</h3>
          {property.matchScore != null && (
            <span className={`flex-shrink-0 px-2 py-1 rounded-full text-[11px] font-bold ${tone.classes}`}>
              {property.matchScore}% · {tone.label}
            </span>
          )}
        </div>

        <p className="text-xs text-slate-500 mb-3">
          {UNIT_TYPE_LABELS[property.unitType] || property.unitType} · {property.neighbourhood}, {property.city}
        </p>

        <div className="flex items-end justify-between mb-3">
          <div>
            <span className="text-xl font-extrabold text-slate-900">{fmt(property.rentMonthly)}</span>
            <span className="text-xs text-slate-400"> /mois</span>
          </div>
          {!withinBudget && (
            <span className="text-[11px] font-semibold text-amber-600">Au-dessus du budget</span>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {property.advanceMonths != null && (
            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[11px]">
              Avance {property.advanceMonths} mois
            </span>
          )}
          {property.hasGenerator && (
            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[11px]">⚡ Générateur</span>
          )}
          {property.hasParking && (
            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[11px]">🚗 Parking</span>
          )}
          {property.hasSharedWC && (
            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[11px]">WC partagé</span>
          )}
          {property.landlordReputation >= 7 && (
            <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-[11px] font-medium">★ Hôte bien noté</span>
          )}
        </div>

        {matchReasons && matchReasons.length > 0 && (
          <ul className="mb-3 space-y-1">
            {matchReasons.slice(0, 3).map((reason, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                <span className="text-blue-500 mt-0.5">•</span>
                {reason}
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className="text-[11px] text-slate-400">{property.landlordName}</span>
          <span className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-md">
            Voir le logement
          </span>
        </div>
      </div>
    </Link>
  )
}