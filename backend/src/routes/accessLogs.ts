import { FastifyInstance } from 'fastify'
import { sql } from '../db/client.js'
import { verifyAccess } from './accessPlans.js'

export async function accessLogsRoutes(app: FastifyInstance) {

  app.get<{ Querystring: { page?: string; limit?: string; person_id?: string; access_point_id?: string; granted?: string; from?: string; to?: string; q?: string } }>(
    '/', async (req) => {
      const { page = '1', limit = '50', person_id, access_point_id, granted, from, to, q } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      const pFilter = person_id ? sql`AND al.person_id = ${person_id}` : sql``
      const apFilter = access_point_id ? sql`AND al.access_point_id = ${access_point_id}` : sql``
      const gFilter = granted !== undefined && granted !== '' ? sql`AND al.granted = ${granted === 'true'}` : sql``
      const fromFilter = from ? sql`AND al.timestamp >= ${from}::timestamptz` : sql``
      const toFilter = to ? sql`AND al.timestamp <= ${to}::timestamptz` : sql``
      const qFilter = q ? sql`AND (p.first_name ILIKE ${'%' + q + '%'} OR p.last_name ILIKE ${'%' + q + '%'} OR al.device_id ILIKE ${'%' + q + '%'})` : sql``

      const rows = await sql`
        SELECT al.*, p.first_name, p.last_name, ap.name AS point_name
        FROM access_log al
        LEFT JOIN person p ON p.id = al.person_id
        LEFT JOIN access_point ap ON ap.id = al.access_point_id
        WHERE 1=1 ${pFilter} ${apFilter} ${gFilter} ${fromFilter} ${toFilter} ${qFilter}
        ORDER BY al.timestamp DESC
        LIMIT ${Number(limit)} OFFSET ${offset}
      `
      const [total] = await sql`
        SELECT COUNT(*)::int AS count FROM access_log al
        LEFT JOIN person p ON p.id = al.person_id
        WHERE 1=1 ${pFilter} ${apFilter} ${gFilter} ${fromFilter} ${toFilter} ${qFilter}
      `
      return { data: rows, total: total.count, page: Number(page), limit: Number(limit) }
    }
  )

  app.get<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const [row] = await sql`
      SELECT al.*, p.first_name, p.last_name, ap.name AS point_name
      FROM access_log al
      LEFT JOIN person p ON p.id = al.person_id
      LEFT JOIN access_point ap ON ap.id = al.access_point_id
      WHERE al.id = ${req.params.id}
    `
    if (!row) return reply.code(404).send({ error: 'Log no encontrado' })
    return row
  })

  // POST — register access event (calls verifyAccess internally)
  app.post<{ Body: { person_id: string; access_point_id: string; direction: string; method_used?: string } }>(
    '/', async (req, reply) => {
      const { person_id, access_point_id, direction, method_used = 'nfc' } = req.body
      if (!person_id || !access_point_id || !direction) return reply.code(400).send({ error: 'person_id, access_point_id y direction son obligatorios' })

      const result = await verifyAccess(person_id, access_point_id, direction)

      // Get access point info
      const [ap] = await sql`SELECT path_id, device_id FROM access_point WHERE id = ${access_point_id}`

      const [log] = await sql`
        INSERT INTO access_log (access_point_id, path_id, person_id, direction, method_used, granted, deny_reason, device_id)
        VALUES (${access_point_id}, ${ap?.path_id ?? null}, ${person_id}, ${direction}, ${method_used}, ${result.allowed}, ${result.allowed ? null : result.reason}, ${ap?.device_id ?? null})
        RETURNING *
      `
      return reply.code(201).send({ ...log, verify_result: result })
    }
  )

  // GET /stats — statistics
  app.get('/stats', async () => {
    const today = new Date().toISOString().slice(0, 10)

    const [todayStats] = await sql`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE granted = true)::int AS granted_count,
        COUNT(*) FILTER (WHERE granted = false)::int AS denied_count
      FROM access_log
      WHERE timestamp::date = ${today}::date
    `

    const weekStats = await sql`
      SELECT timestamp::date AS date,
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE granted = true)::int AS granted_count,
        COUNT(*) FILTER (WHERE granted = false)::int AS denied_count
      FROM access_log
      WHERE timestamp >= NOW() - INTERVAL '7 days'
      GROUP BY timestamp::date
      ORDER BY date
    `

    const lastAccesses = await sql`
      SELECT al.id, al.timestamp, al.granted, al.deny_reason, al.direction, al.method_used,
        p.first_name, p.last_name, ap.name AS point_name
      FROM access_log al
      LEFT JOIN person p ON p.id = al.person_id
      LEFT JOIN access_point ap ON ap.id = al.access_point_id
      ORDER BY al.timestamp DESC LIMIT 10
    `

    const byPoint = await sql`
      SELECT ap.name, COUNT(*)::int AS count
      FROM access_log al
      LEFT JOIN access_point ap ON ap.id = al.access_point_id
      WHERE al.timestamp::date = ${today}::date
      GROUP BY ap.name ORDER BY count DESC LIMIT 5
    `

    const byHour = await sql`
      SELECT EXTRACT(hour FROM timestamp)::int AS hour, COUNT(*)::int AS count
      FROM access_log
      WHERE timestamp::date = ${today}::date
      GROUP BY hour ORDER BY hour
    `

    const [personCount] = await sql`SELECT COUNT(*)::int AS count FROM person`
    const [apCount] = await sql`SELECT COUNT(*)::int AS count FROM access_point WHERE active = true`
    const [zoneCount] = await sql`SELECT COUNT(*)::int AS count FROM container_instance`

    return {
      today: {
        total: todayStats.total,
        granted: todayStats.granted_count,
        denied: todayStats.denied_count,
      },
      week: weekStats,
      last_accesses: lastAccesses,
      by_point: byPoint,
      by_hour: byHour,
      total_persons: personCount.count,
      total_access_points: apCount.count,
      total_zones: zoneCount.count,
    }
  })
}
