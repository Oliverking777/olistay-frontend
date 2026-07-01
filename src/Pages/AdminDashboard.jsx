import React, { useEffect, useState, useCallback } from 'react'
import {
  getPendingListings, approveListing, rejectListing, archiveListing,
  getUsers, lockUser, unlockUser, disableUser, enableUser, revokeAllUserSessions,
  getHosts, demoteHost,
} from '../api/AdminApi'

const fmtXaf = (n) => (n == null ? '—' : `${Math.round(n).toLocaleString('fr-CM')} XAF`)
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('fr-CM', { year: 'numeric', month: 'short', day: 'numeric' }) : '—')

const ROLE_BADGE = {
  GUEST: 'bg-slate-100 text-slate-600',
  HOST: 'bg-blue-100 text-blue-700',
  ADMIN: 'bg-purple-100 text-purple-700',
}

const TABS = [
  { key: 'listings', label: 'Annonces en attente' },
  { key: 'users', label: 'Utilisateurs' },
  { key: 'hosts', label: 'Bailleurs' },
]

// ─────────────────────────────────────────────────────────────────────────
// Shared pagination footer
// ─────────────────────────────────────────────────────────────────────────
function Pager({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        onClick={() => onChange(Math.max(0, page - 1))}
        disabled={page === 0}
        className="px-3 py-1.5 text-xs font-semibold border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-slate-50"
      >
        ← Précédent
      </button>
      <span className="text-xs text-slate-500">
        Page {page + 1} / {totalPages}
      </span>
      <button
        onClick={() => onChange(Math.min(totalPages - 1, page + 1))}
        disabled={page >= totalPages - 1}
        className="px-3 py-1.5 text-xs font-semibold border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-slate-50"
      >
        Suivant →
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Listings moderation tab
// ─────────────────────────────────────────────────────────────────────────
function ListingsTab() {
  const [data, setData] = useState({ content: [], totalPages: 0, number: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pending, setPending] = useState({}) // { [id]: 'approve' | 'reject' | 'archive' }
  const [page, setPage] = useState(0)

  const load = useCallback(async (p = 0) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await getPendingListings({ page: p, size: 10, sort: 'createdAt,desc' })
      setData(res)
      setPage(p)
    } catch (err) {
      setError(err.message || 'Impossible de charger les annonces en attente.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { load(0) }, [load])

  const runAction = async (id, action) => {
    setPending((prev) => ({ ...prev, [id]: action }))
    setError(null)
    try {
      if (action === 'approve') await approveListing(id)
      else if (action === 'archive') await archiveListing(id)
      else if (action === 'reject') {
        const reason = window.prompt('Raison du rejet (optionnel) :', '')
        if (reason === null) return // user cancelled
        await rejectListing(id, reason || null)
      }
      // Any of these moves the listing out of UNDER_REVIEW, so drop it locally.
      setData((prev) => ({ ...prev, content: prev.content.filter((p) => p.id !== id) }))
    } catch (err) {
      setError(err.message || "L'action a échoué.")
    } finally {
      setPending((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    }
  }

  if (isLoading) return <p className="text-sm text-slate-400 py-10 text-center">Chargement…</p>

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 font-medium">
          ⚠️ {error}
        </div>
      )}

      {data.content.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
          <p className="text-sm text-slate-500">Aucune annonce en attente d'approbation.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.content.map((p) => (
            <div key={p.id} className="flex flex-col sm:flex-row gap-4 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="w-full sm:w-28 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-slate-200">
                {p.primaryImageUrl ? (
                  <img src={p.primaryImageUrl} alt={p.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-400 to-slate-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-900 truncate">{p.title}</h3>
                <p className="text-xs text-slate-500 mt-1">{p.neighbourhood}, {p.city}</p>
                <p className="text-sm font-extrabold text-slate-900 mt-1">{fmtXaf(p.rentXaf)}<span className="text-xs text-slate-400 font-normal"> /mois</span></p>
              </div>
              <div className="flex sm:flex-col gap-2 sm:w-36 flex-shrink-0 justify-end sm:justify-center">
                <button
                  onClick={() => runAction(p.id, 'approve')}
                  disabled={!!pending[p.id]}
                  className="flex-1 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50 transition-colors"
                >
                  {pending[p.id] === 'approve' ? '...' : 'Approuver'}
                </button>
                <button
                  onClick={() => runAction(p.id, 'reject')}
                  disabled={!!pending[p.id]}
                  className="flex-1 px-3 py-2 text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 rounded-lg disabled:opacity-50 transition-colors"
                >
                  {pending[p.id] === 'reject' ? '...' : 'Rejeter'}
                </button>
                <button
                  onClick={() => runAction(p.id, 'archive')}
                  disabled={!!pending[p.id]}
                  className="flex-1 px-3 py-2 text-xs font-semibold text-slate-600 border border-gray-200 hover:bg-slate-50 rounded-lg disabled:opacity-50 transition-colors"
                >
                  {pending[p.id] === 'archive' ? '...' : 'Archiver'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pager page={page} totalPages={data.totalPages} onChange={load} />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Users tab
// ─────────────────────────────────────────────────────────────────────────
function UsersTab() {
  const [roleFilter, setRoleFilter] = useState('')
  const [data, setData] = useState({ content: [], totalPages: 0, number: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pending, setPending] = useState({})
  const [page, setPage] = useState(0)

  const load = useCallback(async (p = 0, role = roleFilter) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await getUsers({ role: role || null, page: p, size: 10, sort: 'createdAt,desc' })
      setData(res)
      setPage(p)
    } catch (err) {
      setError(err.message || 'Impossible de charger les utilisateurs.')
    } finally {
      setIsLoading(false)
    }
  }, [roleFilter])

  useEffect(() => { load(0, roleFilter) }, [roleFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  const patchUserLocally = (id, patch) => {
    setData((prev) => ({ ...prev, content: prev.content.map((u) => (u.id === id ? { ...u, ...patch } : u)) }))
  }

  const runAction = async (u, action) => {
    setPending((prev) => ({ ...prev, [u.id]: action }))
    setError(null)
    try {
      if (action === 'lock') patchUserLocally(u.id, await lockUser(u.id))
      else if (action === 'unlock') patchUserLocally(u.id, await unlockUser(u.id))
      else if (action === 'disable') patchUserLocally(u.id, await disableUser(u.id))
      else if (action === 'enable') patchUserLocally(u.id, await enableUser(u.id))
      else if (action === 'revoke') {
        const confirmed = window.confirm(`Révoquer toutes les sessions de ${u.email} ?`)
        if (!confirmed) return
        await revokeAllUserSessions(u.id)
      }
    } catch (err) {
      setError(err.message || "L'action a échoué.")
    } finally {
      setPending((prev) => {
        const next = { ...prev }
        delete next[u.id]
        return next
      })
    }
  }

  if (isLoading) return <p className="text-sm text-slate-400 py-10 text-center">Chargement…</p>

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <label className="text-xs font-semibold text-slate-500">Filtrer par rôle :</label>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option value="">Tous</option>
          <option value="GUEST">GUEST</option>
          <option value="HOST">HOST</option>
          <option value="ADMIN">ADMIN</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 font-medium">
          ⚠️ {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <th className="px-4 py-3">Utilisateur</th>
              <th className="px-4 py-3">Rôle</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Créé le</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.content.map((u) => (
              <tr key={u.id} className="border-t border-gray-100">
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-800">{u.firstName} {u.lastName}</p>
                  <p className="text-xs text-slate-400">{u.email}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${ROLE_BADGE[u.role] || 'bg-slate-100 text-slate-600'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <span className={`text-[11px] font-semibold ${u.enabled ? 'text-emerald-600' : 'text-red-500'}`}>
                      {u.enabled ? 'Actif' : 'Désactivé'}
                    </span>
                    <span className={`text-[11px] font-semibold ${u.accountNonLocked ? 'text-slate-400' : 'text-amber-600'}`}>
                      {u.accountNonLocked ? 'Non verrouillé' : 'Verrouillé'}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">{fmtDate(u.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => runAction(u, u.accountNonLocked ? 'lock' : 'unlock')}
                      disabled={!!pending[u.id] || u.role === 'ADMIN'}
                      title={u.role === 'ADMIN' ? 'Action indisponible sur un compte ADMIN' : ''}
                      className="px-2.5 py-1 text-[11px] font-semibold border border-gray-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors"
                    >
                      {pending[u.id] && ['lock', 'unlock'].includes(pending[u.id]) ? '...' : (u.accountNonLocked ? 'Verrouiller' : 'Déverrouiller')}
                    </button>
                    <button
                      onClick={() => runAction(u, u.enabled ? 'disable' : 'enable')}
                      disabled={!!pending[u.id] || u.role === 'ADMIN'}
                      title={u.role === 'ADMIN' ? 'Action indisponible sur un compte ADMIN' : ''}
                      className="px-2.5 py-1 text-[11px] font-semibold border border-gray-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors"
                    >
                      {pending[u.id] && ['disable', 'enable'].includes(pending[u.id]) ? '...' : (u.enabled ? 'Désactiver' : 'Activer')}
                    </button>
                    <button
                      onClick={() => runAction(u, 'revoke')}
                      disabled={!!pending[u.id]}
                      className="px-2.5 py-1 text-[11px] font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-40 transition-colors"
                    >
                      {pending[u.id] === 'revoke' ? '...' : 'Révoquer sessions'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.content.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-10">Aucun utilisateur trouvé.</p>
        )}
      </div>

      <Pager page={page} totalPages={data.totalPages} onChange={(p) => load(p)} />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Hosts tab
// ─────────────────────────────────────────────────────────────────────────
function HostsTab() {
  const [data, setData] = useState({ content: [], totalPages: 0, number: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pending, setPending] = useState({})
  const [page, setPage] = useState(0)

  const load = useCallback(async (p = 0) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await getHosts({ page: p, size: 10, sort: 'promotedAt,desc' })
      setData(res)
      setPage(p)
    } catch (err) {
      setError(err.message || 'Impossible de charger les bailleurs.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { load(0) }, [load])

  const handleDemote = async (host) => {
    const confirmed = window.confirm(`Rétrograder ${host.hostName} au rôle GUEST ? Toutes ses sessions seront révoquées.`)
    if (!confirmed) return

    setPending((prev) => ({ ...prev, [host.userId]: true }))
    setError(null)
    try {
      await demoteHost(host.userId)
      setData((prev) => ({ ...prev, content: prev.content.filter((h) => h.userId !== host.userId) }))
    } catch (err) {
      setError(err.message || 'La rétrogradation a échoué.')
    } finally {
      setPending((prev) => {
        const next = { ...prev }
        delete next[host.userId]
        return next
      })
    }
  }

  if (isLoading) return <p className="text-sm text-slate-400 py-10 text-center">Chargement…</p>

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 font-medium">
          ⚠️ {error}
        </div>
      )}

      {data.content.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
          <p className="text-sm text-slate-500">Aucun bailleur enregistré.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.content.map((h) => (
            <div key={h.id} className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-900">{h.hostName}</h3>
                <p className="text-xs text-slate-400">{h.email}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
                  <span>CNI : <strong className="text-slate-700">{h.nationalIdNumber}</strong></span>
                  <span>Ville : <strong className="text-slate-700">{h.cityOfOperation}</strong></span>
                  <span>Objectif : <strong className="text-slate-700">{h.intendedPropertyCount} logement(s)</strong></span>
                  <span>Depuis le {fmtDate(h.promotedAt)}</span>
                </div>
              </div>
              <button
                onClick={() => handleDemote(h)}
                disabled={!!pending[h.userId]}
                className="px-4 py-2.5 text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 rounded-xl disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {pending[h.userId] ? '...' : 'Rétrograder en GUEST'}
              </button>
            </div>
          ))}
        </div>
      )}

      <Pager page={page} totalPages={data.totalPages} onChange={load} />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Main dashboard
// ─────────────────────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('listings')

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800">Tableau de bord administrateur</h1>
        <p className="text-sm text-slate-500">Modération des annonces, gestion des utilisateurs et des bailleurs.</p>
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-slate-800 text-slate-800'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'listings' && <ListingsTab />}
      {activeTab === 'users' && <UsersTab />}
      {activeTab === 'hosts' && <HostsTab />}
    </div>
  )
}

export default AdminDashboard