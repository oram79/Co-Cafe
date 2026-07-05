import { useState, useMemo } from 'react'
import { Plus, Search, AlertTriangle, Minus, ChevronDown, ChevronRight, ArrowUpDown, CalendarDays } from 'lucide-react'

function expiryBadge(dateStr) {
  if (!dateStr) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const exp   = new Date(dateStr); exp.setHours(0, 0, 0, 0)
  const days  = Math.round((exp - today) / 86400000)
  if (days < 0)   return { label: 'Expired',  color: 'var(--danger)', bg: 'rgba(184,64,64,0.13)' }
  if (days === 0) return { label: 'Today',    color: 'var(--danger)', bg: 'rgba(184,64,64,0.13)' }
  if (days <= 3)  return { label: `${days}d`, color: 'var(--danger)', bg: 'rgba(184,64,64,0.1)'  }
  if (days <= 7)  return { label: `${days}d`, color: 'var(--accent)', bg: 'rgba(196,129,58,0.12)' }
  return null
}
import { useApp } from '../context/AppContext'
import NavBar from '../components/NavBar'
import ItemDetailModal from '../components/ItemDetailModal'
import AddItemModal from '../components/AddItemModal'

const SORT_OPTIONS = [
  { key: 'name-asc',  label: 'Name A→Z'  },
  { key: 'name-desc', label: 'Name Z→A'  },
  { key: 'qty-asc',   label: 'Qty ↑'     },
  { key: 'qty-desc',  label: 'Qty ↓'     },
]

function sortItems(items, sort) {
  return [...items].sort((a, b) => {
    if (sort === 'name-asc')  return a.name.localeCompare(b.name)
    if (sort === 'name-desc') return b.name.localeCompare(a.name)
    if (sort === 'qty-asc')   return a.quantity - b.quantity
    if (sort === 'qty-desc')  return b.quantity - a.quantity
    return 0
  })
}

