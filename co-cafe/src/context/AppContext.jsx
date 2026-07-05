import { createContext, useContext } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'

const TAX_RATE = 0.15

const AppContext = createContext(null)

export function AppProvider({ children, role = 'admin' }) {
  const isGuest = role === 'guest'
  const [inventory,   setInventory]   = useLocalStorage(isGuest ? 'cc_guest_inventory'  : 'cc_inventory', [])
  const [menu,        setMenu]        = useLocalStorage(isGuest ? 'cc_guest_menu'        : 'cc_menu', [])
  const [shifts,      setShifts]      = useLocalStorage(isGuest ? 'cc_guest_shifts'      : 'cc_shifts', [])
  const [checklists,  setChecklists]  = useLocalStorage(isGuest ? 'cc_guest_checklists'  : 'co-cafe-checklists', { open: [], close: [] })
  const [orders,           setOrders]           = useLocalStorage(isGuest ? 'cc_guest_orders'    : 'cc_orders', [])
  const [recipes,          setRecipes]          = useLocalStorage(isGuest ? 'cc_guest_recipes'   : 'cc_recipes', [])
  const [todos,            setTodos]            = useLocalStorage(isGuest ? 'cc_guest_todos'     : 'cc_todos', [])
  const [cleaningSchedule, setCleaningSchedule] = useLocalStorage(isGuest ? 'cc_guest_cleaning'  : 'cc_cleaning', {
    Mon: [{ id: 'mon-1', text: 'Task 1', done: false }, { id: 'mon-2', text: 'Task 2', done: false }],
    Tue: [{ id: 'tue-1', text: 'Task 1', done: false }, { id: 'tue-2', text: 'Task 2', done: false }],
    Wed: [{ id: 'wed-1', text: 'Task 1', done: false }, { id: 'wed-2', text: 'Task 2', done: false }],
    Thu: [{ id: 'thu-1', text: 'Task 1', done: false }, { id: 'thu-2', text: 'Task 2', done: false }],
    Fri: [{ id: 'fri-1', text: 'Task 1', done: false }, { id: 'fri-2', text: 'Task 2', done: false }],
  })

  const _now        = new Date()
  const _todayStr   = _now.toDateString()
  const activeShift = shifts.find(s => new Date(s.startedAt).toDateString() === _todayStr) ?? null
  const isOpen      = _now.getHours() >= 8 && _now.getHours() < 15

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
    const today   = new Date()
    const todayDs = today.toDateString()
    setShifts(prev => {
      const hasToday = prev.some(s => new Date(s.startedAt).toDateString() === todayDs)
      let next = prev
      if (!hasToday) {
        const start = new Date(today)
        start.setHours(8, 0, 0, 0)
        next = [...prev, {
          id:        `shift-${Date.now()}`,
          startedAt: start.toISOString(),
          endedAt:   null,
          sales:     [],
        }]
      }
      return next.map(s =>
        new Date(s.startedAt).toDateString() === todayDs
          ? { ...s, sales: [...s.sales, sale] }
          : s
      )
    })
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
      orders,
      cleaningSchedule,
      recipes,
      todos,
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
        if (Array.isArray(data.orders))    setOrders(data.orders)
        if (data.cleaningSchedule && typeof data.cleaningSchedule === 'object') setCleaningSchedule(data.cleaningSchedule)
        if (Array.isArray(data.recipes)) setRecipes(data.recipes)
        if (Array.isArray(data.todos))   setTodos(data.todos)
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
    setShifts(prev => prev.map(s => ({
      ...s,
      sales: s.sales.filter(sale => sale.id !== saleId),
    })))
  }

  const value = {
    isGuest,
    inventory, menu, shifts, activeShift, isOpen,
    checklists, setChecklists,
    orders, setOrders,
    cleaningSchedule, setCleaningSchedule,
    recipes, setRecipes,
    todos, setTodos,
    addInventoryItem, updateInventoryItem, deleteInventoryItem, adjustQuantity,
    addMenuItem, updateMenuItem, deleteMenuItem,
    recordSale, deleteSale, deleteShift,
    exportData, importData,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
