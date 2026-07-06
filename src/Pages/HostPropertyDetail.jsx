import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getPropertyDetails, updatePropertyStatus, deleteProperty } from '../api/PropertyApi'

// ---------------------------------------------------------------------------
// Static lookups (kept in sync with HostProperties.jsx)
// ---------------------------------------------------------------------------

const STATUS_META = {
  UNDER_REVIEW: { label: 'Pending approval', classes: 'bg-amber-100 text-amber-700' },
  AVAILABLE: { label: 'Available', classes: 'bg-emerald-100 text-emerald-700' },
  OCCUPIED: { label: 'Occupied', classes: 'bg-blue-100 text-blue-700' },
  ARCHIVED: { label: 'Archived', classes: 'bg-slate-200 text-slate-600' },
}

const UNIT_TYPE_LABELS = {
  chambre: 'Bedroom',
  T1: 'Studio (T1)',
  T2: 'Apartment T2',
  T3: 'Apartment T3',
  T4: 'Apartment T4',
  T5: 'Apartment T5',
}

// Statuses a host is allowed to switch a listing to themselves.
// UNDER_REVIEW is excluded — it's a moderation state set by admin review.
const HOST_SELECTABLE_STATUSES = ['AVAILABLE', 'OCCUPIED', 'ARCHIVED']

const fmtXaf = (n) => (n == null ? '—' : `${Math.round(n).toLocaleString()} XAF`)

/** Turns an ENUM_STYLE value into "Enum style" for display when there's no
 *  hardcoded label lookup for it (propertyType, infraZone, titleType). */
const humanizeEnum = (value) => {
  if (!value) return '—'
  const words = String(value).split('_').join(' ').toLowerCase()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

const YesNo = ({ value }) => (
  <span className={`inline-flex items-center gap-1 text-xs font-semibold ${value ? 'text-emerald-600' : 'text-slate-400'}`}>
    <span className={`w-1.5 h-1.5 rounded-full ${value ? 'bg-emerald-500' : 'bg-slate-300'}`} />
    {value ? 'Oui' : 'Non'}
  </span>
)

// ---------------------------------------------------------------------------
// Small presentational helpers
// ---------------------------------------------------------------------------

function Section({ title, children }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <h2 className="text-sm font-bold text-slate-800 mb-3">{title}</h2>
      {children}
    </div>
  )
}

function FactRow({ label, children }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-b-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-xs font-semibold text-slate-800">{children}</span>
    </div>
  )
}

