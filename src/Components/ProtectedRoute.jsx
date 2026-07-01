import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../Context/AuthContext'

/**
 * Route guard for nested route groups (used as the `element` of a parent
 * <Route>, with the protected pages as its children via <Outlet />).
 *
 * - While the initial session-restore is in flight (AuthContext.isLoading),
 *   renders nothing rather than redirecting — prevents a flash-redirect to
 *   /sign-in on a hard refresh for users who are actually still logged in.
 * - Not authenticated -> redirect to /sign-in, remembering where they were
 *   headed so SignIn can send them back after login.
 * - Authenticated but role not in `allowedRoles` -> redirect to `redirectTo`
 *   (defaults to "/").
 *
 * Usage:
 *   <Route element={<ProtectedRoute allowedRoles={['HOST']} />}>
 *     <Route path="properties" element={<HostProperties />} />
 *   </Route>
 */
const ProtectedRoute = ({ allowedRoles, redirectTo = '/' }) => {
  const { user, isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to={redirectTo} replace />
  }

  return <Outlet />
}

export default ProtectedRoute