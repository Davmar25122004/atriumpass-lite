import { useEffect, useState, useCallback } from 'react'
import { apiFetch } from '../api/client'
import TreeNode from '../components/TreeNode'
import Breadcrumb from '../components/Breadcrumb'
import { Plus, RefreshCw } from 'lucide-react'

interface TreeNodeData {
  id: string; name: string; type_id?: string; type_label?: string; type_color?: string;
  type_light_color?: string; path_id?: string; parent_id?: string; children: TreeNodeData[]
}
interface ContainerType { id: string; label: string; color: string; light_color: string }

export default function OrgPage() {
  const [tree, setTree] = useState<TreeNodeData[]>([])
  const [types, setTypes] = useState<ContainerType[]>([])
  const [selected, setSelected] = useState<TreeNodeData | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editNode, setEditNode] = useState<TreeNodeData | null>(null)
  const [parentForNew, setParentForNew] = useState<string | null>(null)
  const [form, setForm] = useState({ id: '', name: '', type_id: '' })

  const loadTree = useCallback(async () => {
    const data = await apiFetch<TreeNodeData[]>('/instances/tree/nested')
    setTree(data)
  }, [])

  useEffect(() => { loadTree(); apiFetch<ContainerType[]>('/types').then(setTypes) }, [loadTree])

  const resetForm = () => { setForm({ id: '', name: '', type_id: '' }); setShowForm(false); setEditNode(null); setParentForNew(null) }

  const handleCreateChild = (parentId: string) => {
    setParentForNew(parentId); setEditNode(null)
    setForm({ id: '', name: '', type_id: '' }); setShowForm(true)
  }

  const handleEdit = (node: TreeNodeData) => {
    setEditNode(node); setParentForNew(null)
    setForm({ id: node.id, name: node.name, type_id: node.type_id || '' }); setShowForm(true)
  }

  const handleDelete = async (node: TreeNodeData) => {
    if (!confirm(`Eliminar "${node.name}" y todos sus hijos?`)) return
    await apiFetch(`/instances/${node.id}`, { method: 'DELETE' })
    if (selected?.id === node.id) setSelected(null)
    loadTree()
  }

  const handleSubmit = async () => {
    if (editNode) {
      await apiFetch(`/instances/${editNode.id}`, { method: 'PATCH', body: JSON.stringify({ name: form.name, type_id: form.type_id || null }) })
    } else {
      await apiFetch('/instances', { method: 'POST', body: JSON.stringify({ id: form.id, name: form.name, type_id: form.type_id || null, parent_id: parentForNew }) })
    }
    resetForm(); loadTree()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold" style={{ color: 'var(--vp-text-heading)' }}>Organigrama</h2>
        <div className="flex gap-2">
          <button onClick={loadTree} className="p-2 rounded-md" style={{ background: 'var(--vp-gray-100)' }}><RefreshCw size={16} /></button>
          <button onClick={() => { resetForm(); setShowForm(true) }} className="flex items-center gap-1 px-3 py-2 rounded-md text-white text-sm" style={{ background: 'var(--vp-primary)' }}>
            <Plus size={14} /> Nuevo nodo raiz
          </button>
        </div>
      </div>

      {selected?.path_id && <div className="mb-3"><Breadcrumb pathId={selected.path_id} /></div>}

      {showForm && (
        <div className="glass-card p-4 mb-4 space-y-3">
          <p className="text-sm font-semibold" style={{ color: 'var(--vp-text-heading)' }}>
            {editNode ? `Editar: ${editNode.name}` : parentForNew ? `Nuevo hijo de: ${parentForNew}` : 'Nuevo nodo raiz'}
          </p>
          <div className="grid grid-cols-3 gap-3">
            {!editNode && <input placeholder="ID (unico)" value={form.id} onChange={e => setForm({ ...form, id: e.target.value })}
              className="border rounded-md px-3 py-2 text-sm" style={{ background: 'var(--vp-bg-card)', borderColor: 'var(--vp-border-card)' }} />}
            <input placeholder="Nombre" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="border rounded-md px-3 py-2 text-sm" style={{ background: 'var(--vp-bg-card)', borderColor: 'var(--vp-border-card)' }} />
            <select value={form.type_id} onChange={e => setForm({ ...form, type_id: e.target.value })}
              className="border rounded-md px-3 py-2 text-sm" style={{ background: 'var(--vp-bg-card)', borderColor: 'var(--vp-border-card)' }}>
              <option value="">Sin tipo</option>
              {types.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSubmit} className="px-4 py-2 rounded-md text-white text-sm" style={{ background: 'var(--vp-primary)' }}>
              {editNode ? 'Guardar' : 'Crear'}
            </button>
            <button onClick={resetForm} className="px-4 py-2 rounded-md text-sm" style={{ background: 'var(--vp-gray-100)', color: 'var(--vp-text-body)' }}>Cancelar</button>
          </div>
        </div>
      )}

      <div className="glass-card p-2">
        {tree.length === 0 ? (
          <p className="text-center py-8" style={{ color: 'var(--vp-text-muted)' }}>Sin zonas. Crea el primer nodo raiz.</p>
        ) : (
          tree.map(node => (
            <TreeNode key={node.id} node={node} level={0} onSelect={setSelected} selectedId={selected?.id}
              onCreateChild={handleCreateChild} onEdit={handleEdit} onDelete={handleDelete} />
          ))
        )}
      </div>
    </div>
  )
}
