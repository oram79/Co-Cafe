import { createContext, useContext } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'

// ── Seed data ─────────────────────────────────────────────────────────────────
const SEED_INVENTORY = []

const SEED_MENU = []

// ── Context ────────────────────────────────────────────────────────────────────
const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [inventory, setInventory] = useLocalStorage('cc_inventory', SEED_INVENTORY)
  const [menu, setMenu] = useLocalStorage('cc_menu', SEED_MENU)
  const [sales, setSales] = useLocalStorage('cc_sales', [])

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
    // Also unlink from menu
    setMenu(prev => prev.map(m => m.inventoryId === id ? { ...m, inventoryId: null } : m))
  }

  function adjustQuantity(id, delta) {
    setInventory(prev => prev.map(i =>
      i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i
    ))
  }

  // ── Menu helpers ───────────────────────────────────────────────────────────
  function addMenuItem(item) {
    const newItem = { ...item, id: `menu-${Date.now()}` }
    setMenu(prev => [...prev, newItem])
  }

  function updateMenuItem(id, updates) {
    setMenu(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m))
  }

  function deleteMenuItem(id) {
    setMenu(prev => prev.filter(m => m.id !== id))
  }

  // ── Sales helpers ──────────────────────────────────────────────────────────
  const TAX_RATE = 0.15

  function recordSale(lineItems) {
    // lineItems: [{ menuItemId, name, category, price, quantity }]
    const subtotal = lineItems.reduce((sum, li) => sum + li.price * li.quantity, 0)
    const tax      = subtotal * TAX_RATE
    const sale = {
      id: `sale-${Date.now()}`,
      timestamp: new Date().toISOString(),
      items: lineItems,
      subtotal,
      tax,
      total: subtotal + tax,
    }
    setSales(prev => [...prev, sale])

    // Decrement inventory for linked items
    lineItems.forEach(li => {
      const menuItem = menu.find(m => m.id === li.menuItemId)
      if (menuItem?.inventoryId) {
        adjustQuantity(menuItem.inventoryId, -li.quantity)
      }
    })
  }

  function deleteSale(id) {
    setSales(prev => prev.filter(s => s.id !== id))
  }

  const value = {
    inventory, menu, sales,
    addInventoryItem, updateInventoryItem, deleteInventoryItem, adjustQuantity,
    addMenuItem, updateMenuItem, deleteMenuItem,
    recordSale, deleteSale,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}