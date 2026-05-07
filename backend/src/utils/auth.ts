import jwt from 'jsonwebtoken'
import { FastifyRequest, FastifyReply } from 'fastify'

const JWT_SECRET = process.env.JWT_SECRET ?? 'atrium-pass-secret-2024'

export interface AuthUser {
  id: string
  username: string
  role: 'superadmin' | 'admin' | 'usuario'
}

export function getAuthUser(req: FastifyRequest): AuthUser | null {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return null
  try {
    const token = header.slice(7)
    const payload = jwt.verify(token, JWT_SECRET) as AuthUser
    return payload
  } catch {
    return null
  }
}

export async function requireAdmin(req: FastifyRequest, reply: FastifyReply) {
  const user = getAuthUser(req)
  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
    reply.code(403).send({ error: 'Se requiere rol admin o superadmin' })
    throw new Error('Forbidden')
  }
  return user
}

export async function requireSuperAdmin(req: FastifyRequest, reply: FastifyReply) {
  const user = getAuthUser(req)
  if (!user || user.role !== 'superadmin') {
    reply.code(403).send({ error: 'Se requiere rol superadmin' })
    throw new Error('Forbidden')
  }
  return user
}

export function signToken(user: { id: string; username: string; role: string }): string {
  return jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' })
}