function StatusControl({ status, onStatusChange, isUpdating }) {
  const meta = STATUS_META[status] || { label: status, classes: 'bg-slate-100 text-slate-600' }

  if (status === 'UNDER_REVIEW') {
    return (
      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${meta.classes}`}>
        {meta.label}
      </span>
    )
  }

  return (
    <select
      value={status}
      disabled={isUpdating}
      onChange={(e) => onStatusChange(e.target.value)}
      className={`text-xs font-semibold rounded-full px-3 py-1.5 border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-wait ${meta.classes}`}
    >
      {HOST_SELECTABLE_STATUSES.map((s) => (
        <option key={s} value={s}>{STATUS_META[s].label}</option>
      ))}
    </select>
  )
}

// ---------------------------------------------------------------------------
// Image gallery
// ---------------------------------------------------------------------------

function ImageGallery({ images, title }) {
  const [activeIndex, setActiveIndex] = useState(0)

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-64 sm:h-80 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.85">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      </div>
    )
  }

  const active = images[activeIndex] || images[0]

  return (
    <div>
      <div className="w-full h-64 sm:h-80 rounded-xl overflow-hidden bg-slate-200">
        <img src={active.imageUrl} alt={title} className="w-full h-full object-cover" />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.id ?? i}
              onClick={() => setActiveIndex(i)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                i === activeIndex ? 'border-blue-500' : 'border-transparent'
              }`}
            >
              <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const HostPropertyDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [property, setProperty] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [actionError, setActionError] = useState(null)

  const loadProperty = async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const data = await getPropertyDetails(id)
      setProperty(data)
    } catch (err) {
      setLoadError(err.message || "Impossible de charger cette propriété.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProperty()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleStatusChange = async (newStatus) => {
    setActionError(null)
    setIsUpdatingStatus(true)
    const previousStatus = property.status
    setProperty((prev) => ({ ...prev, status: newStatus }))

    try {
      const updated = await updatePropertyStatus(id, newStatus)
      setProperty(updated)
    } catch (err) {
      setProperty((prev) => ({ ...prev, status: previousStatus }))
      setActionError(err.message || "Impossible de mettre à jour le statut de l'annonce.")
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleDelete = async () => {
    const confirmed = window.confirm('Supprimer définitivement cette annonce ? Cette action est irréversible.')
    if (!confirmed) return

    setActionError(null)
    setIsDeleting(true)
    try {
      await deleteProperty(id)
      navigate('/properties', { replace: true })
    } catch (err) {
      setActionError(err.message || "Impossible de supprimer cette annonce.")
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8">
        <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
          Chargement de la propriété…
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8">
        <div className="text-center py-16 bg-white border border-red-200 rounded-2xl">
          <p className="text-sm text-red-600 font-medium mb-4">{loadError}</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={loadProperty}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Réessayer
            </button>
            <Link
              to="/properties"
              className="px-5 py-2.5 border border-gray-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 no-underline transition-colors"
            >
              Retour aux annonces
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!property) return null

  const hasCommercialFeatures =
    property.roadFrontageM > 0 ||
    property.shopfrontQuality > 0 ||
    property.loadingBay ||
    property.standbyPowerKva > 0

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8">
      {/* Back link */}
      <Link
        to="/properties"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 no-underline mb-4"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Mes propriétés
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{property.title}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {UNIT_TYPE_LABELS[property.unitType] || property.unitType} · {property.neighbourhood}, {property.city}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusControl
            status={property.status}
            onStatusChange={handleStatusChange}
            isUpdating={isUpdatingStatus}
          />
          <span className="px-3 py-1.5 text-xs font-semibold text-slate-300 border border-gray-200 rounded-lg cursor-not-allowed">
            Edit
          </span>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-wait"
          >
            {isDeleting ? '...' : 'Supprimer'}
          </button>
        </div>
      </div>

      {/* Action error banner */}
      {actionError && (
        <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 font-medium">
          ⚠️ {actionError}
        </div>
      )}

      {/* Gallery */}
      <div className="mb-6">
        <ImageGallery images={property.images} title={property.title} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-5">
          {property.description && (
            <Section title="Description">
              <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                {property.description}
              </p>
            </Section>
          )}

          <Section title="Détails du bien">
            <div className="grid grid-cols-2 gap-x-4">
              <FactRow label="Type">{humanizeEnum(property.propertyType)}</FactRow>
              <FactRow label="Type d'unité">{UNIT_TYPE_LABELS[property.unitType] || property.unitType}</FactRow>
              <FactRow label="Chambres">{property.numBedrooms ?? 0}</FactRow>
              <FactRow label="Salles de bain">{property.numBathrooms ?? 0}</FactRow>
              <FactRow label="Étage">{property.floorLevel ?? 0}</FactRow>
              <FactRow label="WC partagé"><YesNo value={property.sharedWc} /></FactRow>
              <FactRow label="Surface">{property.areaM2 != null ? `${Math.round(property.areaM2)} m²` : '—'}</FactRow>
              <FactRow label="Dimensions">
                {property.lengthM != null && property.widthM != null
                  ? `${property.lengthM} × ${property.widthM} m`
                  : '—'}
              </FactRow>
            </div>
          </Section>

          <Section title="Équipements">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2">
              <FactRow label="Parking"><YesNo value={property.hasParking} /></FactRow>
              <FactRow label="Groupe électrogène"><YesNo value={property.hasGenerator} /></FactRow>
              <FactRow label="Compteur d'eau"><YesNo value={property.hasWaterMeter} /></FactRow>
              <FactRow label="Internet fibre"><YesNo value={property.fiberInternet} /></FactRow>
              <FactRow label="Portail sécurisé"><YesNo value={property.securityGate} /></FactRow>
              <FactRow label="Gardien"><YesNo value={property.hasGardien} /></FactRow>
            </div>
          </Section>

          <Section title="À proximité">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2">
              <FactRow label="École"><YesNo value={property.nearSchool} /></FactRow>
              <FactRow label="Marché"><YesNo value={property.nearMarket} /></FactRow>
              <FactRow label="Hôpital"><YesNo value={property.nearHospital} /></FactRow>
              <FactRow label="Grand axe"><YesNo value={property.nearHighway} /></FactRow>
              <FactRow label="Université"><YesNo value={property.nearUniversity} /></FactRow>
            </div>
          </Section>

          {hasCommercialFeatures && (
            <Section title="Caractéristiques commerciales">
              <div className="grid grid-cols-2 gap-x-4">
                <FactRow label="Façade sur route">{property.roadFrontageM ? `${property.roadFrontageM} m` : '—'}</FactRow>
                <FactRow label="Qualité vitrine">{property.shopfrontQuality ?? 0}/5</FactRow>
                <FactRow label="Quai de chargement"><YesNo value={property.loadingBay} /></FactRow>
                <FactRow label="Alimentation de secours">{property.standbyPowerKva ? `${property.standbyPowerKva} kVA` : '—'}</FactRow>
              </div>
            </Section>
          )}

          <Section title="Qualité, âge et risques">
            <div className="grid grid-cols-2 gap-x-4">
              <FactRow label="Qualité structurelle">{property.structuralQuality ?? 5}/10</FactRow>
              <FactRow label="État général">{property.conditionScore ?? 5}/10</FactRow>
              <FactRow label="Année de construction">{property.buildYear ?? '—'}</FactRow>
              <FactRow label="Risque d'inondation"><YesNo value={property.floodRisk} /></FactRow>
              <FactRow label="Niveau de bruit">{property.noiseLevel ?? 5}/10</FactRow>
            </div>
          </Section>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <Section title="Loyer">
            <div className="text-2xl font-extrabold text-slate-900">{fmtXaf(property.rentXaf)}</div>
            <div className="text-xs text-slate-400 mb-3">/mois</div>
            <div className="pt-2 border-t border-gray-100">
              <FactRow label="Avance">{property.advanceMonths ?? 3} mois</FactRow>
              <FactRow label="Caution">{property.cautionMonths ?? 1} mois</FactRow>
              <FactRow label="Titre">{humanizeEnum(property.titleType)}</FactRow>
            </div>
          </Section>

          <Section title="Localisation">
            <FactRow label="Quartier">{property.neighbourhood}</FactRow>
            <FactRow label="Ville">{property.city}</FactRow>
            <FactRow label="Zone d'infrastructure">{humanizeEnum(property.infraZone)}</FactRow>
            {property.gpsLat != null && property.gpsLon != null && (
              <FactRow label="Coordonnées GPS">
                {property.gpsLat.toFixed(4)}, {property.gpsLon.toFixed(4)}
              </FactRow>
            )}
          </Section>

          <Section title="Scores">
            <FactRow label="Réputation propriétaire">{property.landlordReputation ?? 5}/10</FactRow>
            <FactRow label="Sécurité du bail">{property.leaseSecurity ?? 5}/10</FactRow>
            <FactRow label="Score de transport">{property.transportScore ?? 5}/10</FactRow>
          </Section>

          {property.createdAt && (
            <Section title="Historique">
              <FactRow label="Créée le">{new Date(property.createdAt).toLocaleDateString('fr-FR')}</FactRow>
              {property.updatedAt && (
                <FactRow label="Mise à jour">{new Date(property.updatedAt).toLocaleDateString('fr-FR')}</FactRow>
              )}
            </Section>
          )}
        </div>
      </div>
    </div>
  )
}

export default HostPropertyDetail