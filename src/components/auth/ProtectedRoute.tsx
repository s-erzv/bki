import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore, metadataRole } from '@/stores/authStore'
import { onboardingPath } from '@/hooks/useAuth'
import type { UserRole } from '@/types/database'

interface ProtectedRouteProps {
  children: React.ReactNode
  roles?: UserRole[]
  /** If true, this is an onboarding route — allow access even when not onboarded. */
  allowUnboarded?: boolean
}

export function ProtectedRoute({ children, roles, allowUnboarded = false }: ProtectedRouteProps) {
  const { session, profile, onboarded, loading, sessionRestored, user } = useAuthStore()
  const location = useLocation()

  if (loading || !sessionRestored) return <FullPageSpinner />

  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />

  // Identify role: profile.role first, else metadata (right after signup before profile row exists).
  const role: UserRole | null = profile?.role ?? metadataRole(user)

  if (!role) {
    // Logged in but no role anywhere — something is broken. Push to landing.
    return <Navigate to="/" replace />
  }

  // Wrong role for this route.
  if (roles && !roles.includes(role)) {
    return <Navigate to="/unauthorized" replace />
  }

  // Onboarding gate: if role-row missing and this isn't an onboarding route, redirect.
  if (!onboarded && !allowUnboarded) {
    const onb = onboardingPath(role)
    if (onb) return <Navigate to={onb} replace />
  }

  return <>{children}</>
}

function FullPageSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
    </div>
  )
}
