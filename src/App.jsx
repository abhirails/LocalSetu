import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import { cx, ui } from './lib/ui'

import LoginScreen             from './screens/LoginScreen'
import HomeScreen              from './screens/HomeScreen'
import RightNowScreen          from './screens/RightNowScreen'
import HelpScreen              from './screens/HelpScreen'
import CreatePostScreen        from './screens/CreatePostScreen'
import PostDetailScreen        from './screens/PostDetailScreen'
import ProviderDetailScreen    from './screens/ProviderDetailScreen'
import ProfileScreen           from './screens/ProfileScreen'
import AdminScreen             from './screens/AdminScreen'
import SocietyListScreen       from './screens/SocietyListScreen'
import SocietyDetailScreen     from './screens/SocietyDetailScreen'
import SocietyAdminScreen      from './screens/SocietyAdminScreen'
import BusinessListingsScreen  from './screens/BusinessListingsScreen'
import BusinessDetailScreen    from './screens/BusinessDetailScreen'
import RegisterBusinessScreen  from './screens/RegisterBusinessScreen'
import RegisterSocietyScreen  from './screens/RegisterSocietyScreen'
import MaintenanceScreen       from './screens/MaintenanceScreen'
import NeedToBuyPublicScreen   from './screens/NeedToBuyPublicScreen'
import InstallPrompt           from './components/InstallPrompt'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('LocalSetu render error:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className={ui.appContainer} style={{ justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: 24 }}>
          <div style={{ textAlign: 'center', maxWidth: 360 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>!</div>
            <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>Something went wrong</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {this.state.error.message || 'The app hit an unexpected error.'}
            </p>
            <button
              className={cx(ui.btn, ui.btnPrimary)}
              style={{ marginTop: 16, width: 'auto' }}
              onClick={() => {
                try { localStorage.removeItem('localsetu_state') } catch {}
                window.location.href = '/login'
              }}
            >
              Reset app data and reload
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function LoadingScreen() {
  return (
    <div className={ui.appContainer} style={{ justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center', padding: 32 }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--primary)' }}>
          LocalSetu
        </div>
        <div style={{ marginTop: 16 }}>
          <div className={ui.spinner} />
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 12 }}>
          Connecting to your locality...
        </div>
      </div>
    </div>
  )
}

function AuthGuard({ children }) {
  const { state } = useApp()
  if (state.loading) return <LoadingScreen />
  if (!state.currentUser) return <Navigate to="/login" replace />
  return children
}

function isPublicNeedToBuyPath(pathname) {
  return pathname === '/need-to-buy' || /^\/[^/]+\/need-to-buy$/.test(pathname)
}

function AppRoutes() {
  const { state } = useApp()
  const location = useLocation()
  const publicNeedToBuy = isPublicNeedToBuyPath(location.pathname)

  if (state.loading && !publicNeedToBuy) return <LoadingScreen />

  return (
    <div className={ui.appShell}>
      <InstallPrompt />
      <Routes>
        <Route path="/login" element={state.currentUser ? <Navigate to="/home" replace /> : <LoginScreen />} />
        <Route path="/home"              element={<AuthGuard><HomeScreen /></AuthGuard>} />
        <Route path="/right-now"         element={<AuthGuard><RightNowScreen /></AuthGuard>} />
        <Route path="/help"              element={<AuthGuard><HelpScreen /></AuthGuard>} />
        <Route path="/create"            element={<AuthGuard><CreatePostScreen /></AuthGuard>} />
        <Route path="/post/:id"          element={<PostDetailScreen />} />
        <Route path="/provider/:id"      element={<AuthGuard><ProviderDetailScreen /></AuthGuard>} />
        <Route path="/profile"           element={<AuthGuard><ProfileScreen /></AuthGuard>} />
        <Route path="/admin"             element={<AuthGuard><AdminScreen /></AuthGuard>} />
        <Route path="/societies"         element={<AuthGuard><SocietyListScreen /></AuthGuard>} />
        <Route path="/society/:id"       element={<AuthGuard><SocietyDetailScreen /></AuthGuard>} />
        <Route path="/society-admin"     element={<AuthGuard><SocietyAdminScreen /></AuthGuard>} />
        <Route path="/businesses"        element={<AuthGuard><BusinessListingsScreen /></AuthGuard>} />
        <Route path="/business/:id"      element={<AuthGuard><BusinessDetailScreen /></AuthGuard>} />
        <Route path="/register-business" element={<AuthGuard><RegisterBusinessScreen /></AuthGuard>} />
        <Route path="/register-society"  element={<AuthGuard><RegisterSocietyScreen /></AuthGuard>} />
        <Route path="/maintenance"       element={<AuthGuard><MaintenanceScreen /></AuthGuard>} />
        {/* Public routes — no login required */}
        <Route path="/need-to-buy"                     element={<NeedToBuyPublicScreen />} />
        <Route path="/:localitySlug/need-to-buy"       element={<NeedToBuyPublicScreen />} />
        <Route path="/" element={<Navigate to={state.currentUser ? '/home' : '/login'} replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </ErrorBoundary>
  )
}
