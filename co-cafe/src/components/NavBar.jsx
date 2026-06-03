import { useNavigate, useLocation } from 'react-router-dom'
import { Package, BarChart2, BookOpen } from 'lucide-react'

const NAV_LINKS = [
  { path: '/inventory', icon: Package,  label: 'Inventory' },
  { path: '/sales',     icon: BarChart2, label: 'Sales'     },
  { path: '/guidebook', icon: BookOpen,  label: 'Guidebook' },
]

export default function NavBar() {
  const navigate       = useNavigate()
  const { pathname }   = useLocation()

  return (
    <nav style={{
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'space-between',
      padding:        'var(--s3) var(--s6)',
      background:     'var(--espresso)',
      borderBottom:   '1px solid rgba(255,255,255,0.08)',
      position:       'sticky',
      top:            0,
      zIndex:         50,
    }}>
      {/* Brand */}
      <button
        onClick={() => navigate('/')}
        style={{
          background:    'none',
          border:        'none',
          cursor:        'pointer',
          padding:       'var(--s1) var(--s2)',
          borderRadius:  'var(--r1)',
          display:       'flex',
          alignItems:    'center',
          gap:           'var(--s2)',
          transition:    'opacity 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '0.75' }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
        title="Home"
      >
        <span style={{
          fontFamily:    'var(--font-display)',
          color:         'var(--caramel)',
          fontSize:      '1rem',
          fontWeight:    700,
          letterSpacing: '0.02em',
        }}>
          Co. Cafe
        </span>
      </button>

      {/* Nav links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s1)' }}>
        {NAV_LINKS.map(({ path, icon: Icon, label }) => {
          const active = pathname === path
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              style={{
                display:      'flex',
                alignItems:   'center',
                gap:          'var(--s2)',
                padding:      'var(--s2) var(--s3)',
                background:   active ? 'rgba(196,129,58,0.15)' : 'transparent',
                border:       active ? '1px solid rgba(196,129,58,0.35)' : '1px solid transparent',
                borderRadius: 'var(--r2)',
                cursor:       'pointer',
                transition:   'all 0.15s ease',
                color:        active ? 'var(--caramel)' : 'var(--fog)',
              }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                  e.currentTarget.style.color      = 'var(--cream)'
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color      = 'var(--fog)'
                }
              }}
            >
              <Icon size={15} />
              <span style={{
                fontFamily:    'var(--font-display)',
                fontSize:      '0.82rem',
                fontWeight:    active ? 600 : 500,
                letterSpacing: '0.03em',
              }}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
