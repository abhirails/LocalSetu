import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'

import LoginScreen           from './screens/LoginScreen'
import HomeScreen            from './screens/HomeScreen'
import RightNowScreen        from './screens/RightNowScreen'
import HelpScreen            from './screens/HelpScreen'
import CreatePostScreen      from './screens/CreatePostScreen'
import PostDetailScreen      from './screens/PostDetailScreen'
import ProviderDetailScreen  from './screens/ProviderDetailScreen'
import ProfileScreen         from './screens/ProfileScreen'
import AdminScreen           from './screens/AdminScreen'
import SocietyListScreen     from './screens/SocietyListScreen'
import SocietyDetailScreen   from './screens/SocietyDetailScreen'
import SocietyAdminScreen    from './screens/SocietyAdminScreen'
import BusinessListingsScreen  from './screens/BusinessListingsScreen'
import BusinessDetailScreen    from './screens/BusinessDetailScreen'
import MaintenanceScreen       from './screens/MaintenanceScreen'
import InstallPrompt           from './components/InstallPrompt'

// Loading splash while Supabase session is being restored
function LoadingScreen() {
  return (
    <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center', padding: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>&#x1F3D8;</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--primary)' }}>
          Local<span style={{ color: 'var(--navy)' }}>Setu</span>
        </div>
        <div style={{ marginTop: 16 }}>
          <div className="spinner" />
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 12 }}>
          Connecting to your locality...
        </div>
      </div>
    </div>
  )
}

// Guard: redirect to login if not authenticated
function AuthGuard({ children }) {
  const { state } = useApp()
  if (state.loading) return <LoadingScreen />
  if (!state.currentUser) return <Navigate to="/login" replace />
  return children
}

function AppRoutes() {
  const { state } = useApp()
  if (state.loading) return <LoadingScreen />

  return (
    <div className="app-shell">
      <InstallPrompt />
      <Routes>
        <Route
          path="/login"
          element={state.currentUser ? <Navigate to="/home" replace /> : <LoginScreen />}
        />
        <Route path="/home"          element={<AuthGuard><HomeScreen /></AuthGuard>} />
        <Route path="/right-now"     element={<AuthGuard><RightNowScreen /></AuthGuard>} />
        <Route path="/help"          element={<AuthGuard><HelpScreen /></AuthGuard>} />
        <Route path="/create"        element={<AuthGuard><CreatePostScreen /></AuthGuard>} />
        <Route path="/post/:id"      element={<PostDetailScreen />} />
        <Route path="/provider/:id"  element={<AuthGuard><ProviderDetailScreen /></AuthGuard>} />
        <Route path="/profile"       element={<AuthGuard><ProfileScreen /></AuthGuard>} />
        <Route path="/admin"         element={<AuthGuard><AdminScreen /></AuthGuard>} />
        <Route path="/societies"     element={<AuthGuard><SocietyListScreen /></AuthGuard>} />
        <Route path="/society/:id"   element={<AuthGuard><SocietyDetailScreen /></AuthGuard>} />
        <Route path="/society-admin" element={<AuthGuard><SocietyAdminScreen /></AuthGuard>} />
        <Route path="/businesses"    element={<AuthGuard><BusinessListingsScreen /></AuthGuard>} />
        <Route path="/business/:id"  element={<AuthGuard><BusinessDetailScreen /></AuthGuard>} />
        <Route path="/maintenance"     element={<AuthGuard><MaintenanceScreen /></AuthGuard>} />
        <Route
          path="/"
          element={<Navigate to={state.currentUser ? '/home' : '/login'} replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  )
}
