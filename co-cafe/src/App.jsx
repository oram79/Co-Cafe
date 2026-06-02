import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import Landing   from './pages/Landing'
import Inventory from './pages/Inventory'
import Sales     from './pages/Sales'
import Guidebook from './pages/Guidebook'

export default function App() {
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