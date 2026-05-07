import { FastifyInstance } from 'fastify'
import bcrypt from 'bcrypt'
import { sql } from '../db/client.js'
import { requireAdmin } from '../utils/auth.js'

export async function clientsRoutes(app: FastifyInstance) {

  app.get<{ Querystring: { page?: string; limit?: string; q?: string; path?: string; role?: string } }>(
    '/', async (req) => {
      const { page = '1', limit = '50', q, path, role } = req.query
      const offset = (Number(page) - 1) * Number(limit)
      const textFilter = q ? `%${q}%` : '%'
      const pathFilter = path ? `${path}%` : '%'

      const roleFilter = role === 'sin_cuenta'
        ? sql`AND au.id IS NULL`
        : role ? sql`AND au.role = ${role}` : sql``

      const rows = await sql`
        SELECT p.*, ci.name AS node_name,
          au.id AS user_id, au.username, au.role AS user_role, au.active AS user_active, au.pin_code
        FROM person p
        LEFT JOIN container_instance ci ON ci.id = p.node_id
        LEFT JOIN app_user au ON au.person_id = p.id
        WHERE p.path_id LIKE ${pathFilter}
          AND (p.first_name ILIKE ${textFilter} OR p.last_name ILIKE ${textFilter} OR p.dni ILIKE ${textFilter} OR p.email ILIKE ${textFilter})
          ${roleFilter}
        ORDER BY p.last_name, p.first_name
        LIMIT ${Number(limit)} OFFSET ${offset}
      `
      const [total] = await sql`
        SELECT COUNT(*)::int AS count
        FROM person p
        LEFT JOIN app_user au ON au.person_id = p.id
        WHERE p.path_id LIKE ${pathFilter}
          AND (p.first_name ILIKE ${textFilter} OR p.last_name ILIKE ${textFilter} OR p.dni ILIKE ${textFilter} OR p.email ILIKE ${textFilter})
          ${roleFilter}
      `
      return { data: rows, total: total.count, page: Number(page), limit: Number(limit) }
    }
  )

  app.post<{ Params: { personId: string }; Body: { username: string; password: string; role?: string; pin_code?: string } }>(
    '/:personId/user', async (req, reply) => {
      await requireAdmin(req, reply)
      const { username, password, role = 'usuario', pin_code } = req.body
      const personId = req.params.personId
      if (!username || !password) return reply.code(400).send({ error: 'username y password son obligatorios' })

      const [person] = await sql`SELECT id, first_name, last_name FROM person WHERE id = ${personId}`
      if (!person) return reply.code(404).send({ error: 'Persona no encontrada' })

      const [existing] = await sql`SELECT id FROM app_user WHERE username = ${username}`
      if (existing) return reply.code(409).send({ error: 'Username ya existe' })

      const password_hash = await bcrypt.hash(password, 10)
      const full_name = `${person.first_name} ${person.last_name}`
      const [user] = await sql`
        INSERT INTO app_user (username, password_hash, full_name, role, pin_code, person_id)
        VALUES (${username}, ${password_hash}, ${full_name}, ${role}, ${pin_code ?? null}, ${personId})
        RETURNING id, username, full_name, role, pin_code, person_id
      `
      return reply.code(201).send(user)
    }
  )

  app.patch<{ Params: { personId: string }; Body: { role?: string; password?: string; pin_code?: string; active?: boolean } }>(
    '/:personId/user', async (req, reply) => {
      await requireAdmin(req, reply)
      const { role, password, pin_code, active } = req.body
      const [user] = await sql`SELECT * FROM app_user WHERE person_id = ${req.params.personId}`
      if (!user) return reply.code(404).send({ error: 'Usuario no encontrado para esta persona' })

      const updates: Record<string, any> = {}
      if (role !== undefined) updates.role = role
      if (pin_code !== undefined) updates.pin_code = pin_code
      if (active !== undefined) updates.active = active
      if (password) updates.password_hash = await bcrypt.hash(password, 10)

      if (Object.keys(updates).length === 0) return reply.code(400).send({ error: 'No hay campos' })

      const [updated] = await sql`
        UPDATE app_user SET ${sql(updates, ...Object.keys(updates))}, updated_at = NOW()
        WHERE person_id = ${req.params.personId}
        RETURNING id, username, full_name, role, pin_code, active, person_id
      `
      return updated
    }
  )

  app.delete<{ Params: { personId: string } }>('/:personId/user', async (req, reply) => {
    await requireAdmin(req, reply)
    const [updated] = await sql`
      UPDATE app_user SET active = false, updated_at = NOW()
      WHERE person_id = ${req.params.personId}
      RETURNING id, username, active
    `
    if (!updated) return reply.code(404).send({ error: 'Usuario no encontrado' })
    return { message: 'Usuario desactivado' }
  })
}
