import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './components/AuthContext'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import OrgPage from './pages/OrgPage'
import GrafoPage from './pages/GrafoPage'
import AccesosPage from './pages/AccesosPage'
import PermisosPage from './pages/PermisosPage'
import PlanesAccesoPage from './pages/PlanesAccesoPage'
import ClientesPage from './pages/ClientesPage'
import BusquedaPage from './pages/BusquedaPage'
import AuditPage from './pages/AuditPage'
import ProfilePage from './pages/ProfilePage'
import { ReactNode } from 'react'

function PrivateRoute({ children }: { children: ReactNode }) {
  const { token, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ color: 'var(--vp-text-muted)' }}>AUTENTICANDO...</div>
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

function AdminRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user?.role === 'admin' || user?.role === 'superadmin' ? <>{children}</> : <Navigate to="/home" replace />
}

function SuperAdminRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user?.role === 'superadmin' ? <>{children}</> : <Navigate to="/home" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/perfil" element={<ProfilePage />} />
            <Route path="/organigrama" element={<AdminRoute><OrgPage /></AdminRoute>} />
            <Route path="/grafo" element={<AdminRoute><GrafoPage /></AdminRoute>} />
            <Route path="/accesos" element={<AdminRoute><AccesosPage /></AdminRoute>} />
            <Route path="/permisos" element={<AdminRoute><PermisosPage /></AdminRoute>} />
            <Route path="/planes-acceso" element={<AdminRoute><PlanesAccesoPage /></AdminRoute>} />
            <Route path="/usuarios" element={<AdminRoute><ClientesPage /></AdminRoute>} />
            <Route path="/busqueda" element={<AdminRoute><BusquedaPage /></AdminRoute>} />
            <Route path="/auditoria" element={<AdminRoute><AuditPage /></AdminRoute>} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
