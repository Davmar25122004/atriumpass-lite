import { useEffect, useState, useCallback } from 'react'
import { apiFetch } from '../api/client'
import { Plus, Trash2, Shield } from 'lucide-react'

interface Permission {
  id: string; person_id: string; first_name: string; last_name: string;
  access_point_id: string; point_name: string; direction: string;
  anti_passback: string; valid_from: string; valid_until: string
}
interface Person { id: string; first_name: string; last_name: string }
interface AP { id: string; name: string }

export default function PermisosPage() {
  const [perms, setPerms] = useState<Permission[]>([])
  const [persons, setPersons] = useState<Person[]>([])
  const [aps, setAps] = useState<AP[]>([])
  const [personFilter, setPersonFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ person_id: '', access_point_id: '', direction: 'ambas', anti_passback: 'none', valid_from: '', valid_until: '' })

  const load = useCallback(async () => {
    const params = personFilter ? `?person_id=${personFilter}` : ''
    setPerms(await apiFetch(`/access-permissions${params}`))
  }, [personFilter])

  useEffect(() => {
    load()
    apiFetch<{ data: Person[] }>('/persons?limit=200').then(r => setPersons(r.data))
    apiFetch<{ data: AP[] }>('/access-points?limit=200').then(r => setAps(r.data))
  }, [load])

  const handleSubmit = async () => {
    await apiFetch('/access-permissions', { method: 'POST', body: JSON.stringify(form) })
    setShowForm(false); load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar permiso?')) return
    await apiFetch(`/access-permissions/${id}`, { method: 'DELETE' }); load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold" style={{ color: 'var(--vp-text-heading)' }}>Permisos Directos</h2>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1 px-3 py-2 rounded-md text-white text-sm" style={{ background: 'var(--vp-primary)' }}>
          <Plus size={14} /> Nuevo permiso
        </button>
      </div>

      <div className="mb-4">
        <select value={personFilter} onChange={e => setPersonFilter(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm" style={{ background: 'var(--vp-bg-card)', borderColor: 'var(--vp-border-card)' }}>
          <option value="">Todas las personas</option>
          {persons.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
        </select>
      </div>

      {showForm && (
        <div className="glass-card p-4 mb-4 grid grid-cols-3 gap-3">
          <select value={form.person_id} onChange={e => setForm({ ...form, person_id: e.target.value })}
            className="border rounded-md px-3 py-2 text-sm" style={{ background: 'var(--vp-bg-card)', borderColor: 'var(--vp-border-card)' }}>
            <option value="">Persona...</option>
            {persons.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
          </select>
          <select value={form.access_point_id} onChange={e => setForm({ ...form, access_point_id: e.target.value })}
            className="border rounded-md px-3 py-2 text-sm" style={{ background: 'var(--vp-bg-card)', borderColor: 'var(--vp-border-card)' }}>
            <option value="">Punto de acceso...</option>
            {aps.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <select value={form.direction} onChange={e => setForm({ ...form, direction: e.target.value })}
            className="border rounded-md px-3 py-2 text-sm" style={{ background: 'var(--vp-bg-card)', borderColor: 'var(--vp-border-card)' }}>
            <option value="ambas">Ambas</option><option value="entrada">Entrada</option><option value="salida">Salida</option>
          </select>
          <select value={form.anti_passback} onChange={e => setForm({ ...form, anti_passback: e.target.value })}
            className="border rounded-md px-3 py-2 text-sm" style={{ background: 'var(--vp-bg-card)', borderColor: 'var(--vp-border-card)' }}>
            <option value="none">Sin anti-passback</option><option value="local">Local</option><option value="daily">Diario</option><option value="temporal">Temporal</option>
          </select>
          <input type="date" placeholder="Desde" value={form.valid_from} onChange={e => setForm({ ...form, valid_from: e.target.value })}
            className="border rounded-md px-3 py-2 text-sm" style={{ background: 'var(--vp-bg-card)', borderColor: 'var(--vp-border-card)' }} />
          <input type="date" placeholder="Hasta" value={form.valid_until} onChange={e => setForm({ ...form, valid_until: e.target.value })}
            className="border rounded-md px-3 py-2 text-sm" style={{ background: 'var(--vp-bg-card)', borderColor: 'var(--vp-border-card)' }} />
          <div className="flex gap-2 col-span-3">
            <button onClick={handleSubmit} className="px-4 py-2 rounded-md text-white text-sm" style={{ background: 'var(--vp-primary)' }}>Crear</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-md text-sm" style={{ background: 'var(--vp-gray-100)' }}>Cancelar</button>
          </div>
        </div>
      )}

      <div className="glass-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr style={{ background: 'var(--vp-table-header-bg)' }}>
            <th className="px-4 py-3 text-left text-xs uppercase" style={{ color: 'var(--vp-text-muted)' }}>Persona</th>
            <th className="px-4 py-3 text-left text-xs uppercase" style={{ color: 'var(--vp-text-muted)' }}>Punto</th>
            <th className="px-4 py-3 text-left text-xs uppercase" style={{ color: 'var(--vp-text-muted)' }}>Direccion</th>
            <th className="px-4 py-3 text-left text-xs uppercase" style={{ color: 'var(--vp-text-muted)' }}>Anti-PB</th>
            <th className="px-4 py-3 text-left text-xs uppercase" style={{ color: 'var(--vp-text-muted)' }}>Valido</th>
            <th className="px-4 py-3 text-left text-xs uppercase" style={{ color: 'var(--vp-text-muted)' }}>Accion</th>
          </tr></thead>
          <tbody>
            {perms.map(p => (
              <tr key={p.id} className="border-t" style={{ borderColor: 'var(--vp-border-divider)' }}>
                <td className="px-4 py-3" style={{ color: 'var(--vp-text-heading)' }}>{p.first_name} {p.last_name}</td>
                <td className="px-4 py-3" style={{ color: 'var(--vp-text-body)' }}>{p.point_name}</td>
                <td className="px-4 py-3"><span className="badge-status in">{p.direction}</span></td>
                <td className="px-4 py-3" style={{ color: 'var(--vp-text-body)' }}>{p.anti_passback}</td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--vp-text-muted)' }}>{p.valid_from || '∞'} → {p.valid_until || '∞'}</td>
                <td className="px-4 py-3"><button onClick={() => handleDelete(p.id)} className="p-1 rounded hover:bg-red-50"><Trash2 size={14} className="text-red-500" /></button></td>
              </tr>
            ))}
            {perms.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center" style={{ color: 'var(--vp-text-muted)' }}>Sin permisos directos</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
