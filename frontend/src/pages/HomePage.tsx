import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../api/client'
import { useAuth } from '../components/AuthContext'
import { Activity, ShieldCheck, ShieldX, Users, DoorOpen, Network, ClipboardList, CalendarClock, Search, CheckCircle, XCircle } from 'lucide-react'

interface Stats {
  today: { total: number; granted: number; denied: number }
  last_accesses: { id: string; timestamp: string; granted: boolean; first_name: string; last_name: string; point_name: string; direction: string }[]
  total_persons: number
  total_access_points: number
  total_zones: number
}

function avatarClass(name: string) {
  let hash = 0
  for (const c of name) hash = (hash + c.charCodeAt(0)) % 10
  return `relleno${hash}`
}

export default function HomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    apiFetch<Stats>('/access-logs/stats').then(setStats)
    const interval = setInterval(() => apiFetch<Stats>('/access-logs/stats').then(setStats), 10000)
    return () => clearInterval(interval)
  }, [])

  if (!stats) return <div style={{ color: 'var(--vp-text-muted)' }}>Cargando dashboard...</div>

  const cards = [
    { label: 'Accesos hoy', value: stats.today.total, icon: Activity, color: 'var(--vp-primary)' },
    { label: 'Concedidos', value: stats.today.granted, icon: ShieldCheck, color: 'var(--vp-status-in-border)' },
    { label: 'Denegados', value: stats.today.denied, icon: ShieldX, color: 'var(--vp-status-out-border)' },
    { label: 'Personas', value: stats.total_persons, icon: Users, color: 'var(--vp-mod-rrhh)' },
    { label: 'Puntos acceso', value: stats.total_access_points, icon: DoorOpen, color: 'var(--vp-mod-presencia)' },
    { label: 'Zonas', value: stats.total_zones, icon: Network, color: 'var(--vp-mod-equipamientos)' },
  ]

  const quickLinks = [
    { label: 'Usuarios', to: '/usuarios', icon: Users, color: 'var(--vp-mod-rrhh)' },
    { label: 'Zonas', to: '/grafo', icon: Network, color: 'var(--vp-mod-equipamientos)' },
    { label: 'Accesos', to: '/accesos', icon: DoorOpen, color: 'var(--vp-mod-presencia)' },
    { label: 'Auditoria', to: '/auditoria', icon: ClipboardList, color: 'var(--vp-mod-portal)' },
    { label: 'Planes', to: '/planes-acceso', icon: CalendarClock, color: 'var(--vp-mod-config)' },
    { label: 'Busqueda', to: '/busqueda', icon: Search, color: 'var(--vp-mod-proyectos)' },
  ]

  return (
    <div>
      <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--vp-text-heading)' }}>
        Bienvenido, {user?.full_name}
      </h2>
      <p className="mb-6 text-sm" style={{ color: 'var(--vp-text-muted)' }}>Panel de control del sistema de accesos</p>

      {/* Stats cards */}
      <div className="vp-widget-grid mb-6">
        {cards.map(c => (
          <div key={c.label} className="cardWidget flex items-center gap-4 py-4">
            <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0" style={{ background: c.color + '20' }}>
              <c.icon size={20} style={{ color: c.color }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--vp-text-heading)' }}>{c.value}</p>
              <p className="text-xs" style={{ color: 'var(--vp-text-muted)' }}>{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Last accesses */}
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--vp-text-h3)' }}>Ultimos accesos</h3>
          <div className="space-y-2">
            {stats.last_accesses.length === 0 && <p className="text-sm" style={{ color: 'var(--vp-text-muted)' }}>Sin accesos registrados</p>}
            {stats.last_accesses.slice(0, 5).map(a => {
              const name = `${a.first_name} ${a.last_name}`
              const initials = `${a.first_name?.[0] || ''}${a.last_name?.[0] || ''}`.toUpperCase()
              return (
                <div key={a.id} className="flex items-center gap-3 py-1.5">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${avatarClass(name)}`}>{initials}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate" style={{ color: 'var(--vp-text-heading)' }}>{name}</p>
                    <p className="text-xs" style={{ color: 'var(--vp-text-muted)' }}>{a.point_name} · {a.direction}</p>
                  </div>
                  {a.granted ? (
                    <CheckCircle size={14} style={{ color: 'var(--vp-status-in-border)' }} />
                  ) : (
                    <XCircle size={14} style={{ color: 'var(--vp-status-out-border)' }} />
                  )}
                  <span className="text-xs shrink-0" style={{ color: 'var(--vp-text-muted)' }}>{new Date(a.timestamp).toLocaleTimeString()}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Quick links */}
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--vp-text-h3)' }}>Accesos rapidos</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickLinks.map(link => (
              <button key={link.to} onClick={() => navigate(link.to)}
                className="flex items-center gap-3 p-3 rounded-lg text-left transition-all hover:scale-[1.02]"
                style={{ background: 'var(--vp-gray-50)', border: '1px solid var(--vp-border-card)' }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: link.color + '20' }}>
                  <link.icon size={18} style={{ color: link.color }} />
                </div>
                <span className="text-sm font-medium" style={{ color: 'var(--vp-text-heading)' }}>{link.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
