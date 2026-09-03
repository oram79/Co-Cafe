import { useNavigate, useLocation } from 'react-router-dom'
import { Package, BarChart2, BookOpen, LogOut, Sun, Moon } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useTheme } from '../hooks/useTheme'

function logout() {
  try {
    localStorage.removeItem('cc_authed')
    localStorage.removeItem('cc_role')
  } catch {}
  window.location.reload()
}

const NAV_LINKS = [
  { path: '/inventory', icon: Package,  label: 'Inventory' },
  { path: '/sales',     icon: BarChart2, label: 'Sales'     },
  { path: '/guidebook', icon: BookOpen,  label: 'Guidebook' },
]

export default function NavBar() {
  const navigate       = useNavigate()
  const { pathname }   = useLocation()
  const { isGuest }    = useApp()
  const [dark, toggleTheme] = useTheme()

  return (
    <nav className="nav-bar" style={{
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'space-between',
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
          padding:       '4px var(--s2)',
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
        <img
          src="/Co.Cafe.png"
          alt="Co. Cafe"
          style={{
            height:    64,
            width:     'auto',
            display:   'block',
          }}
        />
        {isGuest && (
          <span style={{
            fontSize:      '0.62rem',
            fontWeight:    700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color:         'rgba(184,169,154,0.6)',
            background:    'rgba(184,169,154,0.1)',
            border:        '1px solid rgba(184,169,154,0.2)',
            padding:       '2px 7px',
            borderRadius:  'var(--r-pill)',
          }}>
            Guest
          </span>
        )}
      </button>

      {/* Nav links + logout */}
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
              <span className="nav-label" style={{
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

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{
            display:      'flex',
            alignItems:   'center',
            justifyContent: 'center',
            width:        32,
            height:       32,
            background:   'transparent',
            border:       '1px solid rgba(255,255,255,0.12)',
            borderRadius: 'var(--r2)',
            cursor:       'pointer',
            color:        'var(--fog)',
            transition:   'all 0.15s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background  = 'rgba(255,255,255,0.08)'
            e.currentTarget.style.color       = 'var(--caramel)'
            e.currentTarget.style.borderColor = 'rgba(196,129,58,0.35)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background  = 'transparent'
            e.currentTarget.style.color       = 'var(--fog)'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
          }}
        >
          {dark ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          title="Sign out"
          style={{
            display:      'flex',
            alignItems:   'center',
            gap:          'var(--s2)',
            padding:      'var(--s2) var(--s3)',
            marginLeft:   'var(--s2)',
            background:   'transparent',
            border:       '1px solid rgba(255,255,255,0.12)',
            borderRadius: 'var(--r2)',
            cursor:       'pointer',
            transition:   'all 0.15s ease',
            color:        'var(--fog)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background   = 'rgba(184,64,64,0.15)'
            e.currentTarget.style.borderColor  = 'rgba(184,64,64,0.35)'
            e.currentTarget.style.color        = '#e07070'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background   = 'transparent'
            e.currentTarget.style.borderColor  = 'rgba(255,255,255,0.12)'
            e.currentTarget.style.color        = 'var(--fog)'
          }}
        >
          <LogOut size={14} />
          <span className="nav-label" style={{
            fontFamily:    'var(--font-display)',
            fontSize:      '0.82rem',
            fontWeight:    500,
            letterSpacing: '0.03em',
          }}>
            Sign Out
          </span>
        </button>
      </div>
    </nav>
  )
}
