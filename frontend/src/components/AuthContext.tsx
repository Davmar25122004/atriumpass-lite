import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, getMe } from '../api/auth'

interface AuthContextType {
  user: User | null
  token: string | null
  login: (token: string, user: User) => void
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType>(null!)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('atrium_token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) { setLoading(false); return }
    getMe()
      .then(u => { setUser(u); setLoading(false) })
      .catch(() => { localStorage.removeItem('atrium_token'); setToken(null); setUser(null); setLoading(false) })
  }, [token])

  const loginFn = (t: string, u: User) => {
    localStorage.setItem('atrium_token', t)
    setToken(t)
    setUser(u)
  }

  const logout = () => {
    localStorage.removeItem('atrium_token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login: loginFn, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
