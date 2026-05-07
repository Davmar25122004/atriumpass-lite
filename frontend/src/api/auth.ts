import { API_URL, getAuthHeaders } from './client'

export interface User {
  id: string
  username: string
  full_name: string
  role: 'superadmin' | 'admin' | 'usuario'
  pin_code?: string
  person_id?: string
}

export async function login(username: string, password: string): Promise<{ token: string; user: User }> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error de login' }))
    throw new Error(err.error)
  }
  return res.json()
}

export async function getMe(): Promise<User> {
  const res = await fetch(`${API_URL}/auth/me`, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Token invalido')
  return res.json()
}
