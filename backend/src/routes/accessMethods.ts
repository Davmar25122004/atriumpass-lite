import { FastifyInstance } from 'fastify'
import { sql } from '../db/client.js'
import { requireSuperAdmin } from '../utils/auth.js'

export async function accessMethodsRoutes(app: FastifyInstance) {

  app.get('/', async () => {
    return sql`SELECT * FROM access_method WHERE active = true ORDER BY label`
  })

  app.post<{ Body: { key: string; label: string; description?: string } }>(
    '/', async (req, reply) => {
      await requireSuperAdmin(req, reply)
      const { key, label, description } = req.body
      if (!key || !label) return reply.code(400).send({ error: 'key y label son obligatorios' })
      const [created] = await sql`
        INSERT INTO access_method (key, label, description) VALUES (${key}, ${label}, ${description ?? null}) RETURNING *
      `
      return reply.code(201).send(created)
    }
  )

  app.patch<{ Params: { key: string }; Body: { label?: string; description?: string; active?: boolean } }>(
    '/:key', async (req, reply) => {
      await requireSuperAdmin(req, reply)
      const { label, description, active } = req.body
      const [updated] = await sql`
        UPDATE access_method SET
          label = COALESCE(${label ?? null}, label),
          description = COALESCE(${description ?? null}, description),
          active = COALESCE(${active ?? null}, active)
        WHERE key = ${req.params.key} RETURNING *
      `
      if (!updated) return reply.code(404).send({ error: 'Metodo no encontrado' })
      return updated
    }
  )

  app.delete<{ Params: { key: string } }>('/:key', async (req, reply) => {
    await requireSuperAdmin(req, reply)
    const [deleted] = await sql`DELETE FROM access_method WHERE key = ${req.params.key} RETURNING *`
    if (!deleted) return reply.code(404).send({ error: 'No encontrado' })
    return { message: 'Eliminado' }
  })
}
