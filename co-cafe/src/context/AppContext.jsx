import { createContext, useContext } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'

const TAX_RATE = 0.15

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [inventory,   setInventory]   = useLocalStorage('cc_inventory', [])
  const [menu,        setMenu]        = useLocalStorage('cc_menu', [])
  const [shifts,      setShifts]      = useLocalStorage('cc_shifts', [])
  const [checklists,  setChecklists]  = useLocalStorage('co-cafe-checklists', { open: [], close: [] })

  const activeShift = shifts.find(s => !s.endedAt) ?? null

  // ── Inventory helpers ──────────────────────────────────────────────────────
  function addInventoryItem(item) {
    const newItem = { ...item, id: `inv-${Date.now()}` }
    setInventory(prev => [...prev, newItem])
    return newItem.id
  }

  function updateInventoryItem(id, updates) {
    setInventory(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i))
  }

  function deleteInventoryItem(id) {
    setInventory(prev => prev.filter(i => i.id !== id))
    setMenu(prev => prev.map(m => m.inventoryId === id ? { ...m, inventoryId: null } : m))
  }

  function adjustQuantity(id, delta) {
    setInventory(prev => prev.map(i =>
      i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i
    ))
  }

  // ── Menu helpers ───────────────────────────────────────────────────────────
  function addMenuItem(item) {
    setMenu(prev => [...prev, { ...item, id: `menu-${Date.now()}` }])
  }

  function updateMenuItem(id, updates) {
    setMenu(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m))
  }

  function deleteMenuItem(id) {
    setMenu(prev => prev.filter(m => m.id !== id))
  }

  // ── Shift helpers ──────────────────────────────────────────────────────────
  function startShift() {
    setShifts(prev => [...prev, {
      id:        `shift-${Date.now()}`,
      startedAt: new Date().toISOString(),
      endedAt:   null,
      sales:     [],
    }])
  }

  function endShift() {
    setShifts(prev => prev.map(s =>
      !s.endedAt ? { ...s, endedAt: new Date().toISOString() } : s
    ))
  }

  function recordSale(lineItems) {
    const subtotal = lineItems.reduce((sum, li) => sum + li.price * li.quantity, 0)
    const tax      = subtotal * TAX_RATE
    const sale = {
      id:        `sale-${Date.now()}`,
      timestamp: new Date().toISOString(),
      items:     lineItems,
      subtotal,
      tax,
      total: subtotal + tax,
    }
    setShifts(prev => prev.map(s =>
      !s.endedAt ? { ...s, sales: [...s.sales, sale] } : s
    ))
    lineItems.forEach(li => {
      const menuItem = menu.find(m => m.id === li.menuItemId)
      if (menuItem?.inventoryId) adjustQuantity(menuItem.inventoryId, -li.quantity)
    })
  }

  // ── Data export / import ──────────────────────────────────────────────────
  function exportData() {
    const payload = {
      exportedAt: new Date().toISOString(),
      inventory,
      menu,
      shifts,
      checklists,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `cocafe-data-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function importData(file) {
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target.result)
        if (Array.isArray(data.inventory)) setInventory(data.inventory)
        if (Array.isArray(data.menu))      setMenu(data.menu)
        if (Array.isArray(data.shifts))    setShifts(data.shifts)
        if (data.checklists && typeof data.checklists === 'object') setChecklists(data.checklists)
      } catch {
        alert('Could not read the file — make sure it is a valid Co. Cafe backup.')
      }
    }
    reader.readAsText(file)
  }

  function deleteShift(shiftId) {
    setShifts(prev => prev.filter(s => s.id !== shiftId))
  }

  function deleteSale(saleId) {
    setShifts(prev => prev.map(s =>
      !s.endedAt
        ? { ...s, sales: s.sales.filter(sale => sale.id !== saleId) }
        : s
    ))
  }

  const value = {
    inventory, menu, shifts, activeShift, checklists, setChecklists,
    addInventoryItem, updateInventoryItem, deleteInventoryItem, adjustQuantity,
    addMenuItem, updateMenuItem, deleteMenuItem,
    startShift, endShift, recordSale, deleteSale, deleteShift,
    exportData, importData,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
