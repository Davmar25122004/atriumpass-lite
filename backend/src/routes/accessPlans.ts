import { FastifyInstance } from 'fastify'
import { sql } from '../db/client.js'
import { requireAdmin } from '../utils/auth.js'

// ── verifyAccess ─────────────────────────────────────────────
export async function verifyAccess(
  personId: string, accessPointId: string, direction: string
): Promise<{ allowed: boolean; reason: string }> {

  // 1. Person has plan?
  const [person] = await sql`SELECT id, plan_id FROM person WHERE id = ${personId}`
  if (!person) return { allowed: false, reason: 'persona_no_encontrada' }
  if (!person.plan_id) return { allowed: true, reason: 'sin_plan' }

  const planId = person.plan_id
  const [plan] = await sql`SELECT * FROM access_plan WHERE id = ${planId}`
  if (!plan) return { allowed: true, reason: 'plan_no_encontrado' }

  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  const dow = now.getDay() === 0 ? 7 : now.getDay() // 1=Mon..7=Sun
  const currentTime = now.toTimeString().slice(0, 5)

  // 2. Personal override?
  const [override] = await sql`
    SELECT * FROM person_calendar_override
    WHERE person_id = ${personId} AND date = ${todayStr}
    LIMIT 1
  `
  if (override) {
    if (!override.profile_id) return { allowed: false, reason: 'dia_bloqueado' }
    // Check custom access points
    if (override.custom_access_point_ids) {
      const customIds = typeof override.custom_access_point_ids === 'string'
        ? JSON.parse(override.custom_access_point_ids) : override.custom_access_point_ids
      if (Array.isArray(customIds) && !customIds.includes(accessPointId)) {
        return { allowed: false, reason: 'punto_no_en_override' }
      }
    }
    // Check custom slots or profile schedule
    if (override.custom_slots) {
      const slots = typeof override.custom_slots === 'string' ? JSON.parse(override.custom_slots) : override.custom_slots
      const inSlot = Array.isArray(slots) && slots.some((s: any) => currentTime >= s.time_from && currentTime <= s.time_to)
      if (!inSlot) return { allowed: false, reason: 'fuera_horario' }
      return await checkAntiPassback(plan, personId, accessPointId, direction)
    }
    return await checkProfileAccess(override.profile_id, accessPointId, dow, currentTime, plan, personId, direction)
  }

  // 3. Plan day override?
  const [planDay] = await sql`
    SELECT * FROM access_plan_day WHERE plan_id = ${planId} AND date = ${todayStr} LIMIT 1
  `
  if (planDay && planDay.profile_id) {
    return await checkProfileAccess(planDay.profile_id, accessPointId, dow, currentTime, plan, personId, direction)
  }

  // 4. Week pattern?
  const [weekPattern] = await sql`
    SELECT * FROM access_plan_week_pattern WHERE plan_id = ${planId} AND day_of_week = ${dow} LIMIT 1
  `
  if (weekPattern) {
    return await checkProfileAccess(weekPattern.profile_id, accessPointId, dow, currentTime, plan, personId, direction)
  }

  // 5. Default profile
  if (plan.default_profile_id) {
    return await checkProfileAccess(plan.default_profile_id, accessPointId, dow, currentTime, plan, personId, direction)
  }

  return { allowed: false, reason: 'sin_perfil_configurado' }
}

async function checkProfileAccess(
  profileId: string, accessPointId: string, dow: number, currentTime: string,
  plan: any, personId: string, direction: string
): Promise<{ allowed: boolean; reason: string }> {
  // Check route includes access point
  const routeCheck = await sql`
    SELECT arp.id FROM access_profile_item api
    JOIN access_route_point arp ON arp.route_id = api.route_id AND arp.access_point_id = ${accessPointId}
    WHERE api.profile_id = ${profileId}
    LIMIT 1
  `
  if (routeCheck.length === 0) return { allowed: false, reason: 'punto_no_en_ruta' }

  // Check schedule
  const scheduleCheck = await sql`
    SELECT ss.id FROM access_profile_item api
    JOIN access_schedule_slot ss ON ss.schedule_id = api.schedule_id
      AND ss.day_of_week = ${dow}
      AND ss.time_from <= ${currentTime}::time
      AND ss.time_to >= ${currentTime}::time
    WHERE api.profile_id = ${profileId}
    LIMIT 1
  `
  if (scheduleCheck.length === 0) return { allowed: false, reason: 'fuera_horario' }

  return await checkAntiPassback(plan, personId, accessPointId, direction)
}

