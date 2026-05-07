import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../components/AuthContext'
import { login as apiLogin } from '../api/auth'
import { Shield } from 'lucide-react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { token, user } = await apiLogin(username, password)
      login(token, user)
      navigate('/home', { replace: true })
    } catch (err: any) {
      setError(err.message || 'Error de autenticacion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--vp-bg-page)' }}>
      <div className="glass-card p-8 w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ background: 'var(--vp-primary)' }}>
            <Shield className="text-white" size={28} />
          </div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--vp-text-heading)' }}>AtriumPass Lite</h1>
          <p className="text-sm" style={{ color: 'var(--vp-text-muted)' }}>Inicia sesion para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--vp-text-body)' }}>Usuario</label>
            <input
              type="text" value={username} onChange={e => setUsername(e.target.value)}
              className="w-full px-3 py-2 rounded-md border text-sm" autoFocus
              style={{ background: 'var(--vp-bg-card)', borderColor: 'var(--vp-border-card)', color: 'var(--vp-text-heading)' }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--vp-text-body)' }}>Contrasena</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-md border text-sm"
              style={{ background: 'var(--vp-bg-card)', borderColor: 'var(--vp-border-card)', color: 'var(--vp-text-heading)' }}
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit" disabled={loading}
            className="w-full py-2 rounded-md text-white text-sm font-medium"
            style={{ background: loading ? 'var(--vp-gray-400)' : 'var(--vp-primary)' }}
          >
            {loading ? 'Entrando...' : 'Iniciar sesion'}
          </button>
        </form>
      </div>
    </div>
  )
}
