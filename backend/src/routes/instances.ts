import { FastifyInstance } from 'fastify'
import { sql } from '../db/client.js'
import { requireAdmin } from '../utils/auth.js'

async function recalculateSubtreePaths(nodeId: string, newPath: string) {
  // Update this node
  await sql`UPDATE container_instance SET path_id = ${newPath}, updated_at = NOW() WHERE id = ${nodeId}`
  // Update persons and access_points linked to this node
  await sql`UPDATE person SET path_id = ${newPath} WHERE node_id = ${nodeId}`
  await sql`UPDATE access_point SET path_id = ${newPath} WHERE node_id = ${nodeId}`
  // Recurse into children
  const children = await sql`SELECT id FROM container_instance WHERE parent_id = ${nodeId}`
  for (const child of children) {
    const childPath = `${newPath}.${child.id}`
    await recalculateSubtreePaths(child.id, childPath)
  }
}

export async function instancesRoutes(app: FastifyInstance) {

  // GET / — full tree or filtered by path
  app.get<{ Querystring: { path?: string } }>('/', async (req) => {
    const { path } = req.query
    if (path) {
      return sql`
        SELECT ci.*, ct.label AS type_label, ct.color AS type_color, ct.light_color AS type_light_color
        FROM container_instance ci
        LEFT JOIN container_type ct ON ct.id = ci.type_id
        WHERE ci.path_id LIKE ${path + '%'}
        ORDER BY ci.path_id
      `
    }
    return sql`
      SELECT ci.*, ct.label AS type_label, ct.color AS type_color, ct.light_color AS type_light_color
      FROM container_instance ci
      LEFT JOIN container_type ct ON ct.id = ci.type_id
      ORDER BY ci.path_id
    `
  })

  // GET /:id — node with direct children
  app.get<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const [node] = await sql`
      SELECT ci.*, ct.label AS type_label, ct.color AS type_color, ct.light_color AS type_light_color
      FROM container_instance ci
      LEFT JOIN container_type ct ON ct.id = ci.type_id
      WHERE ci.id = ${req.params.id}
    `
    if (!node) return reply.code(404).send({ error: 'Nodo no encontrado' })
    const children = await sql`
      SELECT ci.*, ct.label AS type_label, ct.color AS type_color
      FROM container_instance ci
      LEFT JOIN container_type ct ON ct.id = ci.type_id
      WHERE ci.parent_id = ${req.params.id}
      ORDER BY ci.name
    `
    return { ...node, children }
  })

  // POST — create node
  app.post<{ Body: { id: string; name: string; type_id?: string; parent_id?: string; attrs?: Record<string, unknown> } }>(
    '/', async (req, reply) => {
      await requireAdmin(req, reply)
      const { id, name, type_id, parent_id, attrs } = req.body
      if (!id || !name) return reply.code(400).send({ error: 'id y name son obligatorios' })

      let path_id = id
      if (parent_id) {
        const [parent] = await sql`SELECT path_id FROM container_instance WHERE id = ${parent_id}`
        if (!parent) return reply.code(400).send({ error: 'parent_id no existe' })
        path_id = `${parent.path_id}.${id}`
      }

      const [created] = await sql`
        INSERT INTO container_instance (id, name, type_id, parent_id, path_id, attrs)
        VALUES (${id}, ${name}, ${type_id ?? null}, ${parent_id ?? null}, ${path_id}, ${JSON.stringify(attrs || {})})
        RETURNING *
      `
      return reply.code(201).send(created)
    }
  )

  // PATCH /:id — rename or move
  app.patch<{ Params: { id: string }; Body: { name?: string; parent_id?: string; type_id?: string; attrs?: Record<string, unknown> } }>(
    '/:id', async (req, reply) => {
      await requireAdmin(req, reply)
      const { name, parent_id, type_id, attrs } = req.body
      const nodeId = req.params.id

      const [current] = await sql`SELECT * FROM container_instance WHERE id = ${nodeId}`
      if (!current) return reply.code(404).send({ error: 'Nodo no encontrado' })

      // If moving (parent changed), recalculate path
      if (parent_id !== undefined && parent_id !== current.parent_id) {
        let newPath = nodeId
        if (parent_id) {
          const [newParent] = await sql`SELECT path_id FROM container_instance WHERE id = ${parent_id}`
          if (!newParent) return reply.code(400).send({ error: 'parent_id no existe' })
          newPath = `${newParent.path_id}.${nodeId}`
        }
        await sql`UPDATE container_instance SET parent_id = ${parent_id ?? null}, updated_at = NOW() WHERE id = ${nodeId}`
        await recalculateSubtreePaths(nodeId, newPath)
      }

      // Update other fields
      const [updated] = await sql`
        UPDATE container_instance SET
          name = COALESCE(${name ?? null}, name),
          type_id = COALESCE(${type_id ?? null}, type_id),
          attrs = COALESCE(${attrs ? JSON.stringify(attrs) : null}, attrs),
          updated_at = NOW()
        WHERE id = ${nodeId} RETURNING *
      `
      return updated
    }
  )

  // DELETE /:id — cascade
  app.delete<{ Params: { id: string } }>('/:id', async (req, reply) => {
    await requireAdmin(req, reply)
    const [deleted] = await sql`DELETE FROM container_instance WHERE id = ${req.params.id} RETURNING *`
    if (!deleted) return reply.code(404).send({ error: 'Nodo no encontrado' })
    return { message: 'Eliminado correctamente' }
  })

  // GET /tree — nested tree structure
  app.get('/tree/nested', async () => {
    const all = await sql`
      SELECT ci.*, ct.label AS type_label, ct.color AS type_color, ct.light_color AS type_light_color
      FROM container_instance ci
      LEFT JOIN container_type ct ON ct.id = ci.type_id
      ORDER BY ci.path_id
    `
    // Build nested tree
    const map = new Map<string, any>()
    const roots: any[] = []
    for (const node of all) {
      map.set(node.id, { ...node, children: [] })
    }
    for (const node of all) {
      const item = map.get(node.id)!
      if (node.parent_id && map.has(node.parent_id)) {
        map.get(node.parent_id)!.children.push(item)
      } else {
        roots.push(item)
      }
    }
    return roots
  })
}