async function checkAntiPassback(
  plan: any, personId: string, accessPointId: string, direction: string
): Promise<{ allowed: boolean; reason: string }> {
  if (plan.anti_passback === 'none') return { allowed: true, reason: 'ok' }

  const [perm] = await sql`
    SELECT last_direction, last_access_at FROM access_permission
    WHERE person_id = ${personId} AND access_point_id = ${accessPointId}
    LIMIT 1
  `

  if (perm && perm.last_direction === direction) {
    if (plan.anti_passback === 'local') {
      return { allowed: false, reason: 'anti_passback_local' }
    }
    if (plan.anti_passback === 'daily') {
      const lastDate = perm.last_access_at ? new Date(perm.last_access_at).toISOString().slice(0, 10) : ''
      const today = new Date().toISOString().slice(0, 10)
      if (lastDate === today) return { allowed: false, reason: 'anti_passback_daily' }
    }
    if (plan.anti_passback === 'temporal' && plan.anti_passback_time > 0 && perm.last_access_at) {
      const elapsed = (Date.now() - new Date(perm.last_access_at).getTime()) / 60000
      if (elapsed < plan.anti_passback_time) return { allowed: false, reason: 'anti_passback_temporal' }
    }
  }

  // Update last direction
  if (perm) {
    await sql`UPDATE access_permission SET last_direction = ${direction}, last_access_at = NOW() WHERE person_id = ${personId} AND access_point_id = ${accessPointId}`
  }

  return { allowed: true, reason: 'ok' }
}

