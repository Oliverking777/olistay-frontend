import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  getMyAppointmentsAsHost,
  confirmAppointment,
  cancelAppointmentAsHost,
} from '../api/AppointmentApi'

// ---------------------------------------------------------------------------
// Static lookups — mirror AppointmentStatus enum exactly
// ---------------------------------------------------------------------------

const STATUS_META = {
  PENDING: {
    label: 'Pending',
    classes: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-500',
  },
  CONFIRMED: {
    label: 'Confirmed',
    classes: 'bg-emerald-100 text-emerald-700',
    dot: 'bg-emerald-500',
  },
  CANCELLED: {
    label: 'Cancelled',
    classes: 'bg-slate-200 text-slate-500',
    dot: 'bg-slate-400',
  },
}

const TABS = ['ALL', 'PENDING', 'CONFIRMED', 'CANCELLED']

const TAB_LABELS = {
  ALL: 'All',
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  CANCELLED: 'Cancelled',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatTime(timeStr) {
  if (!timeStr) return null
  // timeStr comes as "HH:MM:SS" or "HH:MM" from the backend
  const [h, m] = timeStr.split(':')
  const hour = parseInt(h, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 || 12
  return `${h12}:${m} ${ampm}`
}

function getInitials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

// ---------------------------------------------------------------------------
// Cancellation reason modal
// ---------------------------------------------------------------------------

function CancelModal({ appointment, onConfirm, onClose, isCancelling }) {
  const [reason, setReason] = useState('')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-bold text-slate-900 mb-1">Cancel this appointment?</h3>
        <p className="text-sm text-slate-500 mb-4">
          This will notify the tenant. You can optionally explain why.
        </p>

        <div className="mb-4">
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            Reason <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="e.g. Property is no longer available on this date…"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={isCancelling}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Keep appointment
          </button>
          <button
            onClick={() => onConfirm(reason.trim() || null)}
            disabled={isCancelling}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {isCancelling ? 'Cancelling…' : 'Yes, cancel'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Single appointment card
// ---------------------------------------------------------------------------

function AppointmentCard({ appointment, onConfirm, onCancel, pendingAction }) {
  const meta = STATUS_META[appointment.status] || STATUS_META.PENDING
  const isConfirming = pendingAction === 'confirm'
  const isCancelling = pendingAction === 'cancel'
  const isBusy = isConfirming || isCancelling

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">

        {/* Tenant avatar */}
        <div className="flex-shrink-0 w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
          {getInitials(appointment.tenantName)}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Top row — name + status */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              <p className="text-sm font-bold text-slate-900">{appointment.tenantName}</p>
              <p className="text-xs text-slate-500">{appointment.tenantEmail}</p>
            </div>
            <span className={`flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${meta.classes}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
              {meta.label}
            </span>
          </div>

          {/* Property link */}
          <Link
            to={`/property/${appointment.propertyId}`}
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium mt-1 mb-3 no-underline"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            {appointment.propertyTitle}
          </Link>

          {/* Date / time chips */}
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {formatDate(appointment.scheduledDate)}
            </span>
            {appointment.scheduledTime && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {formatTime(appointment.scheduledTime)}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 text-slate-400 rounded-md text-[11px]">
              Requested {new Date(appointment.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </span>
          </div>

          {/* Tenant message */}
          {appointment.message && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 mb-3">
              <p className="text-xs text-slate-400 font-medium mb-0.5">Message from tenant</p>
              <p className="text-sm text-slate-700 leading-relaxed">{appointment.message}</p>
            </div>
          )}

          {/* Cancellation reason */}
          {appointment.status === 'CANCELLED' && appointment.cancellationReason && (
            <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2.5 mb-3">
              <p className="text-xs text-red-400 font-medium mb-0.5">Cancellation reason</p>
              <p className="text-sm text-red-700 leading-relaxed">{appointment.cancellationReason}</p>
            </div>
          )}

          {/* Action buttons — only for actionable statuses */}
          {appointment.status === 'PENDING' && (
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => onConfirm(appointment.id)}
                disabled={isBusy}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                {isConfirming ? (
                  <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                {isConfirming ? 'Confirming…' : 'Confirm visit'}
              </button>
              <button
                onClick={() => onCancel(appointment)}
                disabled={isBusy}
                className="flex items-center gap-1.5 px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60 text-xs font-semibold rounded-lg transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                Decline
              </button>
            </div>
          )}

          {appointment.status === 'CONFIRMED' && (
            <div className="flex gap-2 pt-1">
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Visit confirmed
              </div>
              <button
                onClick={() => onCancel(appointment)}
                disabled={isBusy}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-60 text-xs font-medium rounded-lg transition-colors"
              >
                Cancel visit
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const PAGE_SIZE = 10

const HostAppointments = () => {
  const [activeTab, setActiveTab] = useState('ALL')
  const [appointments, setAppointments] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  // Per-card pending action: { [appointmentId]: 'confirm' | 'cancel' }
  const [pendingActions, setPendingActions] = useState({})
  const [actionError, setActionError] = useState(null)

  // Cancel modal state
  const [cancelTarget, setCancelTarget] = useState(null) // appointment object
  const [isCancellingModal, setIsCancellingModal] = useState(false)

  // Tab counts (loaded once per tab switch, not live-updated on each action)
  const [tabCounts, setTabCounts] = useState({ PENDING: null })

  const loadAppointments = useCallback(async (tab, pageNum) => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const data = await getMyAppointmentsAsHost({
        page: pageNum,
        size: PAGE_SIZE,
        sort: 'createdAt,desc',
      })

      // Filter client-side by tab since the backend returns all statuses
      // from the paginated endpoint. For a larger dataset you'd add a
      // ?status= param to the backend — this is fine for the current load.
      const all = data?.content || []
      const filtered = tab === 'ALL' ? all : all.filter((a) => a.status === tab)

      setAppointments(filtered)
      setTotalPages(data?.totalPages || 0)
      setTotalElements(data?.totalElements || 0)

      // Update pending badge count from live data
      const pendingCount = all.filter((a) => a.status === 'PENDING').length
      setTabCounts((prev) => ({ ...prev, PENDING: pendingCount }))
    } catch (err) {
      setLoadError(err.message || 'Failed to load appointments.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    setPage(0)
    loadAppointments(activeTab, 0)
  }, [activeTab, loadAppointments])

  const handleTabChange = (tab) => {
    if (tab === activeTab) return
    setActiveTab(tab)
    setActionError(null)
  }

  const handleConfirm = async (appointmentId) => {
    setActionError(null)
    setPendingActions((prev) => ({ ...prev, [appointmentId]: 'confirm' }))
    try {
      const updated = await confirmAppointment(appointmentId)
      setAppointments((prev) =>
        prev.map((a) => (a.id === appointmentId ? updated : a))
      )
      // If filtered tab is PENDING, remove the confirmed card from view
      if (activeTab === 'PENDING') {
        setAppointments((prev) => prev.filter((a) => a.id !== appointmentId))
      }
    } catch (err) {
      setActionError(err.message || 'Failed to confirm appointment.')
    } finally {
      setPendingActions((prev) => {
        const next = { ...prev }
        delete next[appointmentId]
        return next
      })
    }
  }

  const handleCancelClick = (appointment) => {
    setCancelTarget(appointment)
  }

  const handleCancelConfirm = async (reason) => {
    if (!cancelTarget) return
    setIsCancellingModal(true)
    setActionError(null)
    setPendingActions((prev) => ({ ...prev, [cancelTarget.id]: 'cancel' }))
    try {
      const updated = await cancelAppointmentAsHost(cancelTarget.id, reason)
      setAppointments((prev) =>
        activeTab === 'CANCELLED'
          ? prev.map((a) => (a.id === cancelTarget.id ? updated : a))
          : prev.filter((a) => a.id !== cancelTarget.id)
      )
      setCancelTarget(null)
    } catch (err) {
      setActionError(err.message || 'Failed to cancel appointment.')
    } finally {
      setIsCancellingModal(false)
      setPendingActions((prev) => {
        const next = { ...prev }
        if (cancelTarget) delete next[cancelTarget.id]
        return next
      })
    }
  }

  const handlePageChange = (newPage) => {
    setPage(newPage)
    loadAppointments(activeTab, newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Visit Requests</h1>
          <p className="text-sm text-slate-500">Manage tenant requests to visit your properties</p>
        </div>
        <Link
          to="/host/properties"
          className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline font-medium no-underline"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          My properties
        </Link>
      </div>

      {/* ── Tab bar ── */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {TAB_LABELS[tab]}
            {tab === 'PENDING' && tabCounts.PENDING != null && tabCounts.PENDING > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 bg-amber-500 text-white text-[10px] font-bold rounded-full">
                {tabCounts.PENDING > 9 ? '9+' : tabCounts.PENDING}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Action error banner ── */}
      {actionError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 font-medium flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {actionError}
        </div>
      )}

      {/* ── Loading ── */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <svg className="animate-spin mb-3" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
          </svg>
          <p className="text-sm">Loading appointments…</p>
        </div>
      )}

      {/* ── Load error ── */}
      {!isLoading && loadError && (
        <div className="text-center py-16 bg-white border border-red-200 rounded-2xl">
          <p className="text-sm text-red-600 font-medium mb-4">{loadError}</p>
          <button
            onClick={() => loadAppointments(activeTab, page)}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Empty state ── */}
      {!isLoading && !loadError && appointments.length === 0 && (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <h2 className="text-base font-bold text-slate-800 mb-1">
            {activeTab === 'ALL'
              ? 'No visit requests yet'
              : `No ${TAB_LABELS[activeTab].toLowerCase()} appointments`}
          </h2>
          <p className="text-sm text-slate-500 max-w-xs mx-auto">
            {activeTab === 'ALL'
              ? 'When tenants request visits for your properties, they will appear here.'
              : `You have no ${TAB_LABELS[activeTab].toLowerCase()} appointments at this time.`}
          </p>
        </div>
      )}

      {/* ── Appointment list ── */}
      {!isLoading && !loadError && appointments.length > 0 && (
        <>
          <div className="space-y-3">
            {appointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                onConfirm={handleConfirm}
                onCancel={handleCancelClick}
                pendingAction={pendingActions[appointment.id]}
              />
            ))}
          </div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
              <p className="text-xs text-slate-500">
                Page {page + 1} of {totalPages} · {totalElements} total
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 0}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ← Previous
                </button>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Cancel modal ── */}
      {cancelTarget && (
        <CancelModal
          appointment={cancelTarget}
          onConfirm={handleCancelConfirm}
          onClose={() => !isCancellingModal && setCancelTarget(null)}
          isCancelling={isCancellingModal}
        />
      )}
    </div>
  )
}

export default HostAppointments