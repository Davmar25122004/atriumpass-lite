import { useEffect, useState, useCallback } from 'react'
import { apiFetch } from '../api/client'
import { Plus, Search, Pencil, Trash2, DoorOpen } from 'lucide-react'

interface AccessPoint {
  id: string; name: string; node_id: string; node_name: string; path_id: string;
  direction: string; device_type: string; entry_method: string; exit_method: string;
  device_id: string; relay_duration_ms: number; active: boolean
}
interface Zone { id: string; name: string; path_id: string }
interface Method { key: string; label: string }

const dirColors: Record<string, { bg: string; text: string }> = {
  entrada: { bg: 'var(--vp-status-in-bg)', text: 'var(--vp-status-in-text)' },
  salida: { bg: 'var(--vp-status-out-bg)', text: 'var(--vp-status-out-text)' },
  ambas: { bg: 'var(--vp-status-inc-bg)', text: 'var(--vp-status-inc-text)' },
}
const typeIcons: Record<string, string> = { puerta: '🚪', barrera: '🚧', torno: '🔄' }

export default function AccesosPage() {
  const [data, setData] = useState<AccessPoint[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [methods, setMethods] = useState<Method[]>([])
  const [q, setQ] = useState('')
  const [zoneFilter, setZoneFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ node_id: '', name: '', direction: 'ambas', device_type: 'puerta', entry_method: 'nfc', exit_method: 'nfc', device_id: '', relay_duration_ms: 5000 })

  const load = useCallback(async () => {
    const path = zoneFilter || undefined
    const res = await apiFetch<{ data: AccessPoint[] }>(`/access-points?q=${q}&limit=50${path ? `&path=${path}` : ''}`)
    setData(res.data)
  }, [q, zoneFilter])

  useEffect(() => { load(); apiFetch<Zone[]>('/instances').then(setZones); apiFetch<Method[]>('/access-methods').then(setMethods) }, [load])

  const resetForm = () => { setForm({ node_id: '', name: '', direction: 'ambas', device_type: 'puerta', entry_method: 'nfc', exit_method: 'nfc', device_id: '', relay_duration_ms: 5000 }); setEditId(null); setShowForm(false) }

  const handleSubmit = async () => {
    if (editId) {
      await apiFetch(`/access-points/${editId}`, { method: 'PATCH', body: JSON.stringify(form) })
    } else {
      await apiFetch('/access-points', { method: 'POST', body: JSON.stringify(form) })
    }
    resetForm(); load()
  }

  const startEdit = (ap: AccessPoint) => {
    setForm({ node_id: ap.node_id, name: ap.name, direction: ap.direction, device_type: ap.device_type, entry_method: ap.entry_method, exit_method: ap.exit_method, device_id: ap.device_id || '', relay_duration_ms: ap.relay_duration_ms })
    setEditId(ap.id); setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar punto de acceso?')) return
    await apiFetch(`/access-points/${id}`, { method: 'DELETE' }); load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold" style={{ color: 'var(--vp-text-heading)' }}>Puntos de Acceso</h2>
        <button onClick={() => { resetForm(); setShowForm(true) }} className="flex items-center gap-1 px-3 py-2 rounded-md text-white text-sm" style={{ background: 'var(--vp-primary)' }}>
          <Plus size={14} /> Nuevo punto
        </button>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-2.5" style={{ color: 'var(--vp-text-muted)' }} />
          <input placeholder="Buscar por nombre o device_id..." value={q} onChange={e => setQ(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-md border text-sm" style={{ background: 'var(--vp-bg-card)', borderColor: 'var(--vp-border-card)' }} />
        </div>
        <select value={zoneFilter} onChange={e => setZoneFilter(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm" style={{ background: 'var(--vp-bg-card)', borderColor: 'var(--vp-border-card)' }}>
          <option value="">Todas las zonas</option>
          {zones.map(z => <option key={z.id} value={z.path_id}>{z.name}</option>)}
        </select>
      </div>

      {showForm && (
        <div className="glass-card p-4 mb-4 space-y-3">
          <p className="text-sm font-semibold" style={{ color: 'var(--vp-text-heading)' }}>{editId ? 'Editar punto' : 'Nuevo punto de acceso'}</p>
          <div className="grid grid-cols-3 gap-3">
            <input placeholder="Nombre" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="border rounded-md px-3 py-2 text-sm" style={{ background: 'var(--vp-bg-card)', borderColor: 'var(--vp-border-card)' }} />
            <select value={form.node_id} onChange={e => setForm({ ...form, node_id: e.target.value })} className="border rounded-md px-3 py-2 text-sm" style={{ background: 'var(--vp-bg-card)', borderColor: 'var(--vp-border-card)' }}>
              <option value="">Seleccionar zona...</option>
              {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
            <select value={form.direction} onChange={e => setForm({ ...form, direction: e.target.value })} className="border rounded-md px-3 py-2 text-sm" style={{ background: 'var(--vp-bg-card)', borderColor: 'var(--vp-border-card)' }}>
              <option value="ambas">Ambas</option>
              <option value="entrada">Entrada</option>
              <option value="salida">Salida</option>
            </select>
            <select value={form.device_type} onChange={e => setForm({ ...form, device_type: e.target.value })} className="border rounded-md px-3 py-2 text-sm" style={{ background: 'var(--vp-bg-card)', borderColor: 'var(--vp-border-card)' }}>
              <option value="puerta">Puerta</option>
              <option value="barrera">Barrera</option>
              <option value="torno">Torno</option>
            </select>
            <select value={form.entry_method} onChange={e => setForm({ ...form, entry_method: e.target.value })} className="border rounded-md px-3 py-2 text-sm" style={{ background: 'var(--vp-bg-card)', borderColor: 'var(--vp-border-card)' }}>
              <option value="">Metodo entrada</option>
              {methods.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
            </select>
            <select value={form.exit_method} onChange={e => setForm({ ...form, exit_method: e.target.value })} className="border rounded-md px-3 py-2 text-sm" style={{ background: 'var(--vp-bg-card)', borderColor: 'var(--vp-border-card)' }}>
              <option value="">Metodo salida</option>
              {methods.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
            </select>
            <input placeholder="Device ID" value={form.device_id} onChange={e => setForm({ ...form, device_id: e.target.value })} className="border rounded-md px-3 py-2 text-sm" style={{ background: 'var(--vp-bg-card)', borderColor: 'var(--vp-border-card)' }} />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSubmit} className="px-4 py-2 rounded-md text-white text-sm" style={{ background: 'var(--vp-primary)' }}>{editId ? 'Guardar' : 'Crear'}</button>
            <button onClick={resetForm} className="px-4 py-2 rounded-md text-sm" style={{ background: 'var(--vp-gray-100)' }}>Cancelar</button>
          </div>
        </div>
      )}

      <div className="glass-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--vp-table-header-bg)' }}>
              <th className="px-4 py-3 text-left font-medium text-xs uppercase" style={{ color: 'var(--vp-text-muted)' }}>Nombre</th>
              <th className="px-4 py-3 text-left font-medium text-xs uppercase" style={{ color: 'var(--vp-text-muted)' }}>Zona</th>
              <th className="px-4 py-3 text-left font-medium text-xs uppercase" style={{ color: 'var(--vp-text-muted)' }}>Direccion</th>
              <th className="px-4 py-3 text-left font-medium text-xs uppercase" style={{ color: 'var(--vp-text-muted)' }}>Tipo</th>
              <th className="px-4 py-3 text-left font-medium text-xs uppercase" style={{ color: 'var(--vp-text-muted)' }}>Entrada</th>
              <th className="px-4 py-3 text-left font-medium text-xs uppercase" style={{ color: 'var(--vp-text-muted)' }}>Salida</th>
              <th className="px-4 py-3 text-left font-medium text-xs uppercase" style={{ color: 'var(--vp-text-muted)' }}>Device</th>
              <th className="px-4 py-3 text-left font-medium text-xs uppercase" style={{ color: 'var(--vp-text-muted)' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data.map(ap => {
              const dc = dirColors[ap.direction] || dirColors.ambas
              return (
                <tr key={ap.id} className="border-t" style={{ borderColor: 'var(--vp-border-divider)' }}>
                  <td className="px-4 py-3 flex items-center gap-2">
                    <DoorOpen size={14} style={{ color: 'var(--vp-primary)' }} />
                    <span style={{ color: 'var(--vp-text-heading)' }}>{ap.name}</span>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--vp-text-body)' }}>{ap.node_name || '—'}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: dc.bg, color: dc.text }}>{ap.direction}</span></td>
                  <td className="px-4 py-3" style={{ color: 'var(--vp-text-body)' }}>{typeIcons[ap.device_type] || ''} {ap.device_type}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--vp-text-body)' }}>{ap.entry_method}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--vp-text-body)' }}>{ap.exit_method}</td>
                  <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--vp-text-muted)' }}>{ap.device_id || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(ap)} className="p-1 rounded hover:bg-black/5"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(ap.id)} className="p-1 rounded hover:bg-red-50"><Trash2 size={14} className="text-red-500" /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {data.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center" style={{ color: 'var(--vp-text-muted)' }}>Sin puntos de acceso</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
