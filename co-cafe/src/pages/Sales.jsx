import { useState, useMemo } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import {
  Plus, TrendingUp, DollarSign, ShoppingBag, Trash2,
  BookOpen, Clock, ChevronDown, ChevronRight,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import NavBar from '../components/NavBar'
import SaleEntryModal from '../components/SaleEntryModal'
import AddMenuItemModal from '../components/AddMenuItemModal'

const PIE_COLORS = ['#C4813A', '#3D1F10', '#6B3A24', '#4A7C59', '#5A6A8A', '#8A5A5A', '#B8A040', '#40788A']

// ── Date / time helpers ───────────────────────────────────────────────────────

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function fmtDate(iso) {
  const d   = new Date(iso)
  const now = new Date()
  const yes = new Date(now); yes.setDate(yes.getDate() - 1)
  if (d.toDateString() === now.toDateString()) return 'Today'
  if (d.toDateString() === yes.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' })
}

// ── Data helpers ──────────────────────────────────────────────────────────────

function calcStats(sales) {
  const totalRevenue      = sales.reduce((s, t) => s + t.total, 0)
  const totalTransactions = sales.length
  const avgOrder          = totalTransactions ? totalRevenue / totalTransactions : 0
  return { totalRevenue, totalTransactions, avgOrder }
}

function hourlyBarData(sales) {
  const hours = {}
  for (let h = 6; h <= 22; h++) hours[h] = 0
  sales.forEach(s => {
    const h = new Date(s.timestamp).getHours()
    if (hours[h] !== undefined) hours[h] += s.total
  })
  return Object.entries(hours).map(([h, v]) => ({
    label:   `${+h > 12 ? +h - 12 : +h}${+h >= 12 ? 'pm' : 'am'}`,
    revenue: parseFloat(v.toFixed(2)),
  }))
}

function catPieData(sales) {
  const map = {}
  sales.forEach(sale => {
    sale.items.forEach(item => {
      map[item.category] = (map[item.category] || 0) + item.price * item.quantity
    })
  })
  return Object.entries(map).map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TransactionList({ sales, onDelete }) {
  if (sales.length === 0) return null
  return (
    <div>
      {[...sales].reverse().map((sale, idx) => (
        <div key={sale.id} style={{
          display: 'flex', alignItems: 'center', gap: 'var(--s4)',
          padding: 'var(--s3) var(--s5)',
          borderTop: idx === 0 ? 'none' : '1px solid var(--border)',
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 500, marginBottom: 2 }}>
              {sale.items.map(i => `${i.name}${i.quantity > 1 ? ` ×${i.quantity}` : ''}`).join(', ')}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {fmtTime(sale.timestamp)}
              {sale.subtotal != null && (
                <span style={{ marginLeft: 8, opacity: 0.8 }}>
                  Subtotal ${sale.subtotal.toFixed(2)} · Tax ${sale.tax.toFixed(2)}
                </span>
              )}
            </div>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--accent)' }}>
            ${sale.total.toFixed(2)}
          </span>
          {onDelete && (
            <button className="btn-icon danger" style={{ width: 28, height: 28 }} onClick={() => onDelete(sale.id)}>
              <Trash2 size={12} />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

function DayCharts({ sales }) {
  const barData = useMemo(() => hourlyBarData(sales), [sales])
  const catData = useMemo(() => catPieData(sales),    [sales])

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 'var(--s4)', marginBottom: 'var(--s5)' }}>
      <div className="card" style={{ padding: 'var(--s4) var(--s5)' }}>
        <p style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 'var(--s4)' }}>
          Revenue by Hour
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
            <Tooltip
              contentStyle={{ background: 'var(--espresso)', border: 'none', borderRadius: 8, color: 'var(--cream)', fontSize: 12 }}
              formatter={v => [`$${v}`, 'Revenue']}
            />
            <Bar dataKey="revenue" fill="var(--caramel)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card" style={{ padding: 'var(--s4) var(--s5)' }}>
        <p style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 'var(--s3)' }}>
          By Category
        </p>
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie data={catData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
              {catData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
            </Pie>
            <Tooltip
              contentStyle={{ background: 'var(--espresso)', border: 'none', borderRadius: 8, color: 'var(--cream)', fontSize: 12 }}
              formatter={v => [`$${v}`, 'Revenue']}
            />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 'var(--s2)' }}>
          {catData.map((d, i) => (
            <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
              <span style={{ flex: 1, color: 'var(--text-secondary)' }}>{d.name}</span>
              <span style={{ fontWeight: 600 }}>${d.value.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Sales() {
  const { shifts, activeShift, isOpen, deleteSale, deleteShift } = useApp()
  const [showSaleModal,  setShowSaleModal]  = useState(false)
  const [showMenuModal,  setShowMenuModal]  = useState(false)
  const [expandedShifts, setExpandedShifts] = useState({})

  const todayStr  = new Date().toDateString()
  const pastShifts = useMemo(
    () => [...shifts].filter(s => new Date(s.startedAt).toDateString() !== todayStr).reverse(),
    [shifts, todayStr]
  )
  const activeStats = useMemo(() => activeShift ? calcStats(activeShift.sales) : null, [activeShift])
  const hasSalesToday = activeShift && activeShift.sales.length > 0

  function toggleShift(id) {
    setExpandedShifts(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <NavBar />

      <div className="page" style={{ maxWidth: 1100 }}>

        {/* Header */}
        <div className="section-header anim-slide-up" style={{ marginTop: 'var(--s5)' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)' }}>Sales</h2>
            <p className="text-muted text-sm" style={{ marginTop: 4 }}>
              {hasSalesToday
                ? `${activeShift.sales.length} transaction${activeShift.sales.length !== 1 ? 's' : ''} today`
                : 'No sales recorded today'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 'var(--s2)', alignItems: 'center' }}>
            <button className="btn btn-ghost" onClick={() => setShowMenuModal(true)}>
              <BookOpen size={14} /> Menu
            </button>
            <button className="btn btn-primary" onClick={() => setShowSaleModal(true)}>
              <Plus size={15} /> New Sale
            </button>
          </div>
        </div>

        {/* Status bar */}
        <div className="anim-fade-in" style={{
          display:       'flex',
          alignItems:    'center',
          gap:           'var(--s3)',
          padding:       'var(--s3) var(--s5)',
          background:    isOpen ? 'rgba(74,124,89,0.08)' : 'rgba(184,64,64,0.06)',
          border:        `1px solid ${isOpen ? 'rgba(74,124,89,0.25)' : 'rgba(184,64,64,0.15)'}`,
          borderRadius:  'var(--r2)',
          marginBottom:  'var(--s5)',
          fontSize:      '0.85rem',
          flexWrap:      'wrap',
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: isOpen ? 'var(--success)' : 'var(--danger)',
            flexShrink: 0,
          }} />
          <span style={{ color: isOpen ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
            {isOpen ? 'Open' : 'Closed'}
          </span>
          <span style={{ color: 'var(--text-muted)' }}>·</span>
          <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={12} /> 8:00 AM – 3:00 PM
          </span>
        </div>

        {/* ── Today's content ── */}
        {hasSalesToday ? (
          <>
            {/* Stat cards */}
            <div className="grid-3 anim-slide-up" style={{ marginBottom: 'var(--s5)' }}>
              {[
                { label: 'Revenue',      value: `$${activeStats.totalRevenue.toFixed(2)}`,   icon: DollarSign,  color: 'var(--success)' },
                { label: 'Transactions', value: activeStats.totalTransactions,                icon: ShoppingBag, color: 'var(--accent)'  },
                { label: 'Avg Order',    value: `$${activeStats.avgOrder.toFixed(2)}`,        icon: TrendingUp,  color: '#5A6A8A'        },
              ].map(({ label, value, icon: Icon, color }, i) => (
                <div key={label} className={`card delay-${i + 1}`} style={{ padding: 'var(--s4) var(--s5)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
                      <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700, lineHeight: 1 }}>{value}</p>
                    </div>
                    <div style={{ padding: 10, borderRadius: 'var(--r2)', background: `${color}18` }}>
                      <Icon size={18} color={color} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts */}
            <DayCharts sales={activeShift.sales} />

            {/* Transaction log */}
            <div className="card anim-fade-in" style={{ overflow: 'hidden', marginBottom: 'var(--s4)' }}>
              <div style={{ padding: 'var(--s3) var(--s5)', background: 'var(--latte)', borderBottom: '1px solid var(--border)' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.95rem' }}>Transaction Log</p>
              </div>
              <TransactionList sales={activeShift.sales} onDelete={deleteSale} />
            </div>
          </>
        ) : (
          /* ── No sales yet today ── */
          <div className="anim-fade-in" style={{
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            justifyContent: 'center',
            padding:        'var(--s8) var(--s6)',
            textAlign:      'center',
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: isOpen ? 'rgba(196,129,58,0.1)' : 'rgba(184,64,64,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 'var(--s4)',
            }}>
              <ShoppingBag size={26} color={isOpen ? 'var(--accent)' : 'var(--danger)'} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 'var(--s2)' }}>
              {isOpen ? 'Ready to Record' : 'Cafe Closed'}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 'var(--s5)', maxWidth: 320 }}>
              {isOpen
                ? 'No sales recorded yet today. Press New Sale to get started.'
                : 'Sales are recorded between 8:00 AM and 3:00 PM. Check back when the cafe opens.'}
            </p>
            {isOpen && (
              <button
                className="btn btn-primary"
                style={{ fontSize: '1rem', padding: 'var(--s3) var(--s6)' }}
                onClick={() => setShowSaleModal(true)}
              >
                <Plus size={16} /> Record First Sale
              </button>
            )}
          </div>
        )}

        {/* ── Day history ── */}
        {pastShifts.length > 0 && (
          <div style={{ marginTop: hasSalesToday ? 'var(--s4)' : 0 }} className="anim-fade-in">
            <p style={{
              fontFamily: 'var(--font-display)', fontWeight: 600,
              fontSize: '1rem', color: 'var(--text-secondary)',
              marginBottom: 'var(--s3)',
            }}>
              Day History
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s2)' }}>
              {pastShifts.map(shift => {
                const stats    = calcStats(shift.sales)
                const expanded = expandedShifts[shift.id]
                const cats     = catPieData(shift.sales)

                return (
                  <div key={shift.id} className="card" style={{ overflow: 'hidden' }}>

                    {/* Summary row */}
                    <button
                      onClick={() => toggleShift(shift.id)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center',
                        gap: 'var(--s3)', padding: 'var(--s3) var(--s5)',
                        background: 'var(--latte)', border: 'none',
                        cursor: 'pointer', textAlign: 'left',
                        transition: 'background var(--t-fast)',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#dfd0bc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'var(--latte)'}
                    >
                      {expanded
                        ? <ChevronDown  size={14} color="var(--text-muted)" />
                        : <ChevronRight size={14} color="var(--text-muted)" />
                      }

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.9rem' }}>
                          {fmtDate(shift.startedAt)}
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginLeft: 'var(--s2)' }}>
                          8:00 AM – 3:00 PM
                          <span style={{ marginLeft: 6, opacity: 0.7 }}>· 7h</span>
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s4)' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {stats.totalTransactions} sale{stats.totalTransactions !== 1 ? 's' : ''}
                        </span>
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--accent)', fontSize: '0.95rem' }}>
                          ${stats.totalRevenue.toFixed(2)}
                        </span>
                      </div>
                    </button>

                    {/* Expanded detail */}
                    {expanded && (
                      <div style={{ padding: 'var(--s4) var(--s5)' }}>

                        {/* Mini stats */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'var(--s3)', marginBottom: 'var(--s4)' }}>
                          {[
                            { label: 'Revenue',      value: `$${stats.totalRevenue.toFixed(2)}`  },
                            { label: 'Transactions', value: stats.totalTransactions              },
                            { label: 'Avg Order',    value: `$${stats.avgOrder.toFixed(2)}`      },
                          ].map(({ label, value }) => (
                            <div key={label} style={{
                              padding: 'var(--s3) var(--s4)',
                              background: 'var(--surface)', borderRadius: 'var(--r2)',
                              border: '1px solid var(--border)',
                            }}>
                              <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 2 }}>{label}</p>
                              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem' }}>{value}</p>
                            </div>
                          ))}
                        </div>

                        {/* Category pills */}
                        {cats.length > 0 && (
                          <div style={{ marginBottom: 'var(--s4)' }}>
                            <p style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 'var(--s2)' }}>
                              By Category
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--s2)' }}>
                              {cats.map((d, i) => (
                                <div key={d.name} style={{
                                  display: 'flex', alignItems: 'center', gap: 6,
                                  padding: '4px 10px', borderRadius: 'var(--r-pill)',
                                  background: `${PIE_COLORS[i % PIE_COLORS.length]}22`,
                                  fontSize: '0.75rem',
                                }}>
                                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length] }} />
                                  <span style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                                  <span style={{ fontWeight: 600 }}>${d.value.toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Transactions */}
                        {shift.sales.length > 0 ? (
                          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r2)', overflow: 'hidden', marginBottom: 'var(--s4)' }}>
                            <p style={{
                              padding: 'var(--s2) var(--s4)',
                              fontSize: '0.7rem', fontWeight: 600,
                              textTransform: 'uppercase', letterSpacing: '0.08em',
                              color: 'var(--text-muted)',
                              borderBottom: '1px solid var(--border)',
                              background: 'var(--surface)',
                            }}>
                              Transactions
                            </p>
                            <TransactionList sales={shift.sales} onDelete={null} />
                          </div>
                        ) : (
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 'var(--s4)' }}>
                            No sales recorded this day.
                          </p>
                        )}

                        {/* Delete day */}
                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 'var(--s3)', display: 'flex', justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-ghost"
                            style={{ color: 'var(--danger)', fontSize: '0.8rem' }}
                            onClick={() => deleteShift(shift.id)}
                          >
                            <Trash2 size={13} /> Delete Day
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>

      {showSaleModal && <SaleEntryModal onClose={() => setShowSaleModal(false)} />}
      {showMenuModal && <AddMenuItemModal onClose={() => setShowMenuModal(false)} />}
    </div>
  )
}
