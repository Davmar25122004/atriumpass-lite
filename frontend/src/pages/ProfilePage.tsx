import { useAuth } from '../components/AuthContext'
import { User, Key, Shield } from 'lucide-react'

export default function ProfilePage() {
  const { user } = useAuth()
  if (!user) return null

  const initials = user.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'

  return (
    <div className="max-w-lg">
      <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--vp-text-heading)' }}>Mi Perfil</h2>
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold"
            style={{ background: 'linear-gradient(135deg, var(--vp-primary), var(--vp-primary-light))' }}>
            {initials}
          </div>
          <div>
            <p className="text-lg font-semibold" style={{ color: 'var(--vp-text-heading)' }}>{user.full_name}</p>
            <p className="text-sm" style={{ color: 'var(--vp-text-muted)' }}>@{user.username}</p>
          </div>
        </div>
        <div className="space-y-3 pt-4" style={{ borderTop: '1px solid var(--vp-border-divider)' }}>
          <div className="flex items-center gap-3">
            <User size={16} style={{ color: 'var(--vp-text-muted)' }} />
            <span className="text-sm" style={{ color: 'var(--vp-text-body)' }}>Nombre: <strong>{user.full_name}</strong></span>
          </div>
          <div className="flex items-center gap-3">
            <Shield size={16} style={{ color: 'var(--vp-text-muted)' }} />
            <span className="text-sm" style={{ color: 'var(--vp-text-body)' }}>Rol: <span className="badge-status in">{user.role}</span></span>
          </div>
          {user.pin_code && (
            <div className="flex items-center gap-3">
              <Key size={16} style={{ color: 'var(--vp-text-muted)' }} />
              <span className="text-sm" style={{ color: 'var(--vp-text-body)' }}>PIN: {user.pin_code}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
