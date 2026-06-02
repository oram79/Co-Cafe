import { useState, useMemo } from 'react'
import { Plus, Search, AlertTriangle, Minus, ChevronDown, ChevronRight } from 'lucide-react'
import { useApp } from '../context/AppContext'
import NavBar from '../components/NavBar'
import ItemDetailModal from '../components/ItemDetailModal'
import AddItemModal from '../components/AddItemModal'

export default function Inventory() {
  const { inventory, adjustQuantity } = useApp()
  const [search, setSearch] = useState('')
  const [selectedItem, setSelectedItem] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [collapsedCats, setCollapsedCats] = useState({})

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return inventory.filter(i =>
      i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q)
    )
  }, [inventory, search])

  const grouped = useMemo(() => {
    const map = {}
    filtered.forEach(item => {
      if (!map[item.category]) map[item.category] = []
      map[item.category].push(item)
    })
    return map
  }, [filtered])

  const lowStockCount = inventory.filter(i => i.quantity <= i.lowStockAt).length

  function toggleCat(cat) {
    setCollapsedCats(prev => ({ ...prev, [cat]: !prev[cat] }))
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <NavBar />

      <div className="page" style={{ maxWidth: 960 }}>

        {/* Page header */}
        <div className="section-header anim-slide-up" style={{ marginTop: 'var(--s5)' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)' }}>Inventory</h2>
            <p className="text-muted text-sm" style={{ marginTop: 4 }}>
              {inventory.length} items tracked
              {lowStockCount > 0 && (
                <span style={{ color: 'var(--danger)', marginLeft: 8 }}>
                  · {lowStockCount} low
                </span>
              )}
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <Plus size={15} /> Add Item
          </button>
        </div>

        {/* Low stock banner */}
        {lowStockCount > 0 && (
          <div className="anim-fade-in" style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--s3)',
            padding: 'var(--s3) var(--s4)',
            background: 'rgba(184,64,64,0.08)',
            border: '1px solid rgba(184,64,64,0.2)',
            borderRadius: 'var(--r2)',
            marginBottom: 'var(--s4)',
            fontSize: '0.85rem',
            color: 'var(--danger)',
          }}>
            <AlertTriangle size={15} />
            <strong>{lowStockCount} item{lowStockCount > 1 ? 's' : ''} running low</strong>
            <span style={{ opacity: 0.7 }}>— check the items marked in red below</span>
          </div>
        )}

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 'var(--s5)' }} className="anim-fade-in">
          <Search size={15} style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-muted)', pointerEvents: 'none',
          }} />
          <input
            className="input-field"
            style={{ paddingLeft: 36 }}
            placeholder="Search items or categories…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Category groups */}
        {Object.keys(grouped).length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--s8)', color: 'var(--text-muted)' }}>
            No items found
          </div>
        ) : (
          Object.entries(grouped).map(([cat, items], gi) => (
            <div
              key={cat}
              className="card"
              style={{ marginBottom: 'var(--s3)', overflow: 'hidden' }}
            >
              {/* Category header */}
              <button
                onClick={() => toggleCat(cat)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--s3) var(--s4)',
                  background: 'var(--latte)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background var(--t-fast)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#dfd0bc'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--latte)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s3)' }}>
                  {collapsedCats[cat]
                    ? <ChevronRight size={14} color="var(--text-muted)" />
                    : <ChevronDown size={14} color="var(--text-muted)" />
                  }
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.95rem' }}>
                    {cat}
                  </span>
                  <span className="badge badge-neutral">{items.length}</span>
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {items.filter(i => i.quantity <= i.lowStockAt).length > 0 && (
                    <span style={{ color: 'var(--danger)' }}>
                      {items.filter(i => i.quantity <= i.lowStockAt).length} low
                    </span>
                  )}
                </span>
              </button>

              {/* Items list */}
              {!collapsedCats[cat] && (
                <div>
                  {items.map((item, idx) => {
                    const isLow = item.quantity <= item.lowStockAt
                    return (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: 'var(--s3) var(--s4)',
                          borderTop: idx === 0 ? 'none' : '1px solid var(--border)',
                          background: isLow ? 'rgba(184,64,64,0.03)' : 'transparent',
                          transition: 'background var(--t-fast)',
                          cursor: 'pointer',
                          gap: 'var(--s3)',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = isLow ? 'rgba(184,64,64,0.06)' : 'var(--latte)'}
                        onMouseLeave={e => e.currentTarget.style.background = isLow ? 'rgba(184,64,64,0.03)' : 'transparent'}
                        onClick={() => setSelectedItem(item)}
                      >

                        {/* Name + notes */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s2)' }}>
                            <span style={{ fontWeight: 500, fontSize: '0.9rem' }} className="truncate">
                              {item.name}
                            </span>
                            {isLow && (
                              <AlertTriangle size={12} color="var(--danger)" />
                            )}
                          </div>
                          {item.notes && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {item.notes}
                            </span>
                          )}
                        </div>

                        {/* Price */}
                        {item.price > 0 && (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', minWidth: 48, textAlign: 'right' }}>
                            ${item.price.toFixed(2)}
                          </span>
                        )}

                        {/* Qty controls */}
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: 'var(--s2)' }}
                          onClick={e => e.stopPropagation()}
                        >
                          <button
                            className="btn-icon"
                            style={{ width: 28, height: 28 }}
                            onClick={() => adjustQuantity(item.id, -1)}
                            title="Remove one"
                          >
                            <Minus size={12} />
                          </button>

                          <div style={{
                            minWidth: 52,
                            textAlign: 'center',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            color: isLow ? 'var(--danger)' : 'var(--text-primary)',
                          }}>
                            {item.quantity}
                            <span style={{ fontSize: '0.68rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: 3 }}>
                              {item.unit}
                            </span>
                          </div>

                          <button
                            className="btn-icon"
                            style={{ width: 28, height: 28 }}
                            onClick={() => adjustQuantity(item.id, +1)}
                            title="Add one"
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
      {showAdd && (
        <AddItemModal onClose={() => setShowAdd(false)} />
      )}
    </div>
  )
}