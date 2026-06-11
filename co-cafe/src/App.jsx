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

export default function App() {
  const [authed, setAuthed] = useState(readAuth)

  function handleLogin() {
    try { localStorage.setItem('cc_authed', 'true') } catch {}
    setAuthed(true)
  }

  if (!authed) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <AppProvider>
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
