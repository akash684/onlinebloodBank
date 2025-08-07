import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { Header } from './components/layout/Header'
import { Footer } from './components/layout/Footer'
import { PageLoader } from './components/ui/LoadingSpinner'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { DashboardPage } from './pages/DashboardPage'
import { SchedulePage } from './pages/SchedulePage'
import { HistoryPage } from './pages/HistoryPage'
import { SearchPage } from './pages/SearchPage'
import { AboutPage } from './pages/AboutPage'
import { ContactPage } from './pages/ContactPage'
import { AuthTest } from './components/debug/AuthTest'
import toast from 'react-hot-toast'

// ================= Protected Route =================
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return <PageLoader />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!profile) {
    toast.error("Profile not found")
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

// ================= Public Route =================
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <PageLoader />
  }

  return !user ? <>{children}</> : <Navigate to="/dashboard" replace />
}

// ================= Main App Content (Move this ABOVE App) =================
function AppContent() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/debug" element={<AuthTest />} />
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/schedule" element={<ProtectedRoute><SchedulePage /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <Toaster 
        position="top-right" 
        toastOptions={{ 
          duration: 4000, 
          style: { 
            background: 'var(--toast-bg)', 
            color: 'var(--toast-color)' 
          } 
        }} 
      />
    </div>
  )
}

// ================= App Wrapper =================
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppContent /> {/* <-- This was calling before AppContent is defined */}
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
