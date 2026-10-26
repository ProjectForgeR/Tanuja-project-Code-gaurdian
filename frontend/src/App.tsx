import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/features/auth/AuthContext'
import { ThemeProvider } from '@/features/theme/ThemeContext'
import { LandingPage } from '@/pages/LandingPage'
import { WorkspacePage } from '@/pages/WorkspacePage'
import { DashboardPage } from '@/pages/DashboardPage'
import { HistoryPage } from '@/pages/HistoryPage'
import { VulnerabilitiesPage } from '@/pages/VulnerabilitiesPage'
import { TestGeneratorPage } from '@/pages/TestGeneratorPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { PrivacyPolicyPage } from '@/pages/PrivacyPolicyPage'
import { SecurityPracticesPage } from '@/pages/SecurityPracticesPage'
import { ApiDocsPage } from '@/pages/ApiDocsPage'
import { SignInPage } from '@/pages/SignInPage'
import { SignUpPage } from '@/pages/SignUpPage'
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage'
import { ScrollToTop } from '@/components/layout/ScrollToTop'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'

interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-xs font-medium">Verifying security credentials...</p>
        </div>
      </div>
    )
  }
  return isAuthenticated ? <>{children}</> : <Navigate to="/signin" replace />
}

const AnimatedRoutes: React.FC = () => {
  const location = useLocation()

  return (
    <div key={location.pathname} className="page-transition min-h-screen w-full flex flex-col">
      <Routes location={location}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/workspace" element={<WorkspacePage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <HistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vulnerabilities"
          element={
            <ProtectedRoute>
              <VulnerabilitiesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/test-generator"
          element={
            <ProtectedRoute>
              <TestGeneratorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/docs" element={<Navigate to="/" replace />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/security" element={<SecurityPracticesPage />} />
        <Route path="/api-docs" element={<ApiDocsPage />} />
        <Route path="/api-documentation" element={<Navigate to="/api-docs" replace />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <ErrorBoundary
            fallbackTitle="Application Workspace Notice"
            fallbackMessage="An unexpected runtime issue occurred. Click below to restore the application view."
            onReset={() => window.location.reload()}
          >
            <AnimatedRoutes />
          </ErrorBoundary>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
