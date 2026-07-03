import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyListings, updatePropertyStatus, deleteProperty } from '../api/PropertyApi'

// ---------------------------------------------------------------------------
// Static lookups
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

// Statuses a host is allowed to switch a listing to themselves via the
// dropdown. UNDER_REVIEW is excluded here since it's a moderation state the
// host can't set directly (handled separately in StatusControl above).
const HOST_SELECTABLE_STATUSES = ['AVAILABLE', 'OCCUPIED', 'ARCHIVED']

const fmtXaf = (n) => (n == null ? '—' : `${Math.round(n).toLocaleString()} XAF`)

// ---------------------------------------------------------------------------
// Row-level status control
// ---------------------------------------------------------------------------

function StatusControl({ property, onStatusChange, isUpdating }) {
  const meta = STATUS_META[property.status] || { label: property.status, classes: 'bg-slate-100 text-slate-600' }

  if (property.status === 'UNDER_REVIEW') {
    return (
      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${meta.classes}`}>
        {meta.label}
      </span>
    )
  }

  return (
    <select
      value={property.status}
      disabled={isUpdating}
      onChange={(e) => onStatusChange(property.id, e.target.value)}
      className={`text-[11px] font-semibold rounded-full px-2.5 py-1 border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-wait ${meta.classes}`}
    >
      {HOST_SELECTABLE_STATUSES.map((s) => (
        <option key={s} value={s}>{STATUS_META[s].label}</option>
      ))}
    </select>
  )
}

// ---------------------------------------------------------------------------
// Row-level card
// ---------------------------------------------------------------------------

function HostPropertyRow({ property, onStatusChange, onDelete, pendingAction }) {
  const isUpdatingStatus = pendingAction === 'status'
  const isDeleting = pendingAction === 'delete'

  return (
    <div className="flex flex-col sm:flex-row gap-4 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      {/* Thumbnail */}
      <div className="w-full sm:w-32 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-slate-200">
        {property.primaryImageUrl ? (
          <img src={property.primaryImageUrl} alt={property.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.85">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-900 truncate">{property.title}</h3>
          <StatusControl property={property} onStatusChange={onStatusChange} isUpdating={isUpdatingStatus} />
        </div>
        <p className="text-xs text-slate-500 mt-1">
          {UNIT_TYPE_LABELS[property.unitType] || property.unitType} · {property.neighbourhood}, {property.city}
        </p>
        <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
          <span>{property.numBedrooms ?? 0} bed</span>
          <span>·</span>
          <span>{property.numBathrooms ?? 0} bath</span>
          {property.areaM2 != null && (
            <>
              <span>·</span>
              <span>{Math.round(property.areaM2)} m²</span>
            </>
          )}
        </div>
        <div className="mt-2">
          <span className="text-base font-extrabold text-slate-900">{fmtXaf(property.rentXaf)}</span>
          <span className="text-xs text-slate-400"> /mois</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex sm:flex-col gap-2 sm:w-32 flex-shrink-0 justify-end sm:justify-center">
        <Link
          to={`/property/${property.id}`}
          className="flex-1 sm:flex-none text-center px-3 py-2 text-xs font-semibold text-slate-600 border border-gray-200 rounded-lg hover:bg-slate-50 no-underline transition-colors"
        >
          View
        </Link>
        <span className="flex-1 sm:flex-none text-center px-3 py-2 text-xs font-semibold text-slate-300 border border-gray-200 rounded-lg cursor-not-allowed">
          Edit
        </span>
        <button
          onClick={() => onDelete(property.id)}
          disabled={isDeleting}
          className="flex-1 sm:flex-none px-3 py-2 text-xs font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-wait"
        >
          {isDeleting ? '...' : 'Delete'}
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const HostProperties = () => {
  const [properties, setProperties] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  // Tracks { [propertyId]: 'status' | 'delete' } for per-row pending actions
  const [pendingActions, setPendingActions] = useState({})
  const [actionError, setActionError] = useState(null)

  const loadListings = async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const data = await getMyListings()
      setProperties(data || [])
    } catch (err) {
      setLoadError(err.message || 'Impossible de charger vos propriétés.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadListings()
  }, [])

  const handleStatusChange = async (id, newStatus) => {
    setActionError(null)
    setPendingActions((prev) => ({ ...prev, [id]: 'status' }))

    // Optimistic update, rolled back on failure.
    const previous = properties
    setProperties((prev) => prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p)))

    try {
      await updatePropertyStatus(id, newStatus)
    } catch (err) {
      setProperties(previous)
      setActionError(err.message || "Impossible de mettre à jour le statut de l'annonce.")
    } finally {
      setPendingActions((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    }
  }

  const handleDelete = async (id) => {
    const confirmed = window.confirm('Supprimer définitivement cette annonce ? Cette action est irréversible.')
    if (!confirmed) return

    setActionError(null)
    setPendingActions((prev) => ({ ...prev, [id]: 'delete' }))

    try {
      await deleteProperty(id)
      setProperties((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      setActionError(err.message || "Impossible de supprimer cette annonce.")
    } finally {
      setPendingActions((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Mes propriétés</h1>
          <p className="text-sm text-slate-500">Gérez vos annonces et suivez leur statut</p>
        </div>
<Link
           to="/properties/new"
           className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors no-underline shadow-sm whitespace-nowrap"
         >
           + New listing
         </Link>
      </div>

      {/* Action error banner (status change / delete failures) */}
      {actionError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 font-medium">
          ⚠️ {actionError}
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
          Chargement de vos propriétés…
        </div>
      )}

      {/* Load error state */}
      {!isLoading && loadError && (
        <div className="text-center py-16 bg-white border border-red-200 rounded-2xl">
          <p className="text-sm text-red-600 font-medium mb-4">{loadError}</p>
          <button
            onClick={loadListings}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !loadError && properties.length === 0 && (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
          <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <h2 className="text-base font-bold text-slate-800 mb-1">Aucune propriété pour l'instant</h2>
          <p className="text-sm text-slate-500 mb-6">Créez votre première annonce pour commencer à recevoir des candidatures.</p>
          <Link
            to="/properties/new"
            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors no-underline shadow-sm"
          >
            Créer une annonce
          </Link>
        </div>
      )}

      {/* List */}
      {!isLoading && !loadError && properties.length > 0 && (
        <div className="space-y-3">
          {properties.map((property) => (
            <HostPropertyRow
              key={property.id}
              property={property}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              pendingAction={pendingActions[property.id]}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default HostProperties