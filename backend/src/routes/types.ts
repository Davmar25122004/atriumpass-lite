import { FastifyInstance } from 'fastify'
import { sql } from '../db/client.js'
import { requireAdmin } from '../utils/auth.js'

export async function typesRoutes(app: FastifyInstance) {

  app.get('/', async () => {
    return sql`SELECT * FROM container_type ORDER BY label`
  })

  app.get<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const [row] = await sql`SELECT * FROM container_type WHERE id = ${req.params.id}`
    if (!row) return reply.code(404).send({ error: 'Tipo no encontrado' })
    return row
  })

  app.post<{ Body: { id: string; label: string; color?: string; light_color?: string } }>(
    '/', async (req, reply) => {
      await requireAdmin(req, reply)
      const { id, label, color, light_color } = req.body
      if (!id || !label) return reply.code(400).send({ error: 'id y label son obligatorios' })
      const [created] = await sql`
        INSERT INTO container_type (id, label, color, light_color)
        VALUES (${id}, ${label}, ${color ?? '#666666'}, ${light_color ?? '#F0F0F0'})
        RETURNING *
      `
      return reply.code(201).send(created)
    }
  )

  app.patch<{ Params: { id: string }; Body: { label?: string; color?: string; light_color?: string } }>(
    '/:id', async (req, reply) => {
      await requireAdmin(req, reply)
      const { label, color, light_color } = req.body
      const [updated] = await sql`
        UPDATE container_type SET
          label = COALESCE(${label ?? null}, label),
          color = COALESCE(${color ?? null}, color),
          light_color = COALESCE(${light_color ?? null}, light_color),
          updated_at = NOW()
        WHERE id = ${req.params.id} RETURNING *
      `
      if (!updated) return reply.code(404).send({ error: 'Tipo no encontrado' })
      return updated
    }
  )

  app.delete<{ Params: { id: string } }>('/:id', async (req, reply) => {
    await requireAdmin(req, reply)
    const [deleted] = await sql`DELETE FROM container_type WHERE id = ${req.params.id} RETURNING *`
    if (!deleted) return reply.code(404).send({ error: 'Tipo no encontrado' })
    return { message: 'Eliminado correctamente' }
  })
}
