import { FastifyInstance } from 'fastify'
import bcrypt from 'bcrypt'
import { sql } from '../db/client.js'
import { getAuthUser, signToken } from '../utils/auth.js'

export async function authRoutes(app: FastifyInstance) {

  // POST /api/auth/login
  app.post<{ Body: { username: string; password: string } }>('/login', async (req, reply) => {
    const { username, password } = req.body
    if (!username || !password) return reply.code(400).send({ error: 'username y password son obligatorios' })

    const [user] = await sql`SELECT * FROM app_user WHERE username = ${username} AND active = true`
    if (!user) return reply.code(401).send({ error: 'Credenciales invalidas' })

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) return reply.code(401).send({ error: 'Credenciales invalidas' })

    const token = signToken({ id: user.id, username: user.username, role: user.role })
    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        pin_code: user.pin_code,
        person_id: user.person_id,
      }
    }
  })

  // POST /api/auth/register
  app.post<{ Body: { username: string; password: string; full_name: string; role?: string; pin_code?: string } }>(
    '/register', async (req, reply) => {
      const { username, password, full_name, role = 'usuario', pin_code } = req.body
      if (!username || !password || !full_name) return reply.code(400).send({ error: 'username, password y full_name son obligatorios' })

      const [existing] = await sql`SELECT id FROM app_user WHERE username = ${username}`
      if (existing) return reply.code(409).send({ error: 'El usuario ya existe' })

      const password_hash = await bcrypt.hash(password, 10)
      const [user] = await sql`
        INSERT INTO app_user (username, password_hash, full_name, role, pin_code)
        VALUES (${username}, ${password_hash}, ${full_name}, ${role}, ${pin_code ?? null})
        RETURNING id, username, full_name, role, pin_code
      `
      const token = signToken({ id: user.id, username: user.username, role: user.role })
      return reply.code(201).send({ token, user })
    }
  )

  // GET /api/auth/me
  app.get('/me', async (req, reply) => {
    const auth = getAuthUser(req)
    if (!auth) return reply.code(401).send({ error: 'Token invalido o ausente' })

    const [user] = await sql`
      SELECT id, username, full_name, role, pin_code, person_id, active
      FROM app_user WHERE id = ${auth.id}
    `
    if (!user) return reply.code(404).send({ error: 'Usuario no encontrado' })
    return user
  })
}
