import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../Context/AuthContext'

const NavBar = () => {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  const handleSignOut = async () => {
    setMenuOpen(false)
    try {
      await logout()
    } finally {
      navigate('/')
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* Left — intentionally empty */}
        <div className="flex-1" />

        {/* Center — Brand */}
        <Link
          to="/"
          className="flex items-center gap-2 no-underline select-none"
        >
          {/* House icon */}
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M3 13.5L14 3L25 13.5"
              stroke="#2563EB"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M6 11V23C6 23.5523 6.44772 24 7 24H11V18H17V24H21C21.5523 24 22 23.5523 22 23V11"
              stroke="#2563EB"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-2xl font-bold tracking-tight text-slate-800">
            Oli<span className="text-blue-600">stay</span>
          </span>
        </Link>

        {/* Right — Actions */}
        <div className="flex-1 flex items-center justify-end gap-2">
          {/* Become a Landlord — only for authenticated GUEST (tenant) users.
              Hidden when logged out, and hidden once the user is already a HOST. */}
          {user?.role === 'GUEST' && (
            <Link
              to="/become-a-landlord"
              className="hidden sm:inline-flex items-center text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors duration-150 px-3 py-2 rounded-md hover:bg-blue-50 no-underline whitespace-nowrap"
            >
              Become a Landlord
            </Link>
          )}

          {/* Sign In / Profile */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                aria-label="Profile menu"
              >
                {user.firstName ? user.firstName.charAt(0).toUpperCase() : 'U'}
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                  <div className="py-1">
                    <Link
                      to="/my-favourites"
                      className="block px-5 py-3 text-[15px] font-semibold text-slate-800 hover:bg-gray-50 no-underline"
                      onClick={() => setMenuOpen(false)}
                    >
                      Favourites
                    </Link>
                  </div>

                  <hr className="border-gray-200" />

                  <div className="py-1">
                    <Link
                      to="/profile"
                      className="block px-5 py-3 text-[15px] font-semibold text-slate-800 hover:bg-gray-50 no-underline"
                      onClick={() => setMenuOpen(false)}
                    >
                      Account settings
                    </Link>
                  </div>

                  <hr className="border-gray-200" />

                  <div className="py-1">
                    <button
                      className="w-full text-left px-5 py-3 text-[15px] font-semibold text-slate-800 hover:bg-gray-50"
                      onClick={handleSignOut}
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/sign-in"
              className="inline-flex items-center justify-center px-5 py-2 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors duration-150 no-underline shadow-sm"
            >
              Sign in
            </Link>
          )}
        </div>

      </div>
    </header>
  )
}

export default NavBar