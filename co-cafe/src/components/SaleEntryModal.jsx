import { useState, useMemo } from 'react'
import { X, Plus, Minus, ShoppingBag, Search } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function SaleEntryModal({ onClose }) {
  const { menu, inventory, recordSale } = useApp()
  const [cart, setCart] = useState({}) // { menuItemId: quantity }
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  const categories = useMemo(() => {
    const cats = [...new Set(menu.map(m => m.category))]
    return ['All', ...cats]
  }, [menu])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return menu.filter(m => {
      const matchesSearch = m.name.toLowerCase().includes(q)
      const matchesCat = activeCategory === 'All' || m.category === activeCategory
      return matchesSearch && matchesCat
    })
  }, [menu, search, activeCategory])

  function addToCart(itemId) {
    setCart(prev => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }))
  }
  function removeFromCart(itemId) {
    setCart(prev => {
      const next = { ...prev }
      if (next[itemId] > 1) next[itemId]--
      else delete next[itemId]
      return next
    })
  }

  const cartItems = Object.entries(cart).map(([id, qty]) => {
    const menuItem = menu.find(m => m.id === id)
    return { menuItem, qty }
  }).filter(Boolean)

  const subtotal = cartItems.reduce((sum, { menuItem, qty }) => sum + menuItem.price * qty, 0)
  const tax      = subtotal * 0.15
  const total    = subtotal + tax

  function handleRecord() {
    if (cartItems.length === 0) return
    const lineItems = cartItems.map(({ menuItem, qty }) => ({
      menuItemId: menuItem.id,
      name: menuItem.name,
      category: menuItem.category,
      price: menuItem.price,
      quantity: qty,
    }))
    recordSale(lineItems)
    onClose()
  }

  // Check if inventory will go negative
  function stockWarning(menuItem, qty) {
    if (!menuItem.inventoryId) return null
    const inv = inventory.find(i => i.id === menuItem.inventoryId)
    if (!inv) return null
    if (inv.quantity < qty) return `Only ${inv.quantity} in stock`
    return null
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 680, display: 'flex', flexDirection: 'column', gap: 0, padding: 0, maxHeight: '90vh' }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 'var(--s4) var(--s5)',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s3)' }}>
            <ShoppingBag size={18} color="var(--accent)" />
            <h3 style={{ fontFamily: 'var(--font-display)' }}>New Sale</h3>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* Left: menu browser */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: '1px solid var(--border)' }}>

            {/* Search */}
            <div style={{ padding: 'var(--s3) var(--s4)', borderBottom: '1px solid var(--border)' }}>
              <div style={{ position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input className="input-field" style={{ paddingLeft: 30, fontSize: '0.82rem' }}
                  placeholder="Search menu…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>

            {/* Category tabs */}
            <div style={{
              display: 'flex', gap: 'var(--s1)', overflowX: 'auto', padding: 'var(--s2) var(--s4)',
              borderBottom: '1px solid var(--border)', flexShrink: 0,
            }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 'var(--r-pill)',
                    fontSize: '0.73rem',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    background: activeCategory === cat ? 'var(--espresso)' : 'var(--latte)',
                    color: activeCategory === cat ? 'var(--cream)' : 'var(--text-secondary)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all var(--t-fast)',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Menu items */}
            <div style={{ overflowY: 'auto', flex: 1, padding: 'var(--s2) var(--s3)' }}>
              {filtered.map(item => {
                const inCart = cart[item.id] || 0
                const warn = stockWarning(item, inCart + 1)
                return (
                  <div key={item.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: 'var(--s2) var(--s3)',
                    borderRadius: 'var(--r2)',
                    marginBottom: 2,
                    background: inCart > 0 ? 'rgba(196,129,58,0.08)' : 'transparent',
                    transition: 'background var(--t-fast)',
                  }}>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: inCart > 0 ? 600 : 400 }}>{item.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.category}</div>
                      {warn && <div style={{ fontSize: '0.7rem', color: 'var(--danger)', marginTop: 2 }}>{warn}</div>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s2)' }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', minWidth: 40, textAlign: 'right' }}>
                        ${item.price.toFixed(2)}
                      </span>
                      {inCart > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <button className="btn-icon" style={{ width: 24, height: 24 }} onClick={() => removeFromCart(item.id)}><Minus size={11} /></button>
                          <span style={{ fontSize: '0.82rem', fontWeight: 600, minWidth: 16, textAlign: 'center' }}>{inCart}</span>
                          <button className="btn-icon" style={{ width: 24, height: 24 }} onClick={() => addToCart(item.id)}><Plus size={11} /></button>
                        </div>
                      ) : (
                        <button className="btn-icon" style={{ width: 28, height: 28 }} onClick={() => addToCart(item.id)}><Plus size={13} /></button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right: cart summary */}
          <div style={{ width: 220, display: 'flex', flexDirection: 'column', padding: 'var(--s4)' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 'var(--s3)' }}>
              Order
            </p>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {cartItems.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No items yet</p>
              ) : cartItems.map(({ menuItem, qty }) => (
                <div key={menuItem.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  marginBottom: 'var(--s2)', fontSize: '0.82rem',
                }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{menuItem.name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>×{qty} @ ${menuItem.price.toFixed(2)}</div>
                  </div>
                  <span style={{ fontWeight: 600, color: 'var(--accent)' }}>${(menuItem.price * qty).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 'var(--s3)', marginTop: 'var(--s3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--s3)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <span>Tax (15%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--s3)', borderTop: '1px solid var(--border)', paddingTop: 'var(--s2)' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>Total</span>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--accent)', fontSize: '1.1rem' }}>
                  ${total.toFixed(2)}
                </span>
              </div>
              <button
                className="btn btn-primary w-full"
                style={{ width: '100%', justifyContent: 'center' }}
                disabled={cartItems.length === 0}
                onClick={handleRecord}
              >
                Record Sale
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}