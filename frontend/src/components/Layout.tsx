import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import {
  Home, Map, Network, Users, CalendarClock, DoorOpen, FileSearch,
  ClipboardList, UserCircle, LogOut, Moon, Sun, ChevronDown, Shield
} from 'lucide-react'

interface NavGroup {
  label: string
  color: string
  icon: React.ElementType
  minRole: string
  items: { to: string; label: string; icon: React.ElementType; minRole?: string }[]
}

const navGroups: NavGroup[] = [
  {
    label: 'Control de Accesos', color: 'var(--vp-mod-presencia)', icon: Map,
    minRole: 'admin',
    items: [
      { to: '/accesos', label: 'Accesos', icon: DoorOpen },
      { to: '/auditoria', label: 'Auditoria', icon: ClipboardList },
    ]
  },
  {
    label: 'Gestion de Personal', color: 'var(--vp-mod-rrhh)', icon: Users,
    minRole: 'admin',
    items: [
      { to: '/usuarios', label: 'Usuarios', icon: Users },
      { to: '/planes-acceso', label: 'Planes de Acceso', icon: CalendarClock },
      { to: '/permisos', label: 'Permisos', icon: Shield },
      { to: '/busqueda', label: 'Busqueda', icon: FileSearch },
    ]
  },
  {
    label: 'Estructura del Sitio', color: 'var(--vp-mod-equipamientos)', icon: Network,
    minRole: 'admin',
    items: [
      { to: '/grafo', label: 'Zonas', icon: Network },
      { to: '/organigrama', label: 'Organigrama', icon: Network },
    ]
  },
]

function hasRole(userRole: string, minRole: string): boolean {
  const levels: Record<string, number> = { usuario: 1, admin: 2, superadmin: 3 }
  return (levels[userRole] || 0) >= (levels[minRole] || 0)
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [dark, setDark] = useState(localStorage.getItem('atrium-theme') === 'dark')
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem('atrium-sidebar-open-groups-v2') || '{}') } catch { return {} }
  })

  const toggleDark = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark-mode', next)
    localStorage.setItem('atrium-theme', next ? 'dark' : 'light')
  }

  const toggleGroup = (label: string) => {
    const next = { ...openGroups, [label]: !openGroups[label] }
    setOpenGroups(next)
    localStorage.setItem('atrium-sidebar-open-groups-v2', JSON.stringify(next))
  }

  const handleLogout = () => { logout(); navigate('/login', { replace: true }) }

  const initials = user?.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--vp-bg-page)' }}>
      {/* Sidebar */}
      <aside className="flex flex-col shrink-0" style={{ width: 'var(--vp-sidebar-width)', background: 'var(--vp-bg-sidebar)', borderRight: '1px solid var(--vp-border-card)' }}>
        <div className="flex items-center gap-2 px-4" style={{ height: 'var(--vp-topbar-height)', borderBottom: '1px solid var(--vp-border-card)' }}>
          <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: 'var(--vp-primary)' }}>
            <Shield size={16} className="text-white" />
          </div>
          <span className="font-semibold text-sm" style={{ color: 'var(--vp-text-heading)' }}>AtriumPass</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {/* Home */}
          <NavLink to="/home" className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded-md text-sm mb-1 ${isActive ? 'font-semibold' : ''}`}
            style={({ isActive }) => ({ background: isActive ? 'var(--vp-sidebar-active)' : 'transparent', color: 'var(--vp-text-body)' })}>
            <Home size={16} /> Inicio
          </NavLink>

          {/* Groups */}
          {navGroups.filter(g => hasRole(user?.role || '', g.minRole)).map(group => (
            <div key={group.label} className="mb-1">
              <button onClick={() => toggleGroup(group.label)}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-xs font-semibold uppercase tracking-wider"
                style={{ color: group.color }}>
                <group.icon size={14} />
                <span className="flex-1 text-left">{group.label}</span>
                <ChevronDown size={12} className={`transition-transform ${openGroups[group.label] ? 'rotate-180' : ''}`} />
              </button>
              {openGroups[group.label] && (
                <div className="ml-2">
                  {group.items.filter(it => !it.minRole || hasRole(user?.role || '', it.minRole)).map(item => (
                    <NavLink key={item.to} to={item.to}
                      className={({ isActive }) => `flex items-center gap-2 px-3 py-1.5 rounded-md text-sm ${isActive ? 'font-semibold' : ''}`}
                      style={({ isActive }) => ({ background: isActive ? 'var(--vp-sidebar-active)' : 'transparent', color: 'var(--vp-text-body)' })}>
                      <item.icon size={14} /> {item.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Logout */}
        <button onClick={handleLogout} className="flex items-center gap-2 px-5 py-3 text-sm" style={{ color: 'var(--vp-text-muted)', borderTop: '1px solid var(--vp-border-card)' }}>
          <LogOut size={16} /> Cerrar sesion
        </button>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between px-6 shrink-0"
          style={{ height: 'var(--vp-topbar-height)', background: 'var(--vp-bg-topbar)', borderBottom: '1px solid var(--vp-border-topbar)' }}>
          <div className="flex items-center gap-3">
            <span className="text-sm" style={{ color: 'var(--vp-text-body)' }}>
              Bienvenido, <strong style={{ color: 'var(--vp-text-heading)' }}>{user?.full_name}</strong>
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--vp-primary-lighter)', color: 'var(--vp-primary)' }}>v1.0</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleDark} className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: 'var(--vp-gray-100)' }}>
              {dark ? <Sun size={16} style={{ color: 'var(--vp-text-body)' }} /> : <Moon size={16} style={{ color: 'var(--vp-text-body)' }} />}
            </button>
            <NavLink to="/perfil" className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, var(--vp-primary), var(--vp-primary-light))' }}>
              {initials}
            </NavLink>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
