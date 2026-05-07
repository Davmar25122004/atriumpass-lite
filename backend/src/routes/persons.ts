import { FastifyInstance } from 'fastify'
import { sql } from '../db/client.js'
import { requireAdmin, requireSuperAdmin } from '../utils/auth.js'

export async function personsRoutes(app: FastifyInstance) {

  app.get<{ Querystring: { page?: string; limit?: string; q?: string; path?: string } }>(
    '/', async (req) => {
      const { page = '1', limit = '50', q, path } = req.query
      const offset = (Number(page) - 1) * Number(limit)
      const textFilter = q ? `%${q}%` : '%'
      const pathFilter = path ? `${path}%` : '%'

      const rows = await sql`
        SELECT p.*, ci.name AS node_name
        FROM person p
        LEFT JOIN container_instance ci ON ci.id = p.node_id
        WHERE p.path_id LIKE ${pathFilter}
          AND (p.first_name ILIKE ${textFilter} OR p.last_name ILIKE ${textFilter} OR p.dni ILIKE ${textFilter} OR p.email ILIKE ${textFilter})
        ORDER BY p.last_name, p.first_name
        LIMIT ${Number(limit)} OFFSET ${offset}
      `
      const [total] = await sql`
        SELECT COUNT(*)::int AS count FROM person p
        WHERE p.path_id LIKE ${pathFilter}
          AND (p.first_name ILIKE ${textFilter} OR p.last_name ILIKE ${textFilter} OR p.dni ILIKE ${textFilter} OR p.email ILIKE ${textFilter})
      `
      return { data: rows, total: total.count, page: Number(page), limit: Number(limit) }
    }
  )

  app.get<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const [row] = await sql`
      SELECT p.*, ci.name AS node_name
      FROM person p LEFT JOIN container_instance ci ON ci.id = p.node_id
      WHERE p.id = ${req.params.id}
    `
    if (!row) return reply.code(404).send({ error: 'Persona no encontrada' })
    return row
  })

  app.post<{ Body: { first_name: string; last_name: string; dni?: string; email?: string; phone?: string; node_id?: string; plan_id?: string; hire_date?: string } }>(
    '/', async (req, reply) => {
      await requireAdmin(req, reply)
      const { first_name, last_name, dni, email, phone, node_id, plan_id, hire_date } = req.body
      if (!first_name || !last_name) return reply.code(400).send({ error: 'first_name y last_name son obligatorios' })
      const [created] = await sql`
        INSERT INTO person (first_name, last_name, dni, email, phone, node_id, plan_id, hire_date)
        VALUES (${first_name}, ${last_name}, ${dni ?? null}, ${email ?? null}, ${phone ?? null}, ${node_id ?? null}, ${plan_id ?? null}, ${hire_date ?? null})
        RETURNING *
      `
      return reply.code(201).send(created)
    }
  )

  app.patch<{ Params: { id: string }; Body: Record<string, any> }>(
    '/:id', async (req, reply) => {
      await requireAdmin(req, reply)
      const allowed = ['first_name', 'last_name', 'dni', 'email', 'phone', 'node_id', 'plan_id', 'hire_date', 'photo']
      const fields: Record<string, any> = {}
      for (const k of allowed) { if (req.body[k] !== undefined) fields[k] = req.body[k] }
      if (Object.keys(fields).length === 0) return reply.code(400).send({ error: 'No hay campos para actualizar' })

      const sets = Object.entries(fields).map(([k, v]) => sql`${sql(k)} = ${v}`)
      const [updated] = await sql`
        UPDATE person SET ${sql(fields, ...Object.keys(fields))}, updated_at = NOW()
        WHERE id = ${req.params.id} RETURNING *
      `
      if (!updated) return reply.code(404).send({ error: 'Persona no encontrada' })
      return updated
    }
  )

  app.delete<{ Params: { id: string } }>('/:id', async (req, reply) => {
    await requireSuperAdmin(req, reply)
    const [deleted] = await sql`DELETE FROM person WHERE id = ${req.params.id} RETURNING *`
    if (!deleted) return reply.code(404).send({ error: 'Persona no encontrada' })
    return { message: 'Eliminado correctamente' }
  })
}
