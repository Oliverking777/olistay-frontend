import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  loginRequest,
  registerRequest,
  refreshRequest,
  logoutRequest,
} from '../api/AuthApi'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  // isLoading covers the brief window on first app load while we try to
  // silently restore a session from the refresh cookie. Consumers (e.g.
  // NavBar, protected routes) should wait for this before deciding what to render.
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const restoreSession = async () => {
      try {
        // No refresh cookie, or an expired one, simply rejects here —
        // that's the normal "not logged in" case, not an error to surface.
        const data = await refreshRequest()
        if (!cancelled) setUser(data.user)
      } catch {
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    restoreSession()
    return () => {
      cancelled = true
    }
  }, [])

  const login = async ({ email, password }) => {
    const data = await loginRequest({ email, password })
    setUser(data.user)
    return data
  }

  const register = async ({ firstName, lastName, email, password, phoneNumber }) => {
    const data = await registerRequest({ firstName, lastName, email, password, phoneNumber })
    setUser(data.user)
    return data
  }

  const logout = async () => {
    try {
      await logoutRequest()
    } finally {
      setUser(null)
    }
  }

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>')
  }
  return ctx
}