export default function Inventory() {
  const { inventory, adjustQuantity, isGuest } = useApp()
  const [search,       setSearch]       = useState('')
  const [sort,         setSort]         = useState('name-asc')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [showAdd,      setShowAdd]      = useState(false)
  // undefined = closed (default); true = open
  const [catState, setCatState] = useState({})

  const isCatOpen = cat => catState[cat] === true

  function toggleCat(cat) {
    setCatState(prev => ({ ...prev, [cat]: prev[cat] === true ? undefined : true }))
  }

  const grouped = useMemo(() => {
    const q = search.toLowerCase()
    const map = {}
    inventory.forEach(item => {
      if (search && !item.name.toLowerCase().includes(q) && !item.category.toLowerCase().includes(q)) return
      if (lowStockOnly && item.quantity > item.lowStockAt) return
      if (!map[item.category]) map[item.category] = []
      map[item.category].push(item)
    })
    const sorted = {}
    Object.keys(map).sort((a, b) => a.localeCompare(b)).forEach(cat => {
      sorted[cat] = sortItems(map[cat], sort)
    })
    return sorted
  }, [inventory, search, sort, lowStockOnly])

  const lowStockCount   = inventory.filter(i => i.quantity <= i.lowStockAt).length
  const expiringCount   = inventory.filter(i => {
    if (!i.expiryDate) return false
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const exp   = new Date(i.expiryDate); exp.setHours(0, 0, 0, 0)
    return Math.round((exp - today) / 86400000) <= 3
  }).length

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <NavBar />

      <div className="page" style={{ maxWidth: 960 }}>

        {/* Header */}
        <div className="anim-slide-up" style={{
          display: 'flex', alignItems: 'flex-start',
          justifyContent: 'space-between', flexWrap: 'wrap',
          gap: 'var(--s3)',
          marginTop: 'var(--s5)', marginBottom: 'var(--s5)',
        }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', lineHeight: 1 }}>Inventory</h2>
            <p className="text-muted text-sm" style={{ marginTop: 4 }}>
              {inventory.length} items tracked
              {lowStockCount > 0 && (
                <span style={{ color: 'var(--danger)', marginLeft: 8 }}>· {lowStockCount} low</span>
              )}
            </p>
          </div>
          {!isGuest && (
            <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
              <Plus size={15} /> Add Item
            </button>
          )}
        </div>

        {/* Expiring soon banner */}
        {expiringCount > 0 && (
          <div className="anim-fade-in" style={{
            display: 'flex', alignItems: 'center', gap: 'var(--s3)',
            padding: 'var(--s3) var(--s4)',
            background: 'rgba(196,129,58,0.08)',
            border: '1px solid rgba(196,129,58,0.2)',
            borderRadius: 'var(--r2)',
            marginBottom: 'var(--s3)',
            fontSize: '0.83rem',
          }}>
            <CalendarDays size={14} color="var(--accent)" style={{ flexShrink: 0 }} />
            <span style={{ color: 'var(--accent-dark)', fontWeight: 700 }}>
              {expiringCount} item{expiringCount > 1 ? 's' : ''} expiring within 3 days
            </span>
          </div>
        )}

        {/* Low stock banner */}
        {lowStockCount > 0 && (
          <div className="anim-fade-in" style={{
            display: 'flex', alignItems: 'center', gap: 'var(--s3)',
            padding: 'var(--s3) var(--s4)',
            background: 'rgba(184,64,64,0.06)',
            border: '1px solid rgba(184,64,64,0.15)',
            borderRadius: 'var(--r2)',
            marginBottom: 'var(--s4)',
            fontSize: '0.83rem',
          }}>
            <AlertTriangle size={14} color="var(--danger)" style={{ flexShrink: 0 }} />
            <span style={{ color: 'var(--danger)', fontWeight: 700 }}>
              {lowStockCount} item{lowStockCount > 1 ? 's' : ''} running low
            </span>
          </div>
        )}

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 'var(--s3)' }} className="anim-fade-in">
          <Search size={14} style={{
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

        {/* Sort + filter bar */}
        <div className="anim-fade-in" style={{
          display: 'flex', alignItems: 'center', gap: 'var(--s2)',
          marginBottom: 'var(--s5)', flexWrap: 'wrap',
        }}>
          <ArrowUpDown size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.key}
              onClick={() => setSort(opt.key)}
              style={{
                padding: '4px 12px', borderRadius: 'var(--r-pill)',
                fontSize: '0.73rem', fontWeight: 500,
                whiteSpace: 'nowrap', border: 'none', cursor: 'pointer',
                transition: 'all var(--t-fast)',
                background: sort === opt.key ? 'var(--espresso)' : 'var(--latte)',
                color: sort === opt.key ? 'var(--cream)' : 'var(--text-secondary)',
              }}
            >
              {opt.label}
            </button>
          ))}

          <div style={{ width: 1, height: 16, background: 'var(--border)', margin: '0 var(--s1)', flexShrink: 0 }} />

          <button
            onClick={() => setLowStockOnly(v => !v)}
            style={{
              padding: '4px 12px', borderRadius: 'var(--r-pill)',
              fontSize: '0.73rem', fontWeight: 500,
              whiteSpace: 'nowrap', border: 'none', cursor: 'pointer',
              transition: 'all var(--t-fast)',
              background: lowStockOnly ? 'rgba(184,64,64,0.15)' : 'var(--latte)',
              color: lowStockOnly ? 'var(--danger)' : 'var(--text-secondary)',
            }}
          >
            Low Stock
          </button>
        </div>

        {/* Category groups */}
        {Object.keys(grouped).length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--s8)', color: 'var(--text-muted)' }}>
            No items found
          </div>
        ) : (
          Object.entries(grouped).map(([cat, items]) => {
            const catLowCount = items.filter(i => i.quantity <= i.lowStockAt).length
            const catOpen     = isCatOpen(cat)

            return (
              <div key={cat} className="card" style={{ marginBottom: 'var(--s3)', overflow: 'hidden' }}>

                {/* Category header — same style as the transaction log toggle in Sales */}
                <button
                  onClick={() => toggleCat(cat)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    gap: 'var(--s3)', padding: 'var(--s3) var(--s5)',
                    background: 'var(--latte)', border: 'none',
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'background var(--t-fast)',
                    borderBottom: catOpen ? '1px solid var(--border)' : 'none',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#dfd0bc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--latte)'}
                >
                  {catOpen
                    ? <ChevronDown  size={14} color="var(--text-muted)" />
                    : <ChevronRight size={14} color="var(--text-muted)" />
                  }
                  <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.95rem', flex: 1 }}>
                    {cat}
                  </p>
                  {catLowCount > 0 && (
                    <span style={{ fontSize: '0.73rem', color: 'var(--danger)', fontWeight: 600, marginRight: 'var(--s2)' }}>
                      {catLowCount} low
                    </span>
                  )}
                  <span style={{
                    padding: '2px 10px', borderRadius: 'var(--r-pill)',
                    background: 'rgba(196,129,58,0.12)',
                    fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent)',
                  }}>
                    {items.length}
                  </span>
                </button>

                {/* Items — same row style as transaction table in Sales */}
                {catOpen && (
                  <div>
                    {items.map((item, idx) => {
                      const isLow = item.quantity <= item.lowStockAt
                      return (
                        <div
                          key={item.id}
                          style={{
                            display: 'flex', alignItems: 'center',
                            padding: 'var(--s3) var(--s5)',
                            borderTop: idx === 0 ? 'none' : '1px solid var(--border)',
                            transition: 'background var(--t-fast)',
                            cursor: isGuest ? 'default' : 'pointer', gap: 'var(--s4)',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--latte)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          onClick={() => !isGuest && setSelectedItem(item)}
                        >
                          {/* Name + notes + expiry */}
                          {(() => {
                            const badge = expiryBadge(item.expiryDate)
                            return (
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s2)' }}>
                                  <span style={{ fontWeight: 500, fontSize: '0.9rem' }} className="truncate">
                                    {item.name}
                                  </span>
                                  {isLow && <AlertTriangle size={12} color="var(--danger)" />}
                                  {badge && (
                                    <span style={{
                                      fontSize: '0.65rem', fontWeight: 700,
                                      padding: '1px 6px', borderRadius: 'var(--r-pill)',
                                      background: badge.bg, color: badge.color,
                                      flexShrink: 0,
                                    }}>
                                      {badge.label}
                                    </span>
                                  )}
                                </div>
                                {item.notes && (
                                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                    {item.notes}
                                  </span>
                                )}
                              </div>
                            )
                          })()}

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
                            {!isGuest && (
                              <button
                                className="btn-icon"
                                style={{ width: 28, height: 28 }}
                                onClick={() => adjustQuantity(item.id, -1)}
                                title="Remove one"
                              >
                                <Minus size={12} />
                              </button>
                            )}

                            <div style={{
                              minWidth: 52, textAlign: 'center',
                              fontWeight: 600, fontSize: '0.9rem',
                              color: isLow ? 'var(--danger)' : 'var(--text-primary)',
                            }}>
                              {item.quantity}
                              <span style={{ fontSize: '0.68rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: 3 }}>
                                {item.unit}
                              </span>
                            </div>

                            {!isGuest && (
                              <button
                                className="btn-icon"
                                style={{ width: 28, height: 28 }}
                                onClick={() => adjustQuantity(item.id, +1)}
                                title="Add one"
                              >
                                <Plus size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })
        )}

      </div>

      {selectedItem && (
        <ItemDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
      {showAdd && (
        <AddItemModal onClose={() => setShowAdd(false)} />
      )}
    </div>
  )
}
