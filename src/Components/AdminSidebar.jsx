import React from 'react'
import { useAuth } from '../Context/AuthContext'
import { useNavigate } from 'react-router-dom'

const AdminSidebar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/sign-in', { replace: true })
  }

  const firstName = user?.firstName || 'Admin'
  const lastName = user?.lastName || ''

  return (
    <aside className="w-64 h-screen bg-slate-900 text-white flex flex-col p-6 select-none shadow-sm">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-10 pl-1">
        <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <span className="text-lg font-bold tracking-tight">
          Oli<span className="text-blue-400">stay</span>{' '}
          <span className="font-medium text-slate-400 text-sm">Admin</span>
        </span>
      </div>

      <div className="flex-grow">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3 pl-1">
          Panneau d'administration
        </p>
        <div className="px-4 py-3 rounded-xl bg-slate-800 text-sm text-slate-300 leading-relaxed">
          Modération des annonces, gestion des utilisateurs et des bailleurs, en un seul endroit.
        </div>
      </div>

      {/* User + logout */}
      <div className="border-t border-slate-800 pt-5 mt-auto">
        <div className="flex items-center gap-3 p-2 mb-2">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-lg font-semibold flex-shrink-0">
            {firstName.charAt(0)}
          </div>
          <span className="text-sm font-medium truncate">{`${firstName} ${lastName}`}</span>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-slate-800 hover:bg-red-600 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Déconnexion
        </button>
      </div>
    </aside>
  )
}

export default AdminSidebar