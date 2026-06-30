import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import Landing   from './pages/Landing'
import Inventory from './pages/Inventory'
import Sales     from './pages/Sales'
import Guidebook from './pages/Guidebook'
import Login     from './pages/Login'
import { GUEST_DATA } from './data/guestData'

function readAuth() {
  try { return localStorage.getItem('cc_authed') === 'true' } catch { return false }
}
function readRole() {
  try { return localStorage.getItem('cc_role') || 'admin' } catch { return 'admin' }
}

function seedGuestData() {
  try {
    localStorage.setItem('cc_guest_inventory',  JSON.stringify(GUEST_DATA.inventory))
    localStorage.setItem('cc_guest_menu',        JSON.stringify(GUEST_DATA.menu))
    localStorage.setItem('cc_guest_shifts',      JSON.stringify(GUEST_DATA.shifts))
    localStorage.setItem('cc_guest_checklists',  JSON.stringify(GUEST_DATA.checklists))
    localStorage.setItem('cc_guest_orderlist',   JSON.stringify(GUEST_DATA.orderList))
    localStorage.setItem('cc_guest_cleaning',    JSON.stringify(GUEST_DATA.cleaningSchedule))
    localStorage.setItem('cc_guest_recipes',     JSON.stringify(GUEST_DATA.recipes))
  } catch {}
}

export default function App() {
  const [authed, setAuthed] = useState(readAuth)
  const [role,   setRole]   = useState(readRole)

  function handleLogin(role = 'admin') {
    try {
      localStorage.setItem('cc_authed', 'true')
      localStorage.setItem('cc_role', role)
      if (role === 'guest') seedGuestData()
    } catch {}
    setRole(role)
    setAuthed(true)
  }

  if (!authed) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <AppProvider role={role}>
      <BrowserRouter>
        <Routes>
          <Route path="/"          element={<Landing />}   />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/sales"     element={<Sales />}     />
          <Route path="/guidebook" element={<Guidebook />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}
