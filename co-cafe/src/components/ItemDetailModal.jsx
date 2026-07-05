import { useState } from 'react'
import { X, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'

function expiryStatus(dateStr) {
  if (!dateStr) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const exp   = new Date(dateStr); exp.setHours(0, 0, 0, 0)
  const days  = Math.round((exp - today) / 86400000)
  if (days < 0)  return { label: 'Expired',       color: 'var(--danger)',  bg: 'rgba(184,64,64,0.1)' }
  if (days === 0) return { label: 'Expires today', color: 'var(--danger)',  bg: 'rgba(184,64,64,0.1)' }
  if (days <= 3)  return { label: `${days} day${days > 1 ? 's' : ''} left`, color: 'var(--danger)',  bg: 'rgba(184,64,64,0.08)' }
  if (days <= 7)  return { label: `${days} days`,  color: 'var(--accent)',  bg: 'rgba(196,129,58,0.1)' }
  return { label: `${days} days`, color: 'var(--success)', bg: 'rgba(74,124,89,0.08)' }
}

const CATEGORIES = [
  'Baked Goods',
  'Pantry Items',
  'Cafe Supplies',
  'Food Items',
  'Canned Drinks'
]

export default function ItemDetailModal({ item, onClose }) {
  const { updateInventoryItem, deleteInventoryItem } = useApp()
  const [form, setForm] = useState({ ...item })
  const [confirmDelete, setConfirmDelete] = useState(false)

  const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }))

  function handleSave() {
    updateInventoryItem(item.id, {
      ...form,
      quantity: Number(form.quantity),
      lowStockAt: Number(form.lowStockAt),
      price: Number(form.price),
    })
    onClose()
  }

  function handleDelete() {
    deleteInventoryItem(item.id)
    onClose()
  }

  const isLow = item.quantity <= item.lowStockAt

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">

        {/* Header */}
        <div className="modal-header">
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)' }}>{item.name}</h3>
            <span className={`badge ${isLow ? 'badge-danger' : 'badge-success'}`} style={{ marginTop: 4 }}>
              {isLow ? 'Low Stock' : 'In Stock'}
            </span>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Form fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s4)' }}>

          <div>
            <label className="label">Item Name</label>
            <input className="input-field" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--s3)' }}>
            <div>
              <label className="label">Category</label>
              <select className="select-field" value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                {!CATEGORIES.includes(form.category) && <option>{form.category}</option>}
              </select>
            </div>
            <div>
              <label className="label">Unit</label>
              <input className="input-field" value={form.unit} onChange={e => set('unit', e.target.value)} placeholder="items, cans, bags…" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--s3)' }}>
            <div>
              <label className="label">Qty in Stock</label>
              <input className="input-field" type="number" min="0" value={form.quantity} onChange={e => set('quantity', e.target.value)} />
            </div>
            <div>
              <label className="label">Low Stock At</label>
              <input className="input-field" type="number" min="0" value={form.lowStockAt} onChange={e => set('lowStockAt', e.target.value)} />
            </div>
            <div>
              <label className="label">Sale Price ($)</label>
              <input className="input-field" type="number" min="0" step="0.25" value={form.price} onChange={e => set('price', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea
              className="input-field"
              rows={2}
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Supplier info, reorder notes…"
              style={{ resize: 'vertical' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--s2)' }}>
              <label className="label" style={{ margin: 0 }}>
                Expiry Date
                <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--text-muted)', marginLeft: 6 }}>
                  — optional
                </span>
              </label>
              {expiryStatus(form.expiryDate) && (() => {
                const s = expiryStatus(form.expiryDate)
                return (
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 700,
                    padding: '2px 8px', borderRadius: 'var(--r-pill)',
                    background: s.bg, color: s.color,
                  }}>
                    {s.label}
                  </span>
                )
              })()}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s2)' }}>
              <input
                className="input-field"
                type="date"
                value={form.expiryDate || ''}
                onChange={e => set('expiryDate', e.target.value)}
                style={{ flex: 1 }}
              />
              {form.expiryDate && (
                <button
                  onClick={() => set('expiryDate', '')}
                  title="Clear expiry date"
                  style={{
                    padding: '8px 10px', borderRadius: 'var(--r2)',
                    border: '1px solid var(--border)', background: 'transparent',
                    color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem',
                    transition: 'all var(--t-fast)', whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.borderColor = 'rgba(184,64,64,0.4)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={form.trackedInSales}
              onChange={e => set('trackedInSales', e.target.checked)}
            />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Deduct from inventory when sold (link to sales)
            </span>
          </label>

        </div>

        {/* Footer actions */}
        <div className="divider" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {confirmDelete ? (
            <div style={{ display: 'flex', gap: 'var(--s2)', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>Delete this item?</span>
              <button className="btn btn-danger btn-sm" onClick={handleDelete}>Yes, delete</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDelete(false)}>Cancel</button>
            </div>
          ) : (
            <button
              className="btn-icon danger"
              onClick={() => setConfirmDelete(true)}
              title="Delete item"
            >
              <Trash2 size={15} />
            </button>
          )}
          <div style={{ display: 'flex', gap: 'var(--s2)' }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
          </div>
        </div>

      </div>
    </div>
  )
}