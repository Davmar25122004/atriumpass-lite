import { FastifyInstance } from 'fastify'
import { sql } from '../db/client.js'
import { requireAdmin } from '../utils/auth.js'

export async function accessPermissionsRoutes(app: FastifyInstance) {

  app.get<{ Querystring: { person_id?: string; access_point_id?: string; direction?: string } }>(
    '/', async (req) => {
      const { person_id, access_point_id, direction } = req.query
      const pFilter = person_id ? sql`AND ap2.person_id = ${person_id}` : sql``
      const apFilter = access_point_id ? sql`AND ap2.access_point_id = ${access_point_id}` : sql``
      const dFilter = direction ? sql`AND ap2.direction = ${direction}` : sql``

      return sql`
        SELECT ap2.*, p.first_name, p.last_name, apt.name AS point_name
        FROM access_permission ap2
        LEFT JOIN person p ON p.id = ap2.person_id
        LEFT JOIN access_point apt ON apt.id = ap2.access_point_id
        WHERE 1=1 ${pFilter} ${apFilter} ${dFilter}
        ORDER BY p.last_name, apt.name
      `
    }
  )

  app.get<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const [row] = await sql`
      SELECT ap2.*, p.first_name, p.last_name, apt.name AS point_name
      FROM access_permission ap2
      LEFT JOIN person p ON p.id = ap2.person_id
      LEFT JOIN access_point apt ON apt.id = ap2.access_point_id
      WHERE ap2.id = ${req.params.id}
    `
    if (!row) return reply.code(404).send({ error: 'Permiso no encontrado' })
    return row
  })

  app.post<{ Body: { person_id: string; access_point_id: string; direction?: string; anti_passback?: string; valid_from?: string; valid_until?: string } }>(
    '/', async (req, reply) => {
      await requireAdmin(req, reply)
      const { person_id, access_point_id, direction = 'ambas', anti_passback = 'none', valid_from, valid_until } = req.body
      if (!person_id || !access_point_id) return reply.code(400).send({ error: 'person_id y access_point_id son obligatorios' })
      const [created] = await sql`
        INSERT INTO access_permission (person_id, access_point_id, direction, anti_passback, valid_from, valid_until)
        VALUES (${person_id}, ${access_point_id}, ${direction}, ${anti_passback}, ${valid_from ?? null}, ${valid_until ?? null})
        RETURNING *
      `
      return reply.code(201).send(created)
    }
  )

  app.patch<{ Params: { id: string }; Body: Record<string, any> }>(
    '/:id', async (req, reply) => {
      await requireAdmin(req, reply)
      const allowed = ['direction', 'anti_passback', 'valid_from', 'valid_until', 'last_direction', 'last_access_at']
      const fields: Record<string, any> = {}
      for (const k of allowed) if (req.body[k] !== undefined) fields[k] = req.body[k]
      if (!Object.keys(fields).length) return reply.code(400).send({ error: 'No fields' })
      const [updated] = await sql`
        UPDATE access_permission SET ${sql(fields, ...Object.keys(fields))} WHERE id = ${req.params.id} RETURNING *
      `
      if (!updated) return reply.code(404).send({ error: 'No encontrado' })
      return updated
    }
  )

  app.delete<{ Params: { id: string } }>('/:id', async (req, reply) => {
    await requireAdmin(req, reply)
    const [d] = await sql`DELETE FROM access_permission WHERE id = ${req.params.id} RETURNING *`
    if (!d) return reply.code(404).send({ error: 'No encontrado' })
    return { message: 'Eliminado' }
  })
}
