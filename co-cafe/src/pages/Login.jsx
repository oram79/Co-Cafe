import { useState } from 'react'
import { Lock, Coffee } from 'lucide-react'

// ── Change these credentials to whatever you want ──────────────────────────
const ADMIN_USERNAME = 'cocafe2026'
const ADMIN_PASSWORD = '710torbayroad'
const GUEST_USERNAME = 'Guest123'
const GUEST_PASSWORD = 'Password123'
// ──────────────────────────────────────────────────────────────────────────

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (!username || !password) return
    setLoading(true)
    setError('')

    setTimeout(() => {
      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        onLogin('admin')
      } else if (username === GUEST_USERNAME && password === GUEST_PASSWORD) {
        onLogin('guest')
      } else {
        setError('Incorrect username or password.')
        setLoading(false)
      }
    }, 350)
  }

  function loginAsGuest() {
    setLoading(true)
    setTimeout(() => onLogin('guest'), 250)
  }

  return (
    <div style={{
      minHeight:      '100vh',
      background:     'linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 100%)',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        'var(--s5)',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--s7)' }}>
          <div style={{
            display:         'inline-flex',
            alignItems:      'center',
            justifyContent:  'center',
            width:           56,
            height:          56,
            borderRadius:    '50%',
            background:      'rgba(160,100,70,0.18)',
            border:          '1px solid rgba(160,100,70,0.35)',
            marginBottom:    'var(--s4)',
            boxShadow:       '0 0 24px rgba(160,100,70,0.15)',
          }}>
            <Coffee size={24} color="#B87755" />
          </div>

          <h1 style={{
            fontFamily:    'var(--font-display)',
            color:         '#B87755',
            fontSize:      '2rem',
            fontWeight:    700,
            letterSpacing: '0.02em',
            lineHeight:    1,
            marginBottom:  'var(--s3)',
          }}>
            Co. Cafe
          </h1>

          <div style={{
            display:       'inline-flex',
            alignItems:    'center',
            gap:           6,
            padding:       '5px 14px',
            background:    'rgba(184,64,64,0.1)',
            border:        '1px solid rgba(184,64,64,0.22)',
            borderRadius:  'var(--r-pill)',
            fontSize:      '0.7rem',
            fontWeight:    600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color:         'var(--danger)',
          }}>
            <Lock size={10} />
            Admin Access Only
          </div>
        </div>

        {/* Card */}
        <div className="card-elevated" style={{ padding: 'var(--s6)' }}>
          <h3 style={{
            fontFamily:   'var(--font-display)',
            fontSize:     '1.2rem',
            marginBottom: 'var(--s2)',
          }}>
            Sign In
          </h3>
          <p style={{
            color:        'var(--text-muted)',
            fontSize:     '0.85rem',
            marginBottom: 'var(--s5)',
            lineHeight:   1.5,
          }}>
            Enter your login to access the full application.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s4)' }}>

            <div>
              <label className="label">Username</label>
              <input
                className="input-field"
                type="text"
                value={username}
                onChange={e => { setUsername(e.target.value); setError('') }}
                placeholder="Enter username"
                autoComplete="username"
                autoFocus
              />
            </div>

            <div>
              <label className="label">Password</label>
              <input
                className="input-field"
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                placeholder="Enter Password"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div style={{
                padding:      'var(--s3) var(--s4)',
                background:   'rgba(184,64,64,0.08)',
                border:       '1px solid rgba(184,64,64,0.22)',
                borderRadius: 'var(--r2)',
                color:        'var(--danger)',
                fontSize:     '0.85rem',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{
                marginTop:       'var(--s1)',
                width:           '100%',
                justifyContent:  'center',
                padding:         'var(--s3) var(--s4)',
                opacity:         (loading || !username || !password) ? 0.6 : 1,
                cursor:          (loading || !username || !password) ? 'not-allowed' : 'pointer',
              }}
              disabled={loading || !username || !password}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>

          </form>
        </div>

        {/* Guest access */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s3)', marginTop: 'var(--s4)' }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(184,169,154,0.2)' }} />
          <span style={{ fontSize: '0.72rem', color: 'rgba(184,169,154,0.45)', whiteSpace: 'nowrap' }}>or</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(184,169,154,0.2)' }} />
        </div>

        <button
          onClick={loginAsGuest}
          disabled={loading}
          style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            6,
            width:          '100%',
            marginTop:      'var(--s3)',
            padding:        'var(--s3) var(--s4)',
            borderRadius:   'var(--r2)',
            border:         '1px solid rgba(184,169,154,0.2)',
            background:     'rgba(184,169,154,0.06)',
            color:          'rgba(184,169,154,0.6)',
            fontSize:       '0.875rem',
            cursor:         loading ? 'not-allowed' : 'pointer',
            transition:     'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'rgba(184,169,154,0.9)'; e.currentTarget.style.borderColor = 'rgba(184,169,154,0.4)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(184,169,154,0.6)'; e.currentTarget.style.borderColor = 'rgba(184,169,154,0.2)' }}
        >
          Continue as Guest
        </button>

        <p style={{
          textAlign:  'center',
          marginTop:  'var(--s3)',
          fontSize:   '0.75rem',
          color:      'rgba(184,169,154,0.35)',
          lineHeight: 1.5,
        }}>
          Guest access is view-only — no changes can be made.
        </p>

      </div>
    </div>
  )
}