// ── Routes ───────────────────────────────────────────────────
export async function accessPlansRoutes(app: FastifyInstance) {

  // ── Plans CRUD ──
  app.get('/', async () => sql`SELECT * FROM access_plan ORDER BY name`)
  app.get<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const [row] = await sql`SELECT * FROM access_plan WHERE id = ${req.params.id}`
    if (!row) return reply.code(404).send({ error: 'Plan no encontrado' })
    return row
  })
  app.post<{ Body: { name: string; description?: string; default_profile_id?: string; anti_passback?: string; anti_passback_time?: number } }>(
    '/', async (req, reply) => {
      await requireAdmin(req, reply)
      const { name, description, default_profile_id, anti_passback = 'none', anti_passback_time = 0 } = req.body
      const [created] = await sql`INSERT INTO access_plan (name, description, default_profile_id, anti_passback, anti_passback_time) VALUES (${name}, ${description ?? null}, ${default_profile_id ?? null}, ${anti_passback}, ${anti_passback_time}) RETURNING *`
      return reply.code(201).send(created)
    })
  app.patch<{ Params: { id: string }; Body: Record<string, any> }>('/:id', async (req, reply) => {
    await requireAdmin(req, reply)
    const allowed = ['name', 'description', 'default_profile_id', 'anti_passback', 'anti_passback_time']
    const fields: Record<string, any> = {}
    for (const k of allowed) if (req.body[k] !== undefined) fields[k] = req.body[k]
    if (!Object.keys(fields).length) return reply.code(400).send({ error: 'No fields' })
    const [updated] = await sql`UPDATE access_plan SET ${sql(fields, ...Object.keys(fields))}, updated_at = NOW() WHERE id = ${req.params.id} RETURNING *`
    if (!updated) return reply.code(404).send({ error: 'No encontrado' })
    return updated
  })
  app.delete<{ Params: { id: string } }>('/:id', async (req, reply) => {
    await requireAdmin(req, reply)
    const [d] = await sql`DELETE FROM access_plan WHERE id = ${req.params.id} RETURNING *`
    if (!d) return reply.code(404).send({ error: 'No encontrado' })
    return { message: 'Eliminado' }
  })

  // ── Profiles ──
  app.get('/profiles', async () => sql`SELECT * FROM access_profile ORDER BY name`)
  app.get<{ Params: { id: string } }>('/profiles/:id', async (req, reply) => {
    const [r] = await sql`SELECT * FROM access_profile WHERE id = ${req.params.id}`
    if (!r) return reply.code(404).send({ error: 'Perfil no encontrado' })
    return r
  })
  app.post<{ Body: { name: string; description?: string } }>('/profiles', async (req, reply) => {
    await requireAdmin(req, reply)
    const [c] = await sql`INSERT INTO access_profile (name, description) VALUES (${req.body.name}, ${req.body.description ?? null}) RETURNING *`
    return reply.code(201).send(c)
  })
  app.patch<{ Params: { id: string }; Body: { name?: string; description?: string } }>('/profiles/:id', async (req, reply) => {
    await requireAdmin(req, reply)
    const [u] = await sql`UPDATE access_profile SET name = COALESCE(${req.body.name ?? null}, name), description = COALESCE(${req.body.description ?? null}, description), updated_at = NOW() WHERE id = ${req.params.id} RETURNING *`
    if (!u) return reply.code(404).send({ error: 'No encontrado' })
    return u
  })
  app.delete<{ Params: { id: string } }>('/profiles/:id', async (req, reply) => {
    await requireAdmin(req, reply)
    const [d] = await sql`DELETE FROM access_profile WHERE id = ${req.params.id} RETURNING *`
    if (!d) return reply.code(404).send({ error: 'No encontrado' })
    return { message: 'Eliminado' }
  })

  // ── Profile items ──
  app.get<{ Params: { id: string } }>('/profiles/:id/items', async (req) => {
    return sql`SELECT api.*, ar.name AS route_name, asc2.name AS schedule_name FROM access_profile_item api LEFT JOIN access_route ar ON ar.id = api.route_id LEFT JOIN access_schedule asc2 ON asc2.id = api.schedule_id WHERE api.profile_id = ${req.params.id}`
  })
  app.post<{ Params: { id: string }; Body: { route_id: string; schedule_id: string } }>('/profiles/:id/items', async (req, reply) => {
    await requireAdmin(req, reply)
    const [c] = await sql`INSERT INTO access_profile_item (profile_id, route_id, schedule_id) VALUES (${req.params.id}, ${req.body.route_id}, ${req.body.schedule_id}) RETURNING *`
    return reply.code(201).send(c)
  })
  app.delete<{ Params: { id: string; itemId: string } }>('/profiles/:id/items/:itemId', async (req, reply) => {
    await requireAdmin(req, reply)
    await sql`DELETE FROM access_profile_item WHERE id = ${req.params.itemId}`
    return { message: 'Eliminado' }
  })

  // ── Routes ──
  app.get('/routes', async () => sql`SELECT * FROM access_route ORDER BY name`)
  app.get<{ Params: { id: string } }>('/routes/:id', async (req, reply) => {
    const [r] = await sql`SELECT * FROM access_route WHERE id = ${req.params.id}`
    if (!r) return reply.code(404).send({ error: 'No encontrada' })
    return r
  })
  app.post<{ Body: { name: string; description?: string } }>('/routes', async (req, reply) => {
    await requireAdmin(req, reply)
    const [c] = await sql`INSERT INTO access_route (name, description) VALUES (${req.body.name}, ${req.body.description ?? null}) RETURNING *`
    return reply.code(201).send(c)
  })
  app.patch<{ Params: { id: string }; Body: { name?: string; description?: string } }>('/routes/:id', async (req, reply) => {
    await requireAdmin(req, reply)
    const [u] = await sql`UPDATE access_route SET name = COALESCE(${req.body.name ?? null}, name), description = COALESCE(${req.body.description ?? null}, description), updated_at = NOW() WHERE id = ${req.params.id} RETURNING *`
    if (!u) return reply.code(404).send({ error: 'No encontrada' })
    return u
  })
  app.delete<{ Params: { id: string } }>('/routes/:id', async (req, reply) => {
    await requireAdmin(req, reply)
    const [d] = await sql`DELETE FROM access_route WHERE id = ${req.params.id} RETURNING *`
    if (!d) return reply.code(404).send({ error: 'No encontrada' })
    return { message: 'Eliminada' }
  })

  // ── Route points ──
  app.get<{ Params: { id: string } }>('/routes/:id/points', async (req) => {
    return sql`SELECT arp.*, ap.name AS point_name, ap.device_id FROM access_route_point arp LEFT JOIN access_point ap ON ap.id = arp.access_point_id WHERE arp.route_id = ${req.params.id} ORDER BY arp.order_index`
  })
  app.post<{ Params: { id: string }; Body: { access_point_id: string; order_index?: number } }>('/routes/:id/points', async (req, reply) => {
    await requireAdmin(req, reply)
    const [c] = await sql`INSERT INTO access_route_point (route_id, access_point_id, order_index) VALUES (${req.params.id}, ${req.body.access_point_id}, ${req.body.order_index ?? 0}) RETURNING *`
    return reply.code(201).send(c)
  })
  app.delete<{ Params: { id: string; pointId: string } }>('/routes/:id/points/:pointId', async (req, reply) => {
    await requireAdmin(req, reply)
    await sql`DELETE FROM access_route_point WHERE id = ${req.params.pointId}`
    return { message: 'Eliminado' }
  })

  // ── Schedules ──
  app.get('/schedules', async () => sql`SELECT * FROM access_schedule ORDER BY name`)
  app.get<{ Params: { id: string } }>('/schedules/:id', async (req, reply) => {
    const [r] = await sql`SELECT * FROM access_schedule WHERE id = ${req.params.id}`
    if (!r) return reply.code(404).send({ error: 'No encontrado' })
    return r
  })
  app.post<{ Body: { name: string; description?: string } }>('/schedules', async (req, reply) => {
    await requireAdmin(req, reply)
    const [c] = await sql`INSERT INTO access_schedule (name, description) VALUES (${req.body.name}, ${req.body.description ?? null}) RETURNING *`
    return reply.code(201).send(c)
  })
  app.patch<{ Params: { id: string }; Body: { name?: string; description?: string } }>('/schedules/:id', async (req, reply) => {
    await requireAdmin(req, reply)
    const [u] = await sql`UPDATE access_schedule SET name = COALESCE(${req.body.name ?? null}, name), description = COALESCE(${req.body.description ?? null}, description), updated_at = NOW() WHERE id = ${req.params.id} RETURNING *`
    if (!u) return reply.code(404).send({ error: 'No encontrado' })
    return u
  })
  app.delete<{ Params: { id: string } }>('/schedules/:id', async (req, reply) => {
    await requireAdmin(req, reply)
    const [d] = await sql`DELETE FROM access_schedule WHERE id = ${req.params.id} RETURNING *`
    if (!d) return reply.code(404).send({ error: 'No encontrado' })
    return { message: 'Eliminado' }
  })

  // ── Schedule slots ──
  app.get<{ Params: { id: string } }>('/schedules/:id/slots', async (req) => {
    return sql`SELECT * FROM access_schedule_slot WHERE schedule_id = ${req.params.id} ORDER BY day_of_week, time_from`
  })
  app.post<{ Params: { id: string }; Body: { day_of_week: number; time_from: string; time_to: string } }>('/schedules/:id/slots', async (req, reply) => {
    await requireAdmin(req, reply)
    const { day_of_week, time_from, time_to } = req.body
    const [c] = await sql`INSERT INTO access_schedule_slot (schedule_id, day_of_week, time_from, time_to) VALUES (${req.params.id}, ${day_of_week}, ${time_from}, ${time_to}) RETURNING *`
    return reply.code(201).send(c)
  })
  app.delete<{ Params: { id: string; slotId: string } }>('/schedules/:id/slots/:slotId', async (req, reply) => {
    await requireAdmin(req, reply)
    await sql`DELETE FROM access_schedule_slot WHERE id = ${req.params.slotId}`
    return { message: 'Eliminado' }
  })

  // ── Plan days ──
  app.get<{ Params: { id: string } }>('/:id/days', async (req) => {
    return sql`SELECT * FROM access_plan_day WHERE plan_id = ${req.params.id} ORDER BY date`
  })
  app.post<{ Params: { id: string }; Body: { date: string; profile_id: string } }>('/:id/days', async (req, reply) => {
    await requireAdmin(req, reply)
    const [c] = await sql`INSERT INTO access_plan_day (plan_id, date, profile_id) VALUES (${req.params.id}, ${req.body.date}, ${req.body.profile_id}) RETURNING *`
    return reply.code(201).send(c)
  })
  app.delete<{ Params: { id: string; date: string } }>('/:id/days/:date', async (req, reply) => {
    await requireAdmin(req, reply)
    await sql`DELETE FROM access_plan_day WHERE plan_id = ${req.params.id} AND date = ${req.params.date}`
    return { message: 'Eliminado' }
  })

  // ── Week pattern ──
  app.get<{ Params: { id: string } }>('/:id/week-pattern', async (req) => {
    return sql`SELECT wp.*, ap.name AS profile_name FROM access_plan_week_pattern wp LEFT JOIN access_profile ap ON ap.id = wp.profile_id WHERE wp.plan_id = ${req.params.id} ORDER BY wp.day_of_week`
  })
  app.post<{ Params: { id: string }; Body: { day_of_week: number; profile_id: string } }>('/:id/week-pattern', async (req, reply) => {
    await requireAdmin(req, reply)
    const [c] = await sql`INSERT INTO access_plan_week_pattern (plan_id, day_of_week, profile_id) VALUES (${req.params.id}, ${req.body.day_of_week}, ${req.body.profile_id}) RETURNING *`
    return reply.code(201).send(c)
  })
  app.delete<{ Params: { id: string; dow: string } }>('/:id/week-pattern/:dow', async (req, reply) => {
    await requireAdmin(req, reply)
    await sql`DELETE FROM access_plan_week_pattern WHERE plan_id = ${req.params.id} AND day_of_week = ${Number(req.params.dow)}`
    return { message: 'Eliminado' }
  })

  // ── Person overrides ──
  app.get<{ Params: { personId: string } }>('/persons/:personId/overrides', async (req) => {
    return sql`SELECT * FROM person_calendar_override WHERE person_id = ${req.params.personId} ORDER BY date`
  })
  app.post<{ Params: { personId: string }; Body: { date: string; profile_id?: string; custom_slots?: any; custom_access_point_ids?: any; note?: string } }>(
    '/persons/:personId/overrides', async (req, reply) => {
      await requireAdmin(req, reply)
      const { date, profile_id, custom_slots, custom_access_point_ids, note } = req.body
      const [c] = await sql`INSERT INTO person_calendar_override (person_id, date, profile_id, custom_slots, custom_access_point_ids, note)
        VALUES (${req.params.personId}, ${date}, ${profile_id ?? null}, ${custom_slots ? JSON.stringify(custom_slots) : null}, ${custom_access_point_ids ? JSON.stringify(custom_access_point_ids) : null}, ${note ?? null}) RETURNING *`
      return reply.code(201).send(c)
    })
  app.delete<{ Params: { personId: string; date: string } }>('/persons/:personId/overrides/:date', async (req, reply) => {
    await requireAdmin(req, reply)
    await sql`DELETE FROM person_calendar_override WHERE person_id = ${req.params.personId} AND date = ${req.params.date}`
    return { message: 'Eliminado' }
  })

  // ── Assign plan to person ──
  app.patch<{ Params: { personId: string }; Body: { plan_id: string | null } }>('/persons/:personId/plan', async (req, reply) => {
    await requireAdmin(req, reply)
    const [u] = await sql`UPDATE person SET plan_id = ${req.body.plan_id}, updated_at = NOW() WHERE id = ${req.params.personId} RETURNING id, first_name, last_name, plan_id`
    if (!u) return reply.code(404).send({ error: 'Persona no encontrada' })
    return u
  })

  // ── Verify access endpoint ──
  app.post<{ Body: { person_id: string; access_point_id: string; direction: string } }>('/verify', async (req) => {
    const { person_id, access_point_id, direction } = req.body
    return verifyAccess(person_id, access_point_id, direction)
  })
}
