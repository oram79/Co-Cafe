import { BookOpen, Wrench } from 'lucide-react'
import NavBar from '../components/NavBar'

export default function Guidebook() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <NavBar />

      <div className="page" style={{ maxWidth: 700 }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 120px)',
          textAlign: 'center',
          gap: 'var(--s4)',
        }}>

          {/* Icon stack */}
          <div style={{ position: 'relative', marginBottom: 'var(--s3)' }}>
            <div style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'var(--latte)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
            }}>
              <BookOpen size={32} color="var(--mahogany)" />
            </div>
            <div style={{
              position: 'absolute',
              bottom: -4,
              right: -4,
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Wrench size={13} color="white" />
            </div>
          </div>

          <h2 style={{ fontFamily: 'var(--font-display)' }}>Guidebook</h2>

          <p style={{ color: 'var(--text-muted)', maxWidth: 380, lineHeight: 1.7 }}>
            This section is under construction. The Cape Coffee guidebook will include
            open & close checklists, brewing guides, cafe procedures, and more.
          </p>

          <div style={{
            marginTop: 'var(--s4)',
            padding: 'var(--s4) var(--s5)',
            background: 'var(--latte)',
            borderRadius: 'var(--r3)',
            border: '1px solid var(--border)',
            textAlign: 'left',
            width: '100%',
            maxWidth: 380,
          }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 'var(--s3)' }}>
              Coming Soon
            </p>
            {[
              'Open & close checklists',
              'Espresso dialing-in guide',
              'Milk steaming techniques',
              'Cleaning & maintenance log',
              'Emergency contacts & procedures',
            ].map(item => (
              <div key={item} style={{
                display: 'flex', alignItems: 'center', gap: 'var(--s2)',
                padding: 'var(--s2) 0',
                borderBottom: '1px solid var(--border)',
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--fog)', flexShrink: 0 }} />
                {item}
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}