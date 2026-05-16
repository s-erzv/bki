import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthListener, useRoleRedirectPath } from '@/hooks/useAuth'
import { useAuthStore } from '@/stores/authStore'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

import { LandingPage } from '@/pages/LandingPage'
import { UnauthorizedPage } from '@/pages/UnauthorizedPage'

import { CoachDashboard } from '@/pages/coach/CoachDashboard'
import { CoachCalendar } from '@/pages/coach/CoachCalendar'
import { CoachClasses } from '@/pages/coach/CoachClasses'
import { CoachTasks } from '@/pages/coach/CoachTasks'
import { CoachSessions } from '@/pages/coach/CoachSessions'
import { SessionReportForm } from '@/pages/coach/SessionReportForm'

import { StudentDashboard } from '@/pages/student/StudentDashboard'
import { StudentCalendar } from '@/pages/student/StudentCalendar'
import { StudentClasses } from '@/pages/student/StudentClasses'
import { StudentTasks } from '@/pages/student/StudentTasks'

import { ParentDashboard } from '@/pages/parent/ParentDashboard'
import { ParentCalendar } from '@/pages/parent/ParentCalendar'
import { ParentReports } from '@/pages/parent/ParentReports'

import { AdminDashboard } from '@/pages/admin/AdminDashboard'

import { StudentOnboarding } from '@/pages/onboarding/StudentOnboarding'
import { ParentOnboarding } from '@/pages/onboarding/ParentOnboarding'
import { CoachOnboarding } from '@/pages/onboarding/CoachOnboarding'

function AuthRedirect() {
  const { profile } = useAuthStore()
  const redirectPath = useRoleRedirectPath(profile?.role)
  return <Navigate to={redirectPath} replace />
}

export default function App() {
  useAuthListener()

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="/auth/callback" element={<AuthRedirect />} />

      <Route path="/onboarding/student" element={<ProtectedRoute roles={['student']}><StudentOnboarding /></ProtectedRoute>} />
      <Route path="/onboarding/parent"  element={<ProtectedRoute roles={['parent']}><ParentOnboarding /></ProtectedRoute>} />
      <Route path="/onboarding/coach"   element={<ProtectedRoute roles={['coach']}><CoachOnboarding /></ProtectedRoute>} />

      <Route path="/coach"          element={<ProtectedRoute roles={['coach']}><CoachDashboard /></ProtectedRoute>} />
      <Route path="/coach/calendar" element={<ProtectedRoute roles={['coach']}><CoachCalendar /></ProtectedRoute>} />
      <Route path="/coach/classes"  element={<ProtectedRoute roles={['coach']}><CoachClasses /></ProtectedRoute>} />
      <Route path="/coach/tasks"    element={<ProtectedRoute roles={['coach']}><CoachTasks /></ProtectedRoute>} />
      <Route path="/coach/sessions" element={<ProtectedRoute roles={['coach']}><CoachSessions /></ProtectedRoute>} />
      <Route path="/coach/report"   element={<ProtectedRoute roles={['coach']}><SessionReportForm /></ProtectedRoute>} />

      <Route path="/student"          element={<ProtectedRoute roles={['student']}><StudentDashboard /></ProtectedRoute>} />
      <Route path="/student/calendar" element={<ProtectedRoute roles={['student']}><StudentCalendar /></ProtectedRoute>} />
      <Route path="/student/classes"  element={<ProtectedRoute roles={['student']}><StudentClasses /></ProtectedRoute>} />
      <Route path="/student/tasks"    element={<ProtectedRoute roles={['student']}><StudentTasks /></ProtectedRoute>} />

      <Route path="/parent"          element={<ProtectedRoute roles={['parent']}><ParentDashboard /></ProtectedRoute>} />
      <Route path="/parent/calendar" element={<ProtectedRoute roles={['parent']}><ParentCalendar /></ProtectedRoute>} />
      <Route path="/parent/reports"  element={<ProtectedRoute roles={['parent']}><ParentReports /></ProtectedRoute>} />

      <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
