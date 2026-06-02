import { createContext, useContext } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'

// ── Seed data ─────────────────────────────────────────────────────────────────
const SEED_INVENTORY = [
  // Drinks (fridge)
  { id: 'inv-1', name: 'Sparkling Water', category: 'Fridge Drinks', quantity: 12, unit: 'cans', lowStockAt: 4, price: 2.50, trackedInSales: true, notes: 'Perrier / San Pellegrino' },
  { id: 'inv-2', name: 'Canned Juice', category: 'Fridge Drinks', quantity: 8, unit: 'cans', lowStockAt: 3, price: 3.00, trackedInSales: true, notes: '' },
  { id: 'inv-3', name: 'Protein Shake', category: 'Fridge Drinks', quantity: 6, unit: 'bottles', lowStockAt: 2, price: 5.50, trackedInSales: true, notes: '' },
  { id: 'inv-4', name: 'Cold Brew Bottle', category: 'Fridge Drinks', quantity: 8, unit: 'bottles', lowStockAt: 3, price: 6.00, trackedInSales: true, notes: '' },
  // Fridge Food
  { id: 'inv-5', name: 'Burrito', category: 'Fridge Food', quantity: 5, unit: 'items', lowStockAt: 2, price: 9.00, trackedInSales: true, notes: '' },
  { id: 'inv-6', name: 'Sandwich', category: 'Fridge Food', quantity: 4, unit: 'items', lowStockAt: 2, price: 8.50, trackedInSales: true, notes: '' },
  // Pastries
  { id: 'inv-7', name: 'Croissant', category: 'Pastries', quantity: 10, unit: 'items', lowStockAt: 3, price: 3.50, trackedInSales: true, notes: 'From local bakery' },
  { id: 'inv-8', name: 'Cookie', category: 'Pastries', quantity: 14, unit: 'items', lowStockAt: 4, price: 2.50, trackedInSales: true, notes: '' },
  // Cafe Supplies
  { id: 'inv-9', name: 'Espresso Beans (1kg)', category: 'Cafe Supplies', quantity: 3, unit: 'bags', lowStockAt: 1, price: 0, trackedInSales: false, notes: 'Order from roaster' },
  { id: 'inv-10', name: 'Whole Milk (2L)', category: 'Cafe Supplies', quantity: 6, unit: 'cartons', lowStockAt: 2, price: 0, trackedInSales: false, notes: '' },
  { id: 'inv-11', name: 'Oat Milk (1L)', category: 'Cafe Supplies', quantity: 4, unit: 'cartons', lowStockAt: 2, price: 0, trackedInSales: false, notes: '' },
  { id: 'inv-12', name: 'Paper Cups (S)', category: 'Cafe Supplies', quantity: 80, unit: 'units', lowStockAt: 20, price: 0, trackedInSales: false, notes: '' },
  { id: 'inv-13', name: 'Paper Cups (L)', category: 'Cafe Supplies', quantity: 60, unit: 'units', lowStockAt: 20, price: 0, trackedInSales: false, notes: '' },
]

const SEED_MENU = [
  // Espresso drinks
  { id: 'menu-1', name: 'Espresso', category: 'Espresso', price: 3.50, inventoryId: null },
  { id: 'menu-2', name: 'Americano', category: 'Espresso', price: 4.00, inventoryId: null },
  { id: 'menu-3', name: 'Latte', category: 'Espresso', price: 5.50, inventoryId: null },
  { id: 'menu-4', name: 'Cappuccino', category: 'Espresso', price: 5.00, inventoryId: null },
  { id: 'menu-5', name: 'Flat White', category: 'Espresso', price: 5.00, inventoryId: null },
  { id: 'menu-6', name: 'Cortado', category: 'Espresso', price: 4.50, inventoryId: null },
  { id: 'menu-7', name: 'Macchiato', category: 'Espresso', price: 4.00, inventoryId: null },
  // Drip / Batch
  { id: 'menu-8', name: 'Drip Coffee', category: 'Drip Coffee', price: 3.00, inventoryId: null },
  { id: 'menu-9', name: 'Cold Brew', category: 'Drip Coffee', price: 5.00, inventoryId: null },
  // Tea
  { id: 'menu-10', name: 'Chai Latte', category: 'Tea', price: 5.00, inventoryId: null },
  { id: 'menu-11', name: 'Matcha Latte', category: 'Tea', price: 5.50, inventoryId: null },
  { id: 'menu-12', name: 'Black Tea', category: 'Tea', price: 3.50, inventoryId: null },
  { id: 'menu-13', name: 'Green Tea', category: 'Tea', price: 3.50, inventoryId: null },
  // Pastries (linked to inventory)
  { id: 'menu-14', name: 'Croissant', category: 'Pastries', price: 3.50, inventoryId: 'inv-7' },
  { id: 'menu-15', name: 'Cookie', category: 'Pastries', price: 2.50, inventoryId: 'inv-8' },
  // Fridge drinks (linked to inventory)
  { id: 'menu-16', name: 'Sparkling Water', category: 'Fridge Drinks', price: 2.50, inventoryId: 'inv-1' },
  { id: 'menu-17', name: 'Canned Juice', category: 'Fridge Drinks', price: 3.00, inventoryId: 'inv-2' },
  { id: 'menu-18', name: 'Protein Shake', category: 'Fridge Drinks', price: 5.50, inventoryId: 'inv-3' },
  // Fridge food
  { id: 'menu-19', name: 'Burrito', category: 'Food', price: 9.00, inventoryId: 'inv-5' },
  { id: 'menu-20', name: 'Sandwich', category: 'Food', price: 8.50, inventoryId: 'inv-6' },
]

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
  function recordSale(lineItems) {
    // lineItems: [{ menuItemId, name, category, price, quantity }]
    const saleTotal = lineItems.reduce((sum, li) => sum + li.price * li.quantity, 0)
    const sale = {
      id: `sale-${Date.now()}`,
      timestamp: new Date().toISOString(),
      items: lineItems,
      total: saleTotal,
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