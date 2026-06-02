import { useState, useMemo } from 'react'
import { X, Plus, Trash2, Edit3, Check } from 'lucide-react'
import { useApp } from '../context/AppContext'

const MENU_CATEGORIES = [
  'Espresso', 'Drip Coffee', 'Tea', 'Pastries', 'Fridge Drinks', 'Food', 'Other',
]

const BLANK = { name: '', category: 'Espresso', price: 0, inventoryId: null }

export default function AddMenuItemModal({ onClose }) {
  const { menu, inventory, addMenuItem, updateMenuItem, deleteMenuItem } = useApp()
  const [view, setView] = useState('list') // 'list' | 'add' | 'edit'
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(BLANK)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const trackableInventory = useMemo(() =>
    inventory.filter(i => i.trackedInSales),
    [inventory]
  )

  function startEdit(item) {
    setEditingId(item.id)
    setForm({ name: item.name, category: item.category, price: item.price, inventoryId: item.inventoryId || null })
    setView('edit')
  }

  function handleAdd() {
    if (!form.name.trim()) { setError('Name required'); return }
    addMenuItem({ ...form, price: Number(form.price), inventoryId: form.inventoryId || null })
    setForm(BLANK)
    setView('list')
  }

  function handleUpdate() {
    if (!form.name.trim()) { setError('Name required'); return }
    updateMenuItem(editingId, { ...form, price: Number(form.price), inventoryId: form.inventoryId || null })
    setView('list')
    setEditingId(null)
  }

  const groupedMenu = useMemo(() => {
    const map = {}
    menu.forEach(item => {
      if (!map[item.category]) map[item.category] = []
      map[item.category].push(item)
    })
    return map
  }, [menu])

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 560 }}>

        <div className="modal-header">
          <h3 style={{ fontFamily: 'var(--font-display)' }}>Menu Management</h3>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        {view === 'list' && (
          <>
            <div style={{ marginBottom: 'var(--s4)' }}>
              <button className="btn btn-primary btn-sm" onClick={() => { setForm(BLANK); setView('add') }}>
                <Plus size={13} /> Add Menu Item
              </button>
            </div>

            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              {Object.entries(groupedMenu).map(([cat, items]) => (
                <div key={cat} style={{ marginBottom: 'var(--s4)' }}>
                  <p style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 'var(--s2)' }}>
                    {cat}
                  </p>
                  {items.map(item => (
                    <div key={item.id} style={{
                      display: 'flex', alignItems: 'center', gap: 'var(--s3)',
                      padding: 'var(--s2) var(--s3)',
                      borderRadius: 'var(--r2)',
                      marginBottom: 2,
                      background: 'var(--latte)',
                    }}>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{item.name}</span>
                        {item.inventoryId && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--success)', marginLeft: 6 }}>
                            ↔ inventory
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>${item.price.toFixed(2)}</span>
                      <button className="btn-icon" style={{ width: 26, height: 26 }} onClick={() => startEdit(item)}><Edit3 size={11} /></button>
                      <button className="btn-icon danger" style={{ width: 26, height: 26 }} onClick={() => deleteMenuItem(item.id)}><Trash2 size={11} /></button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}

        {(view === 'add' || view === 'edit') && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s4)' }}>
              <div>
                <label className="label">Item Name *</label>
                <input className="input-field" value={form.name} onChange={e => { set('name', e.target.value); setError('') }} autoFocus />
                {error && <p style={{ color: 'var(--danger)', fontSize: '0.78rem', marginTop: 4 }}>{error}</p>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--s3)' }}>
                <div>
                  <label className="label">Category</label>
                  <select className="select-field" value={form.category} onChange={e => set('category', e.target.value)}>
                    {MENU_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Price ($)</label>
                  <input className="input-field" type="number" min="0" step="0.25" value={form.price} onChange={e => set('price', e.target.value)} />
                </div>
              </div>

              <div>
                <label className="label">Link to Inventory Item (optional)</label>
                <select
                  className="select-field"
                  value={form.inventoryId || ''}
                  onChange={e => set('inventoryId', e.target.value || null)}
                >
                  <option value="">— None —</option>
                  {trackableInventory.map(i => (
                    <option key={i.id} value={i.id}>{i.name} ({i.quantity} {i.unit})</option>
                  ))}
                </select>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  Selling this item will reduce its inventory stock automatically.
                </p>
              </div>
            </div>

            <div className="divider" />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button className="btn btn-ghost" onClick={() => setView('list')}>← Back</button>
              <button className="btn btn-primary" onClick={view === 'add' ? handleAdd : handleUpdate}>
                <Check size={14} /> {view === 'add' ? 'Add to Menu' : 'Save Changes'}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  )
}