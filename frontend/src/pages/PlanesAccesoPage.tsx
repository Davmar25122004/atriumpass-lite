import { useEffect, useState, useCallback } from 'react'
import { apiFetch } from '../api/client'
import { Plus, Trash2, Link, Clock, MapPin, CalendarDays } from 'lucide-react'

interface Plan { id: string; name: string; description: string; default_profile_id: string; anti_passback: string }
interface Profile { id: string; name: string }
interface Route { id: string; name: string }
interface Schedule { id: string; name: string }
interface ProfileItem { id: string; route_id: string; schedule_id: string; route_name: string; schedule_name: string }
interface RoutePoint { id: string; access_point_id: string; point_name: string; device_id: string }
interface Slot { id: string; day_of_week: number; time_from: string; time_to: string }
interface Person { id: string; first_name: string; last_name: string; plan_id: string }

const DAYS = ['', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom']

type Tab = 'plans' | 'profiles' | 'routes' | 'schedules' | 'assign'

export default function PlanesAccesoPage() {
  const [tab, setTab] = useState<Tab>('plans')
  const [plans, setPlans] = useState<Plan[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [routes, setRoutes] = useState<Route[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [persons, setPersons] = useState<Person[]>([])

  // Detail states
  const [selProfile, setSelProfile] = useState<string | null>(null)
  const [profileItems, setProfileItems] = useState<ProfileItem[]>([])
  const [selRoute, setSelRoute] = useState<string | null>(null)
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([])
  const [selSchedule, setSelSchedule] = useState<string | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [accessPoints, setAccessPoints] = useState<{ id: string; name: string }[]>([])

  const loadAll = useCallback(async () => {
    const [pl, pr, ro, sc, pe, ap] = await Promise.all([
      apiFetch<Plan[]>('/access-plans'), apiFetch<Profile[]>('/access-plans/profiles'),
      apiFetch<Route[]>('/access-plans/routes'), apiFetch<Schedule[]>('/access-plans/schedules'),
      apiFetch<{ data: Person[] }>('/persons?limit=200'), apiFetch<{ data: { id: string; name: string }[] }>('/access-points?limit=200'),
    ])
    setPlans(pl); setProfiles(pr); setRoutes(ro); setSchedules(sc); setPersons(pe.data); setAccessPoints(ap.data)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  const loadProfileItems = async (id: string) => { setSelProfile(id); setProfileItems(await apiFetch(`/access-plans/profiles/${id}/items`)) }
  const loadRoutePoints = async (id: string) => { setSelRoute(id); setRoutePoints(await apiFetch(`/access-plans/routes/${id}/points`)) }
  const loadSlots = async (id: string) => { setSelSchedule(id); setSlots(await apiFetch(`/access-plans/schedules/${id}/slots`)) }

  // Quick create helpers
  const createPlan = async () => {
    const name = prompt('Nombre del plan:')
    if (!name) return
    await apiFetch('/access-plans', { method: 'POST', body: JSON.stringify({ name }) }); loadAll()
  }
  const createProfile = async () => {
    const name = prompt('Nombre del perfil:')
    if (!name) return
    await apiFetch('/access-plans/profiles', { method: 'POST', body: JSON.stringify({ name }) }); loadAll()
  }
  const createRoute = async () => {
    const name = prompt('Nombre de la ruta:')
    if (!name) return
    await apiFetch('/access-plans/routes', { method: 'POST', body: JSON.stringify({ name }) }); loadAll()
  }
  const createSchedule = async () => {
    const name = prompt('Nombre del horario:')
    if (!name) return
    await apiFetch('/access-plans/schedules', { method: 'POST', body: JSON.stringify({ name }) }); loadAll()
  }

  const tabStyle = (t: Tab) => ({
    color: tab === t ? 'var(--vp-primary)' : 'var(--vp-text-muted)',
    borderBottomColor: tab === t ? 'var(--vp-primary)' : 'transparent',
    fontWeight: tab === t ? 600 : 400,
  })

  return (
    <div>
      <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--vp-text-heading)' }}>Planes de Acceso</h2>

      <div className="flex mb-4 border-b" style={{ borderColor: 'var(--vp-border-divider)' }}>
        {(['plans', 'profiles', 'routes', 'schedules', 'assign'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className="vp-tab" style={tabStyle(t)}>
            {t === 'plans' ? 'Planes' : t === 'profiles' ? 'Perfiles' : t === 'routes' ? 'Rutas' : t === 'schedules' ? 'Horarios' : 'Asignar'}
          </button>
        ))}
      </div>

      {/* Plans tab */}
      {tab === 'plans' && (
        <div>
          <button onClick={createPlan} className="flex items-center gap-1 px-3 py-2 rounded-md text-white text-sm mb-3" style={{ background: 'var(--vp-primary)' }}><Plus size={14} /> Nuevo plan</button>
          <div className="space-y-2">
            {plans.map(p => (
              <div key={p.id} className="glass-card p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium" style={{ color: 'var(--vp-text-heading)' }}>{p.name}</p>
                  <p className="text-xs" style={{ color: 'var(--vp-text-muted)' }}>Anti-passback: {p.anti_passback} · Perfil por defecto: {profiles.find(pr => pr.id === p.default_profile_id)?.name || 'Ninguno'}</p>
                </div>
                <button onClick={async () => { await apiFetch(`/access-plans/${p.id}`, { method: 'DELETE' }); loadAll() }} className="p-1 rounded hover:bg-red-50"><Trash2 size={14} className="text-red-500" /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Profiles tab */}
      {tab === 'profiles' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <button onClick={createProfile} className="flex items-center gap-1 px-3 py-2 rounded-md text-white text-sm mb-3" style={{ background: 'var(--vp-primary)' }}><Plus size={14} /> Nuevo perfil</button>
            <div className="space-y-2">
              {profiles.map(p => (
                <button key={p.id} onClick={() => loadProfileItems(p.id)}
                  className="glass-card p-3 w-full text-left flex items-center gap-2"
                  style={{ borderColor: selProfile === p.id ? 'var(--vp-primary)' : 'var(--vp-border-card)' }}>
                  <Link size={14} style={{ color: 'var(--vp-primary)' }} />
                  <span style={{ color: 'var(--vp-text-heading)' }}>{p.name}</span>
                </button>
              ))}
            </div>
          </div>
          {selProfile && (
            <div>
              <p className="text-sm font-semibold mb-2" style={{ color: 'var(--vp-text-heading)' }}>Items del perfil</p>
              {profileItems.map(it => (
                <div key={it.id} className="glass-card p-3 mb-2 flex items-center justify-between">
                  <span className="text-sm">{it.route_name} + {it.schedule_name}</span>
                  <button onClick={async () => { await apiFetch(`/access-plans/profiles/${selProfile}/items/${it.id}`, { method: 'DELETE' }); loadProfileItems(selProfile) }}><Trash2 size={12} className="text-red-500" /></button>
                </div>
              ))}
              <div className="flex gap-2 mt-2">
                <select id="pi-route" className="border rounded-md px-2 py-1 text-sm flex-1" style={{ background: 'var(--vp-bg-card)', borderColor: 'var(--vp-border-card)' }}>
                  {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <select id="pi-sched" className="border rounded-md px-2 py-1 text-sm flex-1" style={{ background: 'var(--vp-bg-card)', borderColor: 'var(--vp-border-card)' }}>
                  {schedules.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <button onClick={async () => {
                  const route_id = (document.getElementById('pi-route') as HTMLSelectElement).value
                  const schedule_id = (document.getElementById('pi-sched') as HTMLSelectElement).value
                  await apiFetch(`/access-plans/profiles/${selProfile}/items`, { method: 'POST', body: JSON.stringify({ route_id, schedule_id }) })
                  loadProfileItems(selProfile)
                }} className="px-3 py-1 rounded-md text-white text-sm" style={{ background: 'var(--vp-primary)' }}>Añadir</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Routes tab */}
      {tab === 'routes' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <button onClick={createRoute} className="flex items-center gap-1 px-3 py-2 rounded-md text-white text-sm mb-3" style={{ background: 'var(--vp-primary)' }}><Plus size={14} /> Nueva ruta</button>
            <div className="space-y-2">
              {routes.map(r => (
                <button key={r.id} onClick={() => loadRoutePoints(r.id)}
                  className="glass-card p-3 w-full text-left flex items-center gap-2"
                  style={{ borderColor: selRoute === r.id ? 'var(--vp-primary)' : 'var(--vp-border-card)' }}>
                  <MapPin size={14} style={{ color: 'var(--vp-mod-presencia)' }} />
                  <span style={{ color: 'var(--vp-text-heading)' }}>{r.name}</span>
                </button>
              ))}
            </div>
          </div>
          {selRoute && (
            <div>
              <p className="text-sm font-semibold mb-2" style={{ color: 'var(--vp-text-heading)' }}>Puntos de la ruta</p>
              {routePoints.map(rp => (
                <div key={rp.id} className="glass-card p-3 mb-2 flex items-center justify-between">
                  <span className="text-sm">{rp.point_name} ({rp.device_id})</span>
                  <button onClick={async () => { await apiFetch(`/access-plans/routes/${selRoute}/points/${rp.id}`, { method: 'DELETE' }); loadRoutePoints(selRoute) }}><Trash2 size={12} className="text-red-500" /></button>
                </div>
              ))}
              <div className="flex gap-2 mt-2">
                <select id="rp-ap" className="border rounded-md px-2 py-1 text-sm flex-1" style={{ background: 'var(--vp-bg-card)', borderColor: 'var(--vp-border-card)' }}>
                  {accessPoints.map(ap => <option key={ap.id} value={ap.id}>{ap.name}</option>)}
                </select>
                <button onClick={async () => {
                  const access_point_id = (document.getElementById('rp-ap') as HTMLSelectElement).value
                  await apiFetch(`/access-plans/routes/${selRoute}/points`, { method: 'POST', body: JSON.stringify({ access_point_id }) })
                  loadRoutePoints(selRoute)
                }} className="px-3 py-1 rounded-md text-white text-sm" style={{ background: 'var(--vp-primary)' }}>Añadir</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Schedules tab */}
      {tab === 'schedules' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <button onClick={createSchedule} className="flex items-center gap-1 px-3 py-2 rounded-md text-white text-sm mb-3" style={{ background: 'var(--vp-primary)' }}><Plus size={14} /> Nuevo horario</button>
            <div className="space-y-2">
              {schedules.map(s => (
                <button key={s.id} onClick={() => loadSlots(s.id)}
                  className="glass-card p-3 w-full text-left flex items-center gap-2"
                  style={{ borderColor: selSchedule === s.id ? 'var(--vp-primary)' : 'var(--vp-border-card)' }}>
                  <Clock size={14} style={{ color: 'var(--vp-mod-equipamientos)' }} />
                  <span style={{ color: 'var(--vp-text-heading)' }}>{s.name}</span>
                </button>
              ))}
            </div>
          </div>
          {selSchedule && (
            <div>
              <p className="text-sm font-semibold mb-2" style={{ color: 'var(--vp-text-heading)' }}>Slots</p>
              {slots.map(s => (
                <div key={s.id} className="glass-card p-3 mb-2 flex items-center justify-between">
                  <span className="text-sm">{DAYS[s.day_of_week]} {s.time_from}–{s.time_to}</span>
                  <button onClick={async () => { await apiFetch(`/access-plans/schedules/${selSchedule}/slots/${s.id}`, { method: 'DELETE' }); loadSlots(selSchedule) }}><Trash2 size={12} className="text-red-500" /></button>
                </div>
              ))}
              <div className="flex gap-2 mt-2">
                <select id="sl-dow" className="border rounded-md px-2 py-1 text-sm" style={{ background: 'var(--vp-bg-card)', borderColor: 'var(--vp-border-card)' }}>
                  {[1,2,3,4,5,6,7].map(d => <option key={d} value={d}>{DAYS[d]}</option>)}
                </select>
                <input id="sl-from" type="time" defaultValue="08:00" className="border rounded-md px-2 py-1 text-sm" style={{ background: 'var(--vp-bg-card)', borderColor: 'var(--vp-border-card)' }} />
                <input id="sl-to" type="time" defaultValue="20:00" className="border rounded-md px-2 py-1 text-sm" style={{ background: 'var(--vp-bg-card)', borderColor: 'var(--vp-border-card)' }} />
                <button onClick={async () => {
                  const day_of_week = Number((document.getElementById('sl-dow') as HTMLSelectElement).value)
                  const time_from = (document.getElementById('sl-from') as HTMLInputElement).value
                  const time_to = (document.getElementById('sl-to') as HTMLInputElement).value
                  await apiFetch(`/access-plans/schedules/${selSchedule}/slots`, { method: 'POST', body: JSON.stringify({ day_of_week, time_from, time_to }) })
                  loadSlots(selSchedule)
                }} className="px-3 py-1 rounded-md text-white text-sm" style={{ background: 'var(--vp-primary)' }}>Añadir</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Assign tab */}
      {tab === 'assign' && (
        <div>
          <p className="text-sm mb-3" style={{ color: 'var(--vp-text-muted)' }}>Asignar plan a personas</p>
          <div className="glass-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr style={{ background: 'var(--vp-table-header-bg)' }}>
                <th className="px-4 py-3 text-left text-xs uppercase" style={{ color: 'var(--vp-text-muted)' }}>Persona</th>
                <th className="px-4 py-3 text-left text-xs uppercase" style={{ color: 'var(--vp-text-muted)' }}>Plan actual</th>
                <th className="px-4 py-3 text-left text-xs uppercase" style={{ color: 'var(--vp-text-muted)' }}>Accion</th>
              </tr></thead>
              <tbody>
                {persons.map(p => (
                  <tr key={p.id} className="border-t" style={{ borderColor: 'var(--vp-border-divider)' }}>
                    <td className="px-4 py-3" style={{ color: 'var(--vp-text-heading)' }}>{p.first_name} {p.last_name}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--vp-text-body)' }}>{plans.find(pl => pl.id === p.plan_id)?.name || 'Sin plan'}</td>
                    <td className="px-4 py-3">
                      <select defaultValue={p.plan_id || ''} onChange={async (e) => {
                        await apiFetch(`/access-plans/persons/${p.id}/plan`, { method: 'PATCH', body: JSON.stringify({ plan_id: e.target.value || null }) })
                        loadAll()
                      }} className="border rounded-md px-2 py-1 text-sm" style={{ background: 'var(--vp-bg-card)', borderColor: 'var(--vp-border-card)' }}>
                        <option value="">Sin plan</option>
                        {plans.map(pl => <option key={pl.id} value={pl.id}>{pl.name}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
