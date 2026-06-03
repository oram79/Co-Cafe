import { useState } from 'react'
import { X } from 'lucide-react'
import { useApp } from '../context/AppContext'

const CATEGORIES = [
  'Baked Goods',
  'Pantry Items',
  'Cafe Supplies',
  'Food Items',
  'Canned Drinks'
]

const BLANK = {
  name: '',
  category: 'Cafe Supplies',
  quantity: 0,
  unit: 'items',
  lowStockAt: 2,
  price: 0,
  notes: '',
  trackedInSales: false,
}

export default function AddItemModal({ onClose }) {
  const { addInventoryItem } = useApp()
  const [form, setForm] = useState(BLANK)
  const [error, setError] = useState('')

  const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }))

  function handleAdd() {
    if (!form.name.trim()) { setError('Item name is required.'); return }
    addInventoryItem({
      ...form,
      quantity: Number(form.quantity),
      lowStockAt: Number(form.lowStockAt),
      price: Number(form.price),
    })
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">

        <div className="modal-header">
          <h3 style={{ fontFamily: 'var(--font-display)' }}>Add Inventory Item</h3>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s4)' }}>

          <div>
            <label className="label">Item Name *</label>
            <input
              className="input-field"
              value={form.name}
              onChange={e => { set('name', e.target.value); setError('') }}
              placeholder="e.g. Oat Milk 1L"
              autoFocus
            />
            {error && <p style={{ color: 'var(--danger)', fontSize: '0.78rem', marginTop: 4 }}>{error}</p>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--s3)' }}>
            <div>
              <label className="label">Category</label>
              <select className="select-field" value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Unit</label>
              <input className="input-field" value={form.unit} onChange={e => set('unit', e.target.value)} placeholder="items, cans, bags…" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--s3)' }}>
            <div>
              <label className="label">Starting Qty</label>
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
              placeholder="Supplier, reorder notes…"
              style={{ resize: 'vertical' }}
            />
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

        <div className="divider" />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--s2)' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleAdd}>Add Item</button>
        </div>

      </div>
    </div>
  )
}