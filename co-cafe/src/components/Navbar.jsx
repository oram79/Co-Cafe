import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Coffee } from 'lucide-react'

const PAGE_TITLES = {
  '/inventory': 'Inventory',
  '/sales':     'Sales',
  '/guidebook': 'Guidebook',
}

export default function NavBar() {
  const navigate  = useNavigate()
  const { pathname } = useLocation()
  const title = PAGE_TITLES[pathname] || 'Cape Coffee'

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--s3)',
      padding: 'var(--s4) var(--s6)',
      background: 'var(--espresso)',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <button
        className="btn-icon"
        onClick={() => navigate('/')}
        style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--cream)' }}
        title="Back to home"
      >
        <ArrowLeft size={16} />
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s2)' }}>
        <Coffee size={18} color="var(--caramel)" />
        <span style={{
          fontFamily: 'var(--font-display)',
          color: 'var(--cream)',
          fontSize: '0.8rem',
          opacity: 0.5,
          letterSpacing: '0.06em',
        }}>
          CAPE COFFEE
        </span>
        <span style={{ color: 'rgba(255,255,255,0.25)', margin: '0 4px' }}>/</span>
        <span style={{
          fontFamily: 'var(--font-display)',
          color: 'var(--cream)',
          fontSize: '0.95rem',
          fontWeight: 600,
        }}>
          {title}
        </span>
      </div>
    </nav>
  )
}