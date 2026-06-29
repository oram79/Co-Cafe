import { useState, useMemo } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import {
  Plus, TrendingUp, DollarSign, ShoppingBag, Trash2,
  BookOpen, Clock, ChevronDown, ChevronRight, Award,
  Calendar, ArrowUpRight,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import NavBar from '../components/NavBar'
import SaleEntryModal from '../components/SaleEntryModal'
import AddMenuItemModal from '../components/AddMenuItemModal'

const PIE_COLORS = ['#C4813A', '#3D1F10', '#6B3A24', '#4A7C59', '#5A6A8A', '#8A5A5A', '#B8A040', '#40788A']

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function fmtDate(iso) {
  const d   = new Date(iso)
  const now = new Date()
  const yes = new Date(now); yes.setDate(yes.getDate() - 1)
  if (d.toDateString() === now.toDateString()) return 'Today'
  if (d.toDateString() === yes.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-CA', { weekday: 'long', month: 'short', day: 'numeric' })
}

function fmtDateShort(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' })
}

function calcStats(sales) {
  const totalRevenue      = sales.reduce((s, t) => s + t.total, 0)
  const totalTransactions = sales.length
  const avgOrder          = totalTransactions ? totalRevenue / totalTransactions : 0
  return { totalRevenue, totalTransactions, avgOrder }
}

function topItem(sales) {
  const counts = {}
  sales.forEach(sale => {
    sale.items.forEach(item => {
      counts[item.name] = (counts[item.name] || 0) + item.quantity
    })
  })
  const entries = Object.entries(counts)
  if (!entries.length) return null
  return entries.sort((a, b) => b[1] - a[1])[0]
}

function hourlyBarData(sales) {
  const hours = {}
  for (let h = 6; h <= 22; h++) hours[h] = 0
  sales.forEach(s => {
    const h = new Date(s.timestamp).getHours()
    if (hours[h] !== undefined) hours[h] += s.total
  })
  return Object.entries(hours).map(([h, v]) => ({
    label:   `${+h > 12 ? +h - 12 : +h === 0 ? 12 : +h}${+h >= 12 ? 'pm' : 'am'}`,
    revenue: parseFloat(v.toFixed(2)),
    hasData: v > 0,
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

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon: Icon, color, delay }) {
  return (
    <div className={`card delay-${delay}`} style={{
      padding: 'var(--s5)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--s3)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: 3, background: color, borderRadius: '14px 14px 0 0',
      }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <p style={{
          fontSize: '0.7rem', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.1em',
          color: 'var(--text-muted)',
        }}>{label}</p>
        <div style={{
          width: 36, height: 36, borderRadius: 'var(--r2)',
          background: `${color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={16} color={color} />
        </div>
      </div>
      <div>
        <p style={{
          fontFamily: 'var(--font-display)',
          fontSize: '2rem', fontWeight: 700,
          lineHeight: 1, color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
        }}>{value}</p>
        {sub && (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{sub}</p>
        )}
      </div>
    </div>
  )
}

// ── Charts ────────────────────────────────────────────────────────────────────

function DayCharts({ sales }) {
  const barData = useMemo(() => hourlyBarData(sales), [sales])
  const catData = useMemo(() => catPieData(sales),    [sales])
  const totalCat = catData.reduce((s, d) => s + d.value, 0)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 'var(--s4)', marginBottom: 'var(--s5)' }}>

      {/* Bar chart */}
      <div className="card" style={{ padding: 'var(--s5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--s4)' }}>
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.95rem' }}>Revenue by Hour</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>Sales performance throughout the day</p>
          </div>
          <div style={{
            padding: '4px 10px', borderRadius: 'var(--r-pill)',
            background: 'rgba(196,129,58,0.12)',
            fontSize: '0.72rem', fontWeight: 600, color: 'var(--accent)',
          }}>
            Today
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={barData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
              axisLine={false} tickLine={false}
              interval={1}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
              axisLine={false} tickLine={false}
              tickFormatter={v => `$${v}`}
            />
            <Tooltip
              cursor={{ fill: 'rgba(196,129,58,0.06)' }}
              contentStyle={{
                background: 'var(--espresso)', border: 'none',
                borderRadius: 8, color: 'var(--cream)', fontSize: 12,
                boxShadow: 'var(--shadow-lg)',
              }}
              formatter={v => [`$${v.toFixed(2)}`, 'Revenue']}
            />
            <Bar dataKey="revenue" fill="var(--caramel)" radius={[4, 4, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Category breakdown */}
      <div className="card" style={{ padding: 'var(--s5)' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.95rem', marginBottom: 2 }}>By Category</p>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 'var(--s4)' }}>Revenue split</p>

        {catData.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={130}>
              <PieChart>
                <Pie
                  data={catData}
                  cx="50%" cy="50%"
                  innerRadius={38} outerRadius={60}
                  paddingAngle={3} dataKey="value"
                  strokeWidth={0}
                >
                  {catData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--espresso)', border: 'none',
                    borderRadius: 8, color: 'var(--cream)', fontSize: 12,
                  }}
                  formatter={v => [`$${v.toFixed(2)}`, 'Revenue']}
                />
              </PieChart>
            </ResponsiveContainer>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 'var(--s3)' }}>
              {catData.map((d, i) => {
                const pct = totalCat > 0 ? (d.value / totalCat) * 100 : 0
                return (
                  <div key={d.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{d.name}</span>
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>${d.value.toFixed(2)}</span>
                    </div>
                    <div style={{ height: 3, background: 'var(--latte)', borderRadius: 'var(--r-pill)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: PIE_COLORS[i % PIE_COLORS.length],
                        borderRadius: 'var(--r-pill)',
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: 'var(--s6) 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            No category data yet
          </div>
        )}
      </div>
    </div>
  )
}

// ── Transaction Table ─────────────────────────────────────────────────────────

function TransactionTable({ sales, onDelete }) {
  if (sales.length === 0) return null
  const sorted = [...sales].reverse()

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {['Time', 'Items', 'Subtotal', 'Tax', 'Total', ''].map(col => (
              <th key={col} style={{
                padding: 'var(--s2) var(--s4)',
                textAlign: col === 'Total' || col === 'Subtotal' || col === 'Tax' ? 'right' : 'left',
                fontSize: '0.68rem', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.09em',
                color: 'var(--text-muted)',
                whiteSpace: 'nowrap',
              }}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((sale, idx) => (
            <tr
              key={sale.id}
              style={{
                borderBottom: idx < sorted.length - 1 ? '1px solid var(--border)' : 'none',
                transition: 'background var(--t-fast)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--latte)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <td style={{ padding: 'var(--s3) var(--s4)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                {fmtTime(sale.timestamp)}
              </td>
              <td style={{ padding: 'var(--s3) var(--s4)', maxWidth: 280 }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                  {sale.items.map(i => `${i.name}${i.quantity > 1 ? ` ×${i.quantity}` : ''}`).join(', ')}
                </span>
              </td>
              <td style={{ padding: 'var(--s3) var(--s4)', textAlign: 'right', color: 'var(--text-secondary)' }}>
                {sale.subtotal != null ? `$${sale.subtotal.toFixed(2)}` : '—'}
              </td>
              <td style={{ padding: 'var(--s3) var(--s4)', textAlign: 'right', color: 'var(--text-secondary)' }}>
                {sale.tax != null ? `$${sale.tax.toFixed(2)}` : '—'}
              </td>
              <td style={{ padding: 'var(--s3) var(--s4)', textAlign: 'right' }}>
                <span style={{
                  fontFamily: 'var(--font-display)', fontWeight: 700,
                  color: 'var(--accent)', fontSize: '0.9rem',
                }}>
                  ${sale.total.toFixed(2)}
                </span>
              </td>
              <td style={{ padding: 'var(--s3) var(--s4)', textAlign: 'right' }}>
                {onDelete && (
                  <button className="btn-icon danger" style={{ width: 28, height: 28 }} onClick={() => onDelete(sale.id)}>
                    <Trash2 size={11} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Sales() {
  const { shifts, activeShift, isOpen, deleteSale, deleteShift } = useApp()
  const [showSaleModal,  setShowSaleModal]  = useState(false)
  const [showMenuModal,  setShowMenuModal]  = useState(false)
  const [expandedShifts, setExpandedShifts] = useState({})
  const [showTxLog,      setShowTxLog]      = useState(true)

  const todayStr   = new Date().toDateString()
  const todayLabel = new Date().toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' })

  const pastShifts = useMemo(
    () => [...shifts].filter(s => new Date(s.startedAt).toDateString() !== todayStr).reverse(),
    [shifts, todayStr]
  )
  const activeStats = useMemo(() => activeShift ? calcStats(activeShift.sales) : null, [activeShift])
  const bestItem    = useMemo(() => activeShift ? topItem(activeShift.sales) : null, [activeShift])
  const hasSalesToday = activeShift && activeShift.sales.length > 0

  function toggleShift(id) {
    setExpandedShifts(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <NavBar />

      <div className="page" style={{ maxWidth: 1100 }}>

        {/* Header */}
        <div className="anim-slide-up" style={{
          display: 'flex', alignItems: 'flex-start',
          justifyContent: 'space-between', flexWrap: 'wrap',
          gap: 'var(--s3)',
          marginTop: 'var(--s5)', marginBottom: 'var(--s4)',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s2)', marginBottom: 4 }}>
              <Calendar size={14} color="var(--text-muted)" />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>{todayLabel}</span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', lineHeight: 1 }}>Sales</h2>
          </div>
          <div style={{ display: 'flex', gap: 'var(--s2)', alignItems: 'center' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowMenuModal(true)}>
              <BookOpen size={13} /> Menu
            </button>
            <button className="btn btn-primary" onClick={() => setShowSaleModal(true)}>
              <Plus size={15} /> New Sale
            </button>
          </div>
        </div>

        {/* Status bar */}
        <div className="anim-fade-in" style={{
          display: 'flex', alignItems: 'center', gap: 'var(--s3)',
          padding: 'var(--s3) var(--s4)',
          background: isOpen ? 'rgba(74,124,89,0.07)' : 'rgba(184,64,64,0.05)',
          border: `1px solid ${isOpen ? 'rgba(74,124,89,0.2)' : 'rgba(184,64,64,0.12)'}`,
          borderRadius: 'var(--r2)',
          marginBottom: 'var(--s5)',
          fontSize: '0.82rem', flexWrap: 'wrap',
        }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: isOpen ? 'var(--success)' : 'var(--danger)',
            flexShrink: 0,
            boxShadow: isOpen ? '0 0 6px rgba(74,124,89,0.5)' : 'none',
          }} />
          <span style={{ fontWeight: 700, color: isOpen ? 'var(--success)' : 'var(--danger)' }}>
            {isOpen ? 'Open' : 'Closed'}
          </span>
          <span style={{ color: 'var(--border-strong)' }}>·</span>
          <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={11} /> 8:00 AM – 3:00 PM
          </span>
          {hasSalesToday && (
            <>
              <span style={{ color: 'var(--border-strong)' }}>·</span>
              <span style={{ color: 'var(--text-muted)' }}>
                {activeShift.sales.length} transaction{activeShift.sales.length !== 1 ? 's' : ''} recorded
              </span>
            </>
          )}
        </div>

        {/* ── Today's content ── */}
        {hasSalesToday ? (
          <>
            {/* KPI Cards */}
            <div className="grid-4 anim-slide-up" style={{ marginBottom: 'var(--s5)' }}>
              <KpiCard
                label="Total Revenue"
                value={`$${activeStats.totalRevenue.toFixed(2)}`}
                sub="Today's earnings"
                icon={DollarSign}
                color="var(--success)"
                delay={1}
              />
              <KpiCard
                label="Transactions"
                value={activeStats.totalTransactions}
                sub={`Avg ${Math.round(60 * 7 / Math.max(activeStats.totalTransactions, 1))} min apart`}
                icon={ShoppingBag}
                color="var(--accent)"
                delay={2}
              />
              <KpiCard
                label="Avg Order"
                value={`$${activeStats.avgOrder.toFixed(2)}`}
                sub="Per transaction"
                icon={TrendingUp}
                color="#5A6A8A"
                delay={3}
              />
              <KpiCard
                label="Top Seller"
                value={bestItem ? bestItem[0] : '—'}
                sub={bestItem ? `${bestItem[1]} sold today` : 'No data yet'}
                icon={Award}
                color="#8A5A5A"
                delay={4}
              />
            </div>

            {/* Charts */}
            <DayCharts sales={activeShift.sales} />

            {/* Transaction Log */}
            <div className="card anim-fade-in" style={{ overflow: 'hidden', marginBottom: 'var(--s5)' }}>
              <button
                onClick={() => setShowTxLog(v => !v)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center',
                  gap: 'var(--s3)', padding: 'var(--s3) var(--s5)',
                  background: 'var(--latte)', border: 'none',
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'background var(--t-fast)',
                  borderBottom: showTxLog ? '1px solid var(--border)' : 'none',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#dfd0bc'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--latte)'}
              >
                {showTxLog
                  ? <ChevronDown  size={14} color="var(--text-muted)" />
                  : <ChevronRight size={14} color="var(--text-muted)" />
                }
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.95rem', flex: 1 }}>
                  Transaction Log
                </p>
                <span style={{
                  padding: '2px 10px', borderRadius: 'var(--r-pill)',
                  background: 'rgba(196,129,58,0.12)',
                  fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent)',
                }}>
                  {activeShift.sales.length} {activeShift.sales.length === 1 ? 'sale' : 'sales'}
                </span>
              </button>
              {showTxLog && (
                <TransactionTable sales={activeShift.sales} onDelete={deleteSale} />
              )}
            </div>
          </>
        ) : (
          /* ── No sales yet today ── */
          <div className="card anim-fade-in" style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: 'var(--s8) var(--s6)',
            textAlign: 'center',
            marginBottom: 'var(--s5)',
          }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              background: isOpen ? 'rgba(196,129,58,0.1)' : 'rgba(184,64,64,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 'var(--s4)',
            }}>
              <ShoppingBag size={24} color={isOpen ? 'var(--accent)' : 'var(--danger)'} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 'var(--s2)' }}>
              {isOpen ? 'Ready to Record' : 'Cafe Closed'}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: 300, marginBottom: isOpen ? 'var(--s5)' : 0 }}>
              {isOpen
                ? 'No sales recorded yet today. Press New Sale to get started.'
                : 'Sales are recorded between 8:00 AM and 3:00 PM. Check back when the cafe opens.'}
            </p>
            {isOpen && (
              <button className="btn btn-primary" onClick={() => setShowSaleModal(true)}>
                <Plus size={15} /> Record First Sale
              </button>
            )}
          </div>
        )}

        {/* ── Day History ── */}
        {pastShifts.length > 0 && (
          <div className="anim-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s3)', marginBottom: 'var(--s3)' }}>
              <p style={{
                fontFamily: 'var(--font-display)', fontWeight: 600,
                fontSize: '1rem', color: 'var(--text-secondary)',
              }}>
                Day History
              </p>
              <div style={{
                flex: 1, height: 1, background: 'var(--border)',
              }} />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {pastShifts.length} day{pastShifts.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s2)' }}>
              {pastShifts.map(shift => {
                const stats    = calcStats(shift.sales)
                const expanded = expandedShifts[shift.id]
                const cats     = catPieData(shift.sales)
                const best     = topItem(shift.sales)

                return (
                  <div key={shift.id} className="card" style={{ overflow: 'hidden' }}>

                    {/* Summary row */}
                    <button
                      onClick={() => toggleShift(shift.id)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center',
                        gap: 'var(--s3)', padding: 'var(--s4) var(--s5)',
                        background: 'none', border: 'none',
                        cursor: 'pointer', textAlign: 'left',
                        transition: 'background var(--t-fast)',
                        borderBottom: expanded ? '1px solid var(--border)' : 'none',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--latte)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{
                        width: 28, height: 28, borderRadius: 'var(--r2)',
                        background: 'var(--latte)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        {expanded
                          ? <ChevronDown  size={13} color="var(--text-muted)" />
                          : <ChevronRight size={13} color="var(--text-muted)" />
                        }
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.9rem' }}>
                          {fmtDate(shift.startedAt)}
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: 'var(--s2)' }}>
                          8:00 AM – 3:00 PM
                        </span>
                      </div>

                      {/* Inline stats */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s5)', flexShrink: 0 }}>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Sales</p>
                          <p style={{ fontWeight: 600, fontSize: '0.85rem' }}>{stats.totalTransactions}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Avg</p>
                          <p style={{ fontWeight: 600, fontSize: '0.85rem' }}>${stats.avgOrder.toFixed(2)}</p>
                        </div>
                        <div style={{ textAlign: 'right', minWidth: 72 }}>
                          <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Revenue</p>
                          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--accent)', fontSize: '1rem' }}>
                            ${stats.totalRevenue.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </button>

                    {/* Expanded detail */}
                    {expanded && (
                      <div style={{ padding: 'var(--s4) var(--s5)' }}>

                        {/* Mini stats */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 'var(--s3)', marginBottom: 'var(--s4)' }}>
                          {[
                            { label: 'Revenue',      value: `$${stats.totalRevenue.toFixed(2)}`,   color: 'var(--success)' },
                            { label: 'Transactions', value: stats.totalTransactions,                color: 'var(--accent)'  },
                            { label: 'Avg Order',    value: `$${stats.avgOrder.toFixed(2)}`,        color: '#5A6A8A'        },
                            { label: 'Top Item',     value: best ? best[0] : '—',                  color: '#8A5A5A'        },
                          ].map(({ label, value, color }) => (
                            <div key={label} style={{
                              padding: 'var(--s3) var(--s4)',
                              background: 'var(--surface)', borderRadius: 'var(--r2)',
                              border: '1px solid var(--border)',
                              borderTop: `2px solid ${color}`,
                            }}>
                              <p style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
                              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</p>
                            </div>
                          ))}
                        </div>

                        {/* Category pills */}
                        {cats.length > 0 && (
                          <div style={{ marginBottom: 'var(--s4)' }}>
                            <p style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--text-muted)', marginBottom: 'var(--s2)' }}>
                              Revenue by Category
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--s2)' }}>
                              {cats.map((d, i) => (
                                <div key={d.name} style={{
                                  display: 'flex', alignItems: 'center', gap: 6,
                                  padding: '4px 12px', borderRadius: 'var(--r-pill)',
                                  background: `${PIE_COLORS[i % PIE_COLORS.length]}18`,
                                  border: `1px solid ${PIE_COLORS[i % PIE_COLORS.length]}30`,
                                  fontSize: '0.75rem',
                                }}>
                                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length] }} />
                                  <span style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                                  <span style={{ fontWeight: 700 }}>${d.value.toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Transaction table */}
                        {shift.sales.length > 0 ? (
                          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r2)', overflow: 'hidden', marginBottom: 'var(--s4)' }}>
                            <div style={{
                              padding: 'var(--s2) var(--s4)',
                              background: 'var(--surface)',
                              borderBottom: '1px solid var(--border)',
                              fontSize: '0.68rem', fontWeight: 700,
                              textTransform: 'uppercase', letterSpacing: '0.09em',
                              color: 'var(--text-muted)',
                            }}>
                              Transactions
                            </div>
                            <TransactionTable sales={shift.sales} onDelete={null} />
                          </div>
                        ) : (
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 'var(--s4)' }}>
                            No sales recorded this day.
                          </p>
                        )}

                        {/* Delete day */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--danger)', borderColor: 'rgba(184,64,64,0.25)' }}
                            onClick={() => deleteShift(shift.id)}
                          >
                            <Trash2 size={12} /> Delete Day
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
