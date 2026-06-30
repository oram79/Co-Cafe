import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import Landing   from './pages/Landing'
import Inventory from './pages/Inventory'
import Sales     from './pages/Sales'
import Guidebook from './pages/Guidebook'
import Login     from './pages/Login'

function readAuth() {
  try { return localStorage.getItem('cc_authed') === 'true' } catch { return false }
}
function readRole() {
  try { return localStorage.getItem('cc_role') || 'admin' } catch { return 'admin' }
}

export default function App() {
  const [authed, setAuthed] = useState(readAuth)
  const [role,   setRole]   = useState(readRole)

  function handleLogin(role = 'admin') {
    try {
      localStorage.setItem('cc_authed', 'true')
      localStorage.setItem('cc_role', role)
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
