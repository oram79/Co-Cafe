import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, BarChart2, BookOpen, ChevronRight, Download, Upload } from 'lucide-react'
import { useApp } from '../context/AppContext'
// Logo URL — place your logo.png in the public/ folder
const logoUrl    = '/logo2.png'
const bgLogoUrl  = '/logo.png'

const NAV_ITEMS = [
  {
    path: '/inventory',
    icon: Package,
    label: 'Inventory',
    desc: 'Track stock, manage items & supplies',
    accent: '#C4813A',
  },
  {
    path: '/sales',
    icon: BarChart2,
    label: 'Sales',
    desc: 'Log sales, view daily & monthly breakdowns',
    accent: '#4A7C59',
  },
  {
    path: '/guidebook',
    icon: BookOpen,
    label: 'Guidebook',
    desc: 'Cafe procedures, open/close checklists',
    accent: '#5A6A8A',
  },
]

export default function Landing() {
  const navigate    = useNavigate()
  const { exportData, importData } = useApp()
  const fileInputRef = useRef(null)

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      background: 'var(--espresso)',
    }}>

      {/* Background logo — full bleed, low opacity */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url(${bgLogoUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        opacity: 0.18,
        filter: 'blur(1px) saturate(0.4)',
      }} />

      {/* Radial vignette over the background */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse 80% 70% at 50% 50%, transparent 20%, rgba(26,15,10,0.85) 100%)',
        pointerEvents: 'none',
      }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: 'var(--s6)' }}>

        {/* Logo mark */}
        <div className="anim-fade-in" style={{ marginBottom: 'var(--s5)' }}>
          <img
            src={logoUrl}
            alt="Co. Cafe"
            style={{
              width: 100,
              height: 100,
              objectFit: 'cover',
              borderRadius: '50%',
              margin: '0 auto',
              boxShadow: '0 8px 40px rgba(196,129,58,0.3)',
              border: '2px solid rgba(196,129,58,0.35)',
            }}
          />
        </div>

        <h1
          className="anim-slide-up delay-1"
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--cream)',
            fontSize: 'clamp(2.4rem, 6vw, 4rem)',
            fontWeight: 700,
            letterSpacing: '-0.01em',
            lineHeight: 1.1,
            marginBottom: 'var(--s2)',
          }}
        >
          Co. Cafe
        </h1>

        <p
          className="anim-slide-up delay-2"
          style={{
            color: 'var(--fog)',
            fontSize: '0.95rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            marginBottom: 'var(--s3)',
          }}
        >
          Cafe Management System
        </p>

        {/* Export / Import — admin only */}
        <div className="anim-fade-in delay-2" style={{ display: 'flex', justifyContent: 'center', gap: 'var(--s2)', marginBottom: 'var(--s5)' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) importData(file)
              e.target.value = ''
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px',
              background: 'rgba(245,239,230,0.08)',
              border: '1px solid rgba(245,239,230,0.15)',
              borderRadius: 'var(--r2)',
              color: 'rgba(245,239,230,0.5)',
              fontSize: '0.72rem', cursor: 'pointer',
              backdropFilter: 'blur(8px)', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(245,239,230,0.9)'; e.currentTarget.style.borderColor = 'rgba(245,239,230,0.35)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(245,239,230,0.5)'; e.currentTarget.style.borderColor = 'rgba(245,239,230,0.15)' }}
          >
            <Upload size={12} /> Import
          </button>
          <button
            onClick={exportData}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px',
              background: 'rgba(245,239,230,0.08)',
              border: '1px solid rgba(245,239,230,0.15)',
              borderRadius: 'var(--r2)',
              color: 'rgba(245,239,230,0.5)',
              fontSize: '0.72rem', cursor: 'pointer',
              backdropFilter: 'blur(8px)', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(245,239,230,0.9)'; e.currentTarget.style.borderColor = 'rgba(245,239,230,0.35)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(245,239,230,0.5)'; e.currentTarget.style.borderColor = 'rgba(245,239,230,0.15)' }}
          >
            <Download size={12} /> Export
          </button>
        </div>

        {/* Nav buttons */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--s3)',
          width: '100%',
          maxWidth: 420,
          margin: '0 auto',
        }}>
          {NAV_ITEMS.map(({ path, icon: Icon, label, desc, accent }, i) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`anim-slide-up delay-${i + 3}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--s4)',
                padding: 'var(--s4) var(--s5)',
                background: 'rgba(245,239,230,0.06)',
                border: '1px solid rgba(245,239,230,0.12)',
                borderRadius: 'var(--r3)',
                backdropFilter: 'blur(12px)',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.22s ease',
                width: '100%',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(245,239,230,0.1)'
                e.currentTarget.style.borderColor = `${accent}55`
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.2)`
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(245,239,230,0.06)'
                e.currentTarget.style.borderColor = 'rgba(245,239,230,0.12)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--r2)',
                background: `${accent}22`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon size={20} color={accent} />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  color: 'var(--cream)',
                  fontSize: '1.05rem',
                  fontWeight: 600,
                  marginBottom: 2,
                }}>
                  {label}
                </div>
                <div style={{
                  color: 'var(--fog)',
                  fontSize: '0.78rem',
                }}>
                  {desc}
                </div>
              </div>

              <ChevronRight size={16} color="var(--fog)" />
            </button>
          ))}
        </div>

        {/* Footer */}
        <p
          className="anim-fade-in delay-5"
          style={{
            marginTop: 'var(--s7)',
            color: 'rgba(184,169,154,0.4)',
            fontSize: '0.72rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          St. John's, NL
        </p>

      </div>
    </div>
  )
}