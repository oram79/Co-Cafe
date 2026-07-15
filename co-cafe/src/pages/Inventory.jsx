import { useState, useMemo } from 'react'
import { Plus, Search, AlertTriangle, Minus, ArrowUpDown, CalendarDays, Package, DollarSign, ChevronDown, ChevronRight } from 'lucide-react'
import { useApp } from '../context/AppContext'
import NavBar from '../components/NavBar'
import ItemDetailModal from '../components/ItemDetailModal'
import AddItemModal from '../components/AddItemModal'

const CATEGORY_COLORS = ['#C4813A', '#4A7C59', '#5A6A8A', '#8A5A5A', '#B8A040', '#6B3A24', '#40788A']

function daysUntilExpiry(dateStr) {
  if (!dateStr) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const exp   = new Date(dateStr); exp.setHours(0, 0, 0, 0)
  return Math.round((exp - today) / 86400000)
}

function expiryBadge(dateStr) {
  const days = daysUntilExpiry(dateStr)
  if (days === null) return null
  if (days < 0)   return { label: 'Expired',  color: 'var(--danger)', bg: 'rgba(184,64,64,0.13)' }
  if (days === 0) return { label: 'Today',    color: 'var(--danger)', bg: 'rgba(184,64,64,0.13)' }
  if (days <= 3)  return { label: `${days}d`, color: 'var(--danger)', bg: 'rgba(184,64,64,0.1)'  }
  if (days <= 7)  return { label: `${days}d`, color: 'var(--accent)', bg: 'rgba(196,129,58,0.12)' }
  return null
}

function stockGauge(item) {
  const threshold = item.lowStockAt > 0 ? item.lowStockAt : 1
  const healthyAt = threshold * 2.5
  const ratio = healthyAt > 0 ? Math.max(0, Math.min(1, item.quantity / healthyAt)) : (item.quantity > 0 ? 1 : 0)
  const isLow = item.quantity <= item.lowStockAt
  const color = isLow ? 'var(--danger)' : item.quantity <= threshold * 1.5 ? 'var(--accent)' : 'var(--success)'
  return { ratio, color }
}

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

