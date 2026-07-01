import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../Context/AuthContext'

const SignIn = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAdminLogin, setIsAdminLogin] = useState(false)

  const { login, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Where each role lands by default after signing in. A HOST goes straight
  // to their listings dashboard (host layout), an ADMIN to the admin panel,
  // and everyone else (GUEST) to the public home.
  const roleHome = (role) => {
    if (role === 'ADMIN') return '/admin'
    if (role === 'HOST') return '/properties'
    return '/'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email.trim() || !password.trim()) {
      setError('Enter your email and password to continue.')
      return
    }

    setError('')
    setIsSubmitting(true)

    try {
      const result = await login({ email: email.trim(), password })
      const role = result?.user?.role ?? result?.role

      if (isAdminLogin && role !== 'ADMIN') {
        // Credentials were valid but this account isn't an admin —
        // don't leave a live session sitting around for the wrong panel.
        if (typeof logout === 'function') {
          await logout()
        }
        setError("Ce compte n'a pas les droits d'administrateur.")
        return
      }

      // Honour an explicit "from" (the user was bounced here from a
      // protected page and should return there); otherwise send them to
      // their role's home dashboard so a HOST lands in the host layout and
      // an ADMIN in the admin panel instead of the public home.
      const destination = location.state?.from || roleHome(role)
      navigate(destination, { replace: true })
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex">
      {/* Left — form */}
      <div className="w-full lg:w-[440px] flex flex-col px-10 py-10 flex-shrink-0">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 no-underline mb-10 w-fit">
          <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
            <path d="M3 13.5L14 3L25 13.5" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6 11V23C6 23.55 6.45 24 7 24H11V18H17V24H21C21.55 24 22 23.55 22 23V11" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-xl font-bold text-slate-800">Oli<span className="text-blue-600">stay</span></span>
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-800">
            {isAdminLogin ? 'Connexion administrateur' : 'Sign in'}
          </h1>
          {isAdminLogin && (
            <span className="px-2.5 py-1 bg-slate-800 text-white text-[11px] font-bold rounded-full uppercase tracking-wide">
              Admin
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="block text-sm text-slate-600 mb-1.5">
              Email Address<span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className={`w-full px-4 py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                error ? 'border-red-400 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
              }`}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-slate-600 mb-1.5">
              Password<span className="text-red-500">*</span>
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className={`w-full px-4 py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                error ? 'border-red-400 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
              }`}
            />
            {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors ${
              isAdminLogin ? 'bg-slate-800 hover:bg-slate-900' : 'bg-blue-400 hover:bg-blue-500'
            }`}
          >
            {isSubmitting
              ? 'Signing in…'
              : isAdminLogin
              ? "Se connecter en tant qu'administrateur"
              : 'Continue'}
          </button>
        </form>

        {/* Admin toggle */}
        <button
          type="button"
          onClick={() => {
            setIsAdminLogin((v) => !v)
            setError('')
          }}
          className={`mt-4 w-full py-2.5 border rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 ${
            isAdminLogin
              ? 'border-slate-800 bg-slate-50 text-slate-800'
              : 'border-gray-300 text-slate-500 hover:bg-slate-50'
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          {isAdminLogin ? 'Retour à la connexion standard' : 'Je suis administrateur'}
        </button>

        <p className="text-sm text-slate-600 mt-5">
          New to Olistay?{' '}
          <Link to="/sign-up" className="text-blue-600 font-semibold hover:underline">
            Create account
          </Link>
        </p>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-slate-400 font-medium">OR</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            disabled
            title="Coming soon"
            className="flex items-center justify-center gap-3 w-full py-3 border border-gray-300 rounded-lg text-sm font-medium text-slate-700 opacity-60 cursor-not-allowed transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </div>

        <p className="text-xs text-slate-400 mt-8">
          By submitting, I accept Olistay's{' '}
          <Link to="/terms" className="text-blue-600 font-semibold hover:underline">terms of use</Link>.
        </p>
      </div>

      <div className="hidden lg:block flex-1 relative">
        <img
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80"
          alt="Family enjoying their rental home"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
    </div>
  )
}

export default SignIn