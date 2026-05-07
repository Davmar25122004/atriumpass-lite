import { FastifyInstance } from 'fastify'
import { sql } from '../db/client.js'
import { requireAdmin, requireSuperAdmin } from '../utils/auth.js'

export async function accessPointsRoutes(app: FastifyInstance) {

  app.get<{ Querystring: { page?: string; limit?: string; q?: string; path?: string; node_id?: string } }>(
    '/', async (req) => {
      const { page = '1', limit = '50', q, path, node_id } = req.query
      const offset = (Number(page) - 1) * Number(limit)
      const textFilter = q ? `%${q}%` : '%'
      const pathFilter = path ? `${path}%` : '%'
      const nodeFilter = node_id ? sql`AND ap.node_id = ${node_id}` : sql``

      const rows = await sql`
        SELECT ap.*, ci.name AS node_name
        FROM access_point ap
        LEFT JOIN container_instance ci ON ci.id = ap.node_id
        WHERE ap.path_id LIKE ${pathFilter}
          AND (ap.name ILIKE ${textFilter} OR ap.device_id ILIKE ${textFilter})
          ${nodeFilter}
        ORDER BY ap.path_id, ap.name
        LIMIT ${Number(limit)} OFFSET ${offset}
      `
      const [total] = await sql`
        SELECT COUNT(*)::int AS count FROM access_point ap
        WHERE ap.path_id LIKE ${pathFilter}
          AND (ap.name ILIKE ${textFilter} OR ap.device_id ILIKE ${textFilter})
          ${nodeFilter}
      `
      return { data: rows, total: total.count, page: Number(page), limit: Number(limit) }
    }
  )

  app.get<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const [row] = await sql`
      SELECT ap.*, ci.name AS node_name
      FROM access_point ap LEFT JOIN container_instance ci ON ci.id = ap.node_id
      WHERE ap.id = ${req.params.id}
    `
    if (!row) return reply.code(404).send({ error: 'Punto de acceso no encontrado' })
    return row
  })

  app.post<{ Body: { node_id: string; name: string; direction?: string; device_type?: string; entry_method?: string; exit_method?: string; device_id?: string; relay_duration_ms?: number } }>(
    '/', async (req, reply) => {
      await requireAdmin(req, reply)
      const { node_id, name, direction = 'ambas', device_type = 'puerta', entry_method = 'nfc', exit_method = 'nfc', device_id, relay_duration_ms = 5000 } = req.body
      if (!node_id || !name) return reply.code(400).send({ error: 'node_id y name son obligatorios' })

      const [created] = await sql`
        INSERT INTO access_point (node_id, name, direction, device_type, entry_method, exit_method, device_id, relay_duration_ms)
        VALUES (${node_id}, ${name}, ${direction}, ${device_type}, ${entry_method}, ${exit_method}, ${device_id ?? null}, ${relay_duration_ms})
        RETURNING *
      `
      return reply.code(201).send(created)
    }
  )

  app.patch<{ Params: { id: string }; Body: Record<string, any> }>(
    '/:id', async (req, reply) => {
      await requireAdmin(req, reply)
      const allowed = ['node_id', 'name', 'direction', 'device_type', 'entry_method', 'exit_method', 'device_id', 'relay_duration_ms', 'active']
      const fields: Record<string, any> = {}
      for (const k of allowed) { if (req.body[k] !== undefined) fields[k] = req.body[k] }
      if (Object.keys(fields).length === 0) return reply.code(400).send({ error: 'No hay campos' })

      const [updated] = await sql`
        UPDATE access_point SET ${sql(fields, ...Object.keys(fields))}, updated_at = NOW()
        WHERE id = ${req.params.id} RETURNING *
      `
      if (!updated) return reply.code(404).send({ error: 'No encontrado' })
      return updated
    }
  )

  app.delete<{ Params: { id: string } }>('/:id', async (req, reply) => {
    await requireSuperAdmin(req, reply)
    const [deleted] = await sql`DELETE FROM access_point WHERE id = ${req.params.id} RETURNING *`
    if (!deleted) return reply.code(404).send({ error: 'No encontrado' })
    return { message: 'Eliminado correctamente' }
  })
}
