import { useEffect, useState, useCallback } from 'react'
import { apiFetch } from '../api/client'
import { Plus, Search, UserPlus, Pencil, Trash2 } from 'lucide-react'

interface PersonRow {
  id: string; first_name: string; last_name: string; dni: string; email: string; phone: string;
  node_id: string; node_name: string; user_id?: string; username?: string; user_role?: string; user_active?: boolean
}

function avatarClass(name: string) {
  let hash = 0
  for (const c of name) hash = (hash + c.charCodeAt(0)) % 10
  return `relleno${hash}`
}

export default function ClientesPage() {
  const [data, setData] = useState<PersonRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ first_name: '', last_name: '', dni: '', email: '', phone: '', node_id: '' })
  const [userForm, setUserForm] = useState<{ personId: string; username: string; password: string; role: string } | null>(null)

  const load = useCallback(async () => {
    const res = await apiFetch<{ data: PersonRow[]; total: number }>(`/clients?page=${page}&limit=20&q=${q}&role=${roleFilter}`)
    setData(res.data); setTotal(res.total)
  }, [page, q, roleFilter])

  useEffect(() => { load() }, [load])

  const resetForm = () => { setForm({ first_name: '', last_name: '', dni: '', email: '', phone: '', node_id: '' }); setEditId(null); setShowForm(false) }

  const handleSubmit = async () => {
    if (editId) {
      await apiFetch(`/persons/${editId}`, { method: 'PATCH', body: JSON.stringify(form) })
    } else {
      await apiFetch('/persons', { method: 'POST', body: JSON.stringify(form) })
    }
    resetForm(); load()
  }

  const handleCreateUser = async () => {
    if (!userForm) return
    await apiFetch(`/clients/${userForm.personId}/user`, { method: 'POST', body: JSON.stringify(userForm) })
    setUserForm(null); load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar persona?')) return
    await apiFetch(`/persons/${id}`, { method: 'DELETE' })
    load()
  }

  const startEdit = (p: PersonRow) => {
    setForm({ first_name: p.first_name, last_name: p.last_name, dni: p.dni || '', email: p.email || '', phone: p.phone || '', node_id: p.node_id || '' })
    setEditId(p.id); setShowForm(true)
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold" style={{ color: 'var(--vp-text-heading)' }}>Usuarios</h2>
        <button onClick={() => { resetForm(); setShowForm(true) }} className="flex items-center gap-1 px-3 py-2 rounded-md text-white text-sm" style={{ background: 'var(--vp-primary)' }}>
          <Plus size={14} /> Nueva persona
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-2.5" style={{ color: 'var(--vp-text-muted)' }} />
          <input placeholder="Buscar por nombre, DNI, email..." value={q} onChange={e => { setQ(e.target.value); setPage(1) }}
            className="w-full pl-8 pr-3 py-2 rounded-md border text-sm" style={{ background: 'var(--vp-bg-card)', borderColor: 'var(--vp-border-card)' }} />
        </div>
        <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1) }}
          className="border rounded-md px-3 py-2 text-sm" style={{ background: 'var(--vp-bg-card)', borderColor: 'var(--vp-border-card)' }}>
          <option value="">Todos</option>
          <option value="superadmin">Superadmin</option>
          <option value="admin">Admin</option>
          <option value="usuario">Usuario</option>
          <option value="sin_cuenta">Sin cuenta</option>
        </select>
      </div>

      {/* Create/Edit form */}
      {showForm && (
        <div className="glass-card p-4 mb-4 space-y-3">
          <p className="text-sm font-semibold" style={{ color: 'var(--vp-text-heading)' }}>{editId ? 'Editar persona' : 'Nueva persona'}</p>
          <div className="grid grid-cols-3 gap-3">
            <input placeholder="Nombre" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} className="border rounded-md px-3 py-2 text-sm" style={{ background: 'var(--vp-bg-card)', borderColor: 'var(--vp-border-card)' }} />
            <input placeholder="Apellidos" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} className="border rounded-md px-3 py-2 text-sm" style={{ background: 'var(--vp-bg-card)', borderColor: 'var(--vp-border-card)' }} />
            <input placeholder="DNI" value={form.dni} onChange={e => setForm({ ...form, dni: e.target.value })} className="border rounded-md px-3 py-2 text-sm" style={{ background: 'var(--vp-bg-card)', borderColor: 'var(--vp-border-card)' }} />
            <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="border rounded-md px-3 py-2 text-sm" style={{ background: 'var(--vp-bg-card)', borderColor: 'var(--vp-border-card)' }} />
            <input placeholder="Telefono" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="border rounded-md px-3 py-2 text-sm" style={{ background: 'var(--vp-bg-card)', borderColor: 'var(--vp-border-card)' }} />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSubmit} className="px-4 py-2 rounded-md text-white text-sm" style={{ background: 'var(--vp-primary)' }}>{editId ? 'Guardar' : 'Crear'}</button>
            <button onClick={resetForm} className="px-4 py-2 rounded-md text-sm" style={{ background: 'var(--vp-gray-100)' }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Create user modal */}
      {userForm && (
        <div className="glass-card p-4 mb-4 space-y-3">
          <p className="text-sm font-semibold" style={{ color: 'var(--vp-text-heading)' }}>Crear cuenta de usuario</p>
          <div className="grid grid-cols-3 gap-3">
            <input placeholder="Username" value={userForm.username} onChange={e => setUserForm({ ...userForm, username: e.target.value })} className="border rounded-md px-3 py-2 text-sm" style={{ background: 'var(--vp-bg-card)', borderColor: 'var(--vp-border-card)' }} />
            <input type="password" placeholder="Password" value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} className="border rounded-md px-3 py-2 text-sm" style={{ background: 'var(--vp-bg-card)', borderColor: 'var(--vp-border-card)' }} />
            <select value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })} className="border rounded-md px-3 py-2 text-sm" style={{ background: 'var(--vp-bg-card)', borderColor: 'var(--vp-border-card)' }}>
              <option value="usuario">Usuario</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Superadmin</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreateUser} className="px-4 py-2 rounded-md text-white text-sm" style={{ background: 'var(--vp-primary)' }}>Crear usuario</button>
            <button onClick={() => setUserForm(null)} className="px-4 py-2 rounded-md text-sm" style={{ background: 'var(--vp-gray-100)' }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="glass-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--vp-table-header-bg)' }}>
              <th className="px-4 py-3 text-left font-medium text-xs uppercase" style={{ color: 'var(--vp-text-muted)' }}>Persona</th>
              <th className="px-4 py-3 text-left font-medium text-xs uppercase" style={{ color: 'var(--vp-text-muted)' }}>DNI</th>
              <th className="px-4 py-3 text-left font-medium text-xs uppercase" style={{ color: 'var(--vp-text-muted)' }}>Email</th>
              <th className="px-4 py-3 text-left font-medium text-xs uppercase" style={{ color: 'var(--vp-text-muted)' }}>Zona</th>
              <th className="px-4 py-3 text-left font-medium text-xs uppercase" style={{ color: 'var(--vp-text-muted)' }}>Cuenta</th>
              <th className="px-4 py-3 text-left font-medium text-xs uppercase" style={{ color: 'var(--vp-text-muted)' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data.map(p => {
              const name = `${p.first_name} ${p.last_name}`
              const initials = `${p.first_name[0]}${p.last_name[0]}`.toUpperCase()
              return (
                <tr key={p.id} className="border-t" style={{ borderColor: 'var(--vp-border-divider)' }}>
                  <td className="px-4 py-3 flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${avatarClass(name)}`}>{initials}</div>
                    <span style={{ color: 'var(--vp-text-heading)' }}>{name}</span>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--vp-text-body)' }}>{p.dni || '—'}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--vp-text-body)' }}>{p.email || '—'}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--vp-text-body)' }}>{p.node_name || '—'}</td>
                  <td className="px-4 py-3">
                    {p.user_id ? (
                      <span className="badge-status in">{p.user_role}</span>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--vp-text-muted)' }}>Sin cuenta</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => startEdit(p)} className="p-1 rounded hover:bg-black/5"><Pencil size={14} /></button>
                      {!p.user_id && <button onClick={() => setUserForm({ personId: p.id, username: '', password: '', role: 'usuario' })} className="p-1 rounded hover:bg-black/5"><UserPlus size={14} /></button>}
                      <button onClick={() => handleDelete(p.id)} className="p-1 rounded hover:bg-red-50"><Trash2 size={14} className="text-red-500" /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {data.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center" style={{ color: 'var(--vp-text-muted)' }}>Sin resultados</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} onClick={() => setPage(i + 1)}
              className="px-3 py-1 rounded-md text-sm"
              style={{ background: page === i + 1 ? 'var(--vp-primary)' : 'var(--vp-gray-100)', color: page === i + 1 ? 'white' : 'var(--vp-text-body)' }}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
