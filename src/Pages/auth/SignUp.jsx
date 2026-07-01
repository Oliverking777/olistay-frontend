import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../Context/AuthContext'

const SignUp = () => {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phoneNumber: '',
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const { firstName, lastName, email, password, phoneNumber } = form

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all required fields.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setError('')
    setIsSubmitting(true)

    try {
      await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        phoneNumber: phoneNumber.trim() || null,
      })
      navigate('/', { replace: true })
    } catch (err) {
      // e.g. "An account with this email already exists" from UserAlreadyExistsException,
      // or a validation message from the @Valid annotations on RegisterRequestDTO.
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex">
      {/* Left — form */}
      <div className="w-full lg:w-[440px] flex flex-col px-10 py-10 flex-shrink-0 overflow-y-auto">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 no-underline mb-10 w-fit">
          <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
            <path d="M3 13.5L14 3L25 13.5" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6 11V23C6 23.55 6.45 24 7 24H11V18H17V24H21C21.55 24 22 23.55 22 23V11" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-xl font-bold text-slate-800">Oli<span className="text-blue-600">stay</span></span>
        </Link>

        <h1 className="text-2xl font-bold text-slate-800 mb-6">Create account</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label htmlFor="firstName" className="block text-sm text-slate-600 mb-1.5">
                First name<span className="text-red-500">*</span>
              </label>
              <input
                id="firstName"
                type="text"
                value={form.firstName}
                onChange={handleChange('firstName')}
                autoComplete="given-name"
                className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="lastName" className="block text-sm text-slate-600 mb-1.5">
                Last name<span className="text-red-500">*</span>
              </label>
              <input
                id="lastName"
                type="text"
                value={form.lastName}
                onChange={handleChange('lastName')}
                autoComplete="family-name"
                className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm text-slate-600 mb-1.5">
              Email Address<span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={handleChange('email')}
              autoComplete="email"
              className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="phoneNumber" className="block text-sm text-slate-600 mb-1.5">
              Phone number
            </label>
            <input
              id="phoneNumber"
              type="tel"
              value={form.phoneNumber}
              onChange={handleChange('phoneNumber')}
              autoComplete="tel"
              placeholder="+237..."
              className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-slate-600 mb-1.5">
              Password<span className="text-red-500">*</span>
            </label>
            <input
              id="password"
              type="password"
              value={form.password}
              onChange={handleChange('password')}
              autoComplete="new-password"
              className={`w-full px-4 py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                error ? 'border-red-400 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
              }`}
            />
            <p className="text-xs text-slate-400 mt-1.5">At least 8 characters.</p>
            {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-blue-400 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {isSubmitting ? 'Creating account…' : 'Continue'}
          </button>
        </form>

        <p className="text-sm text-slate-600 mt-5">
          Have an Olistay account?{' '}
          <Link to="/sign-in" className="text-blue-600 font-semibold hover:underline">
            Sign in
          </Link>
        </p>

        <Link to="/sign-up/landlord" className="text-sm text-blue-600 font-semibold hover:underline mt-2 w-fit">
          I am a landlord
        </Link>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-slate-400 font-medium">OR</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* OAuth — Google only for now; not yet wired up */}
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

      {/* Right — photo */}
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

export default SignUp