function StatTile({ label, value, sub, icon: Icon, color, active, onClick }) {
  const clickable = !!onClick
  return (
    <div
      className="card"
      onClick={onClick}
      style={{
        padding: 'var(--s5)', display: 'flex', flexDirection: 'column',
        gap: 'var(--s3)', position: 'relative', overflow: 'hidden',
        cursor: clickable ? 'pointer' : 'default',
        borderColor: active ? color : undefined,
        boxShadow: active ? `0 0 0 1px ${color}` : undefined,
        transition: 'all var(--t-fast)',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color, borderRadius: '14px 14px 0 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
          {label}
        </p>
        <div style={{ width: 36, height: 36, borderRadius: 'var(--r2)', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={16} color={color} />
        </div>
      </div>
      <div>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, lineHeight: 1, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          {value}
        </p>
        {sub && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{sub}</p>}
      </div>
    </div>
  )
}

function ItemRow({ item, color, isFirst, isGuest, onOpen, onAdjust }) {
  const isLow = item.quantity <= item.lowStockAt
  const badge = expiryBadge(item.expiryDate)
  const gauge = stockGauge(item)

  return (
    <div
      onClick={() => !isGuest && onOpen(item)}
      style={{
        display: 'flex', alignItems: 'center', gap: 'var(--s4)',
        padding: 'var(--s3) var(--s5)',
        borderTop: isFirst ? 'none' : '1px solid var(--border)',
        borderLeft: `3px solid ${color}`,
        transition: 'background var(--t-fast)',
        cursor: isGuest ? 'default' : 'pointer',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--latte)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* Name + notes + expiry */}
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

      {/* Stock gauge */}
      <div style={{ width: 46, height: 5, background: 'var(--latte)', borderRadius: 'var(--r-pill)', overflow: 'hidden', flexShrink: 0 }} title="Stock level">
        <div style={{
          height: '100%', width: `${gauge.ratio * 100}%`,
          background: gauge.color, borderRadius: 'var(--r-pill)',
          transition: 'width var(--t-base), background var(--t-base)',
        }} />
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
        {!isGuest && (
          <button className="btn-icon" style={{ width: 28, height: 28 }} onClick={() => onAdjust(item.id, -1)} title="Remove one">
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
          <button className="btn-icon" style={{ width: 28, height: 28 }} onClick={() => onAdjust(item.id, +1)} title="Add one">
            <Plus size={12} />
          </button>
        )}
      </div>
    </div>
  )
}

export default function Inventory() {
  const { inventory, adjustQuantity, isGuest } = useApp()
  const [search,         setSearch]         = useState('')
  const [sort,           setSort]           = useState('name-asc')
  const [lowStockOnly,   setLowStockOnly]   = useState(false)
  const [expiringOnly,   setExpiringOnly]   = useState(false)
  const [selectedItem,   setSelectedItem]   = useState(null)
  const [showAdd,        setShowAdd]        = useState(false)
  // undefined = closed (default); true = open
  const [catState, setCatState] = useState({})

  const isCatOpen = cat => catState[cat] === true

  function toggleCat(cat) {
    setCatState(prev => ({ ...prev, [cat]: prev[cat] === true ? undefined : true }))
  }

  const categories = useMemo(
    () => [...new Set(inventory.map(i => i.category))].sort((a, b) => a.localeCompare(b)),
    [inventory]
  )
  const categoryColor = cat => CATEGORY_COLORS[categories.indexOf(cat) % CATEGORY_COLORS.length]

  const lowStockCount = inventory.filter(i => i.quantity <= i.lowStockAt).length
  const expiringCount = inventory.filter(i => { const d = daysUntilExpiry(i.expiryDate); return d !== null && d <= 3 }).length
  const totalValue    = inventory.reduce((sum, i) => sum + i.quantity * (i.price || 0), 0)

  const passesBaseFilters = item => {
    const q = search.toLowerCase()
    if (search && !item.name.toLowerCase().includes(q) && !item.category.toLowerCase().includes(q)) return false
    if (lowStockOnly && item.quantity > item.lowStockAt) return false
    if (expiringOnly) {
      const d = daysUntilExpiry(item.expiryDate)
      if (d === null || d > 3) return false
    }
    return true
  }

  const grouped = useMemo(() => {
    const map = {}
    inventory.forEach(item => {
      if (!passesBaseFilters(item)) return
      if (!map[item.category]) map[item.category] = []
      map[item.category].push(item)
    })
    const sorted = {}
    Object.keys(map).sort((a, b) => a.localeCompare(b)).forEach(cat => {
      sorted[cat] = sortItems(map[cat], sort)
    })
    return sorted
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inventory, search, sort, lowStockOnly, expiringOnly])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <NavBar />

      <div className="page">

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
              {inventory.length} item{inventory.length !== 1 ? 's' : ''} tracked across {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'}
            </p>
          </div>
          {!isGuest && (
            <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
              <Plus size={15} /> Add Item
            </button>
          )}
        </div>

        {/* Stat tiles */}
        <div className="grid-4 anim-slide-up" style={{ marginBottom: 'var(--s5)' }}>
          <StatTile label="Total Items"  value={inventory.length}               sub={`${categories.length} categories`}     icon={Package}    color="var(--mahogany)" />
          <StatTile label="Low Stock"    value={lowStockCount}                  sub="At or below threshold"                 icon={AlertTriangle} color="var(--danger)"
            active={lowStockOnly} onClick={() => setLowStockOnly(v => !v)} />
          <StatTile label="Expiring Soon" value={expiringCount}                 sub="Within 3 days"                         icon={CalendarDays} color="var(--accent)"
            active={expiringOnly} onClick={() => setExpiringOnly(v => !v)} />
          <StatTile label="Total Value"  value={`$${totalValue.toFixed(2)}`}    sub="Based on unit price"                   icon={DollarSign} color="var(--success)" />
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 'var(--s4)' }} className="anim-fade-in">
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

        {/* Sort bar */}
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
        </div>

        {/* Category groups */}
        {Object.keys(grouped).length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--s3)',
            textAlign: 'center', padding: 'var(--s8)', color: 'var(--text-muted)',
          }}>
            <Package size={32} color="var(--fog)" />
            <p>No items found</p>
          </div>
        ) : (
          Object.entries(grouped).map(([cat, items]) => {
            const catLowCount = items.filter(i => i.quantity <= i.lowStockAt).length
            const catOpen     = isCatOpen(cat)
            const color       = categoryColor(cat)

            return (
              <div key={cat} className="card" style={{ marginBottom: 'var(--s3)', overflow: 'hidden' }}>

                {/* Category header */}
                <button
                  onClick={() => toggleCat(cat)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    gap: 'var(--s3)', padding: 'var(--s3) var(--s5)',
                    background: 'var(--latte)', border: 'none',
                    borderLeft: `3px solid ${color}`,
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'background var(--t-fast)',
                    borderBottom: catOpen ? '1px solid var(--border)' : 'none',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--latte-deep)'}
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
                    background: `${color}22`,
                    fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)',
                  }}>
                    {items.length}
                  </span>
                </button>

                {/* Items */}
                {catOpen && (
                  <div>
                    {items.map((item, idx) => (
                      <ItemRow
                        key={item.id}
                        item={item}
                        color={color}
                        isFirst={idx === 0}
                        isGuest={isGuest}
                        onOpen={setSelectedItem}
                        onAdjust={adjustQuantity}
                      />
                    ))}
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
