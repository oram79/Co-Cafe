import { useState, useMemo } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
} from 'recharts'
import {
  Plus, TrendingUp, DollarSign, ShoppingBag, Trash2,
  BookOpen, Clock, ChevronDown, ChevronRight, Award,
  Calendar, ArrowUp, ArrowDown, ArrowLeft,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import NavBar from '../components/NavBar'
import SaleEntryModal from '../components/SaleEntryModal'
import AddMenuItemModal from '../components/AddMenuItemModal'

const PIE_COLORS = ['#C4813A', '#3D1F10', '#6B3A24', '#4A7C59', '#5A6A8A', '#8A5A5A', '#B8A040', '#40788A']
const HISTORY_PAGE_SIZE = 5

const TT = {
  background: '#1A0F0A', border: 'none', borderRadius: 8,
  color: '#F5EFE6', fontSize: 12,
  boxShadow: '0 12px 32px rgba(26,15,10,0.25)',
}

// ── Formatters ────────────────────────────────────────────────────────────────

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function fmtDate(iso) {
  const d = new Date(iso), now = new Date()
  const yes = new Date(now); yes.setDate(yes.getDate() - 1)
  if (d.toDateString() === now.toDateString()) return 'Today'
  if (d.toDateString() === yes.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-CA', { weekday: 'long', month: 'short', day: 'numeric' })
}

// ── Data helpers ──────────────────────────────────────────────────────────────

function calcStats(sales) {
  const totalRevenue      = sales.reduce((s, t) => s + t.total, 0)
  const totalTransactions = sales.length
  const avgOrder          = totalTransactions ? totalRevenue / totalTransactions : 0
  return { totalRevenue, totalTransactions, avgOrder }
}

function topItem(sales) {
  const counts = {}
  sales.forEach(sale => sale.items.forEach(item => {
    counts[item.name] = (counts[item.name] || 0) + item.quantity
  }))
  const entries = Object.entries(counts)
  return entries.length ? entries.sort((a, b) => b[1] - a[1])[0] : null
}

function hourlyBarData(sales) {
  const hours = {}
  for (let h = 6; h <= 22; h++) hours[h] = 0
  sales.forEach(s => {
    const h = new Date(s.timestamp).getHours()
    if (hours[h] !== undefined) hours[h] += s.total
  })
  return Object.entries(hours).map(([h, v]) => ({
    label: `${+h > 12 ? +h - 12 : +h === 0 ? 12 : +h}${+h >= 12 ? 'pm' : 'am'}`,
    revenue: parseFloat(v.toFixed(2)),
  }))
}

function catPieData(sales) {
  const map = {}
  sales.forEach(sale => sale.items.forEach(item => {
    map[item.category] = (map[item.category] || 0) + item.price * item.quantity
  }))
  return Object.entries(map).map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
}

function getMondayOfWeek(date) {
  const d = new Date(date), dow = d.getDay()
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1))
  d.setHours(0, 0, 0, 0)
  return d
}

function weeklyDayData(shifts) {
  const now = new Date(), monday = getMondayOfWeek(now)
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label, i) => {
    const date   = new Date(monday); date.setDate(monday.getDate() + i)
    const dayStr = date.toDateString()
    const sales  = shifts.filter(s => new Date(s.startedAt).toDateString() === dayStr).flatMap(s => s.sales)
    return {
      label,
      revenue:      parseFloat(sales.reduce((sum, s) => sum + s.total, 0).toFixed(2)),
      transactions: sales.length,
      isToday:      dayStr === now.toDateString(),
      isFuture:     date > now && dayStr !== now.toDateString(),
      date,
    }
  })
}

function monthlyDayData(shifts) {
  const now = new Date(), year = now.getFullYear(), month = now.getMonth()
  const days = new Date(year, month + 1, 0).getDate()
  return Array.from({ length: days }, (_, i) => {
    const day = i + 1, date = new Date(year, month, day), dayStr = date.toDateString()
    const sales = shifts.filter(s => new Date(s.startedAt).toDateString() === dayStr).flatMap(s => s.sales)
    return {
      label:        String(day),
      day,
      revenue:      parseFloat(sales.reduce((sum, s) => sum + s.total, 0).toFixed(2)),
      transactions: sales.length,
      isToday:      dayStr === now.toDateString(),
      isFuture:     date > now,
    }
  })
}

function allTimeMonthlyData(shifts) {
  const byMonth = {}
  shifts.forEach(s => {
    const d = new Date(s.startedAt)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!byMonth[key]) byMonth[key] = {
      label: d.toLocaleDateString('en-CA', { month: 'short', year: '2-digit' }),
      revenue: 0, transactions: 0,
    }
    s.sales.forEach(sale => { byMonth[key].revenue += sale.total; byMonth[key].transactions++ })
  })
  return Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => ({ ...v, revenue: parseFloat(v.revenue.toFixed(2)) }))
}

function getWeekSales(shifts) {
  const monday = getMondayOfWeek(new Date())
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 7)
  return shifts.filter(s => { const d = new Date(s.startedAt); return d >= monday && d < sunday }).flatMap(s => s.sales)
}

function getLastWeekSales(shifts) {
  const thisMonday = getMondayOfWeek(new Date())
  const lastMonday = new Date(thisMonday); lastMonday.setDate(thisMonday.getDate() - 7)
  return shifts.filter(s => { const d = new Date(s.startedAt); return d >= lastMonday && d < thisMonday }).flatMap(s => s.sales)
}

function getMonthSales(shifts) {
  const now = new Date(), y = now.getFullYear(), m = now.getMonth()
  return shifts.filter(s => { const d = new Date(s.startedAt); return d.getFullYear() === y && d.getMonth() === m }).flatMap(s => s.sales)
}

function getLastMonthSales(shifts) {
  const now = new Date()
  const y = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
  const m = now.getMonth() === 0 ? 11 : now.getMonth() - 1
  const start = new Date(y, m, 1), end = new Date(y, m + 1, 0, 23, 59, 59)
  return shifts.filter(s => { const d = new Date(s.startedAt); return d >= start && d <= end }).flatMap(s => s.sales)
}

function topItems(shifts, limit = 5) {
  const counts = {}
  shifts.flatMap(s => s.sales).forEach(sale => sale.items.forEach(item => {
    if (!counts[item.name]) counts[item.name] = { name: item.name, qty: 0, revenue: 0 }
    counts[item.name].qty     += item.quantity
    counts[item.name].revenue += item.price * item.quantity
  }))
  return Object.values(counts).sort((a, b) => b.revenue - a.revenue).slice(0, limit)
    .map(i => ({ ...i, revenue: parseFloat(i.revenue.toFixed(2)) }))
}

// ── Shared UI pieces ──────────────────────────────────────────────────────────

function TrendBadge({ current, previous, label }) {
  if (!previous || previous === 0) return null
  const pct = (current - previous) / previous * 100
  const up  = pct >= 0
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      padding: '3px 9px', borderRadius: 'var(--r-pill)',
      background: up ? 'rgba(74,124,89,0.12)' : 'rgba(184,64,64,0.1)',
      color: up ? 'var(--success)' : 'var(--danger)',
      fontSize: '0.73rem', fontWeight: 700,
    }}>
      {up ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
      {Math.abs(pct).toFixed(1)}%{label ? ` ${label}` : ''}
    </span>
  )
}

function PeriodTabs({ value, onChange }) {
  const tabs = [
    { key: 'today', label: 'Today'      },
    { key: 'week',  label: 'This Week'  },
    { key: 'month', label: 'This Month' },
    { key: 'all',   label: 'All Time'   },
  ]
  return (
    <div style={{
      display: 'inline-flex', gap: 2, background: 'var(--surface)',
      padding: 3, borderRadius: 'var(--r3)', border: '1px solid var(--border)',
      marginBottom: 'var(--s5)',
    }}>
      {tabs.map(t => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          style={{
            padding: '6px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
            fontSize: '0.82rem', fontWeight: value === t.key ? 600 : 400,
            background: value === t.key ? 'var(--espresso)' : 'transparent',
            color: value === t.key ? 'var(--cream)' : 'var(--text-muted)',
            transition: 'all var(--t-fast)',
          }}
          onMouseEnter={e => { if (value !== t.key) e.currentTarget.style.color = 'var(--text-primary)' }}
          onMouseLeave={e => { if (value !== t.key) e.currentTarget.style.color = 'var(--text-muted)' }}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

function EmptyPeriod({ label }) {
  return (
    <div className="card" style={{
      padding: 'var(--s8) var(--s6)', textAlign: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--s3)',
    }}>
      <ShoppingBag size={28} color="var(--fog)" />
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{label}</p>
    </div>
  )
}

function TopItemsCard({ items, title }) {
  const maxRev = items[0]?.revenue || 1
  return (
    <div className="card" style={{ padding: 'var(--s5)' }}>
      <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.95rem', marginBottom: 'var(--s4)' }}>
        {title}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s3)' }}>
        {items.map((item, i) => (
          <div key={item.name}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s3)' }}>
                <span style={{
                  width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                  background: `${PIE_COLORS[i % PIE_COLORS.length]}22`,
                  color: 'var(--text-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.65rem', fontWeight: 800,
                }}>
                  {i + 1}
                </span>
                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{item.name}</span>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '0.875rem' }}>
                  ${item.revenue.toFixed(2)}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 6 }}>
                  ×{item.qty}
                </span>
              </div>
            </div>
            <div style={{ height: 3, background: 'var(--latte)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 99,
                width: `${(item.revenue / maxRev) * 100}%`,
                background: PIE_COLORS[i % PIE_COLORS.length],
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function BarLegend() {
  return (
    <div style={{ display: 'flex', gap: 'var(--s4)', marginTop: 'var(--s3)', justifyContent: 'flex-end' }}>
      {[{ color: '#C4813A', label: 'Past' }, { color: '#4A7C59', label: 'Today' }, { color: '#B8A99A', label: 'Future' }].map(({ color, label }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
          {label}
        </div>
      ))}
    </div>
  )
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon: Icon, color, delay }) {
  return (
    <div className={`card delay-${delay}`} style={{
      padding: 'var(--s5)', display: 'flex', flexDirection: 'column',
      gap: 'var(--s3)', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color, borderRadius: '14px 14px 0 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
          {label}
        </p>
        <div style={{ width: 36, height: 36, borderRadius: 'var(--r2)', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={16} color={color} />
        </div>
      </div>
      <div>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, lineHeight: 1, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          {value}
        </p>
        {sub && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{sub}</p>}
      </div>
    </div>
  )
}

// ── Today sub-components ──────────────────────────────────────────────────────

function DayCharts({ sales, label = 'Today' }) {
  const barData = useMemo(() => hourlyBarData(sales), [sales])
  const catData = useMemo(() => catPieData(sales),    [sales])
  const totalCat = catData.reduce((s, d) => s + d.value, 0)

  return (
    <div className="charts-grid">
      <div className="card" style={{ padding: 'var(--s5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--s4)' }}>
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.95rem' }}>Revenue by Hour</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>Sales performance throughout the day</p>
          </div>
          <div style={{ padding: '4px 10px', borderRadius: 'var(--r-pill)', background: 'rgba(196,129,58,0.12)', fontSize: '0.72rem', fontWeight: 600, color: 'var(--accent)' }}>
            {label}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={barData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} interval={1} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
            <Tooltip cursor={{ fill: 'rgba(196,129,58,0.06)' }} contentStyle={TT} formatter={v => [`$${v.toFixed(2)}`, 'Revenue']} />
            <Bar dataKey="revenue" fill="#C4813A" radius={[4, 4, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card" style={{ padding: 'var(--s5)' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.95rem', marginBottom: 2 }}>By Category</p>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 'var(--s4)' }}>Revenue split</p>
        {catData.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={130}>
              <PieChart>
                <Pie data={catData} cx="50%" cy="50%" innerRadius={38} outerRadius={60} paddingAngle={3} dataKey="value" strokeWidth={0}>
                  {catData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={TT} formatter={v => [`$${v.toFixed(2)}`, 'Revenue']} />
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
                      <div style={{ height: '100%', width: `${pct}%`, background: PIE_COLORS[i % PIE_COLORS.length], borderRadius: 'var(--r-pill)' }} />
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
                fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.09em', color: 'var(--text-muted)', whiteSpace: 'nowrap',
              }}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((sale, idx) => (
            <tr key={sale.id} style={{ borderBottom: idx < sorted.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background var(--t-fast)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--latte)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <td style={{ padding: 'var(--s3) var(--s4)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{fmtTime(sale.timestamp)}</td>
              <td style={{ padding: 'var(--s3) var(--s4)', maxWidth: 280 }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                  {sale.items.map(i => `${i.name}${i.quantity > 1 ? ` ×${i.quantity}` : ''}`).join(', ')}
                </span>
              </td>
              <td style={{ padding: 'var(--s3) var(--s4)', textAlign: 'right', color: 'var(--text-secondary)' }}>{sale.subtotal != null ? `$${sale.subtotal.toFixed(2)}` : '—'}</td>
              <td style={{ padding: 'var(--s3) var(--s4)', textAlign: 'right', color: 'var(--text-secondary)' }}>{sale.tax != null ? `$${sale.tax.toFixed(2)}` : '—'}</td>
              <td style={{ padding: 'var(--s3) var(--s4)', textAlign: 'right' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--accent)', fontSize: '0.9rem' }}>
                  ${sale.total.toFixed(2)}
                </span>
              </td>
              <td style={{ padding: 'var(--s3) var(--s4)', textAlign: 'right' }}>
                {onDelete && <button className="btn-icon danger" style={{ width: 28, height: 28 }} onClick={() => onDelete(sale.id)}><Trash2 size={11} /></button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Period views ──────────────────────────────────────────────────────────────

function WeekView({ shifts }) {
  const dayData    = useMemo(() => weeklyDayData(shifts), [shifts])
  const weekSales  = useMemo(() => getWeekSales(shifts),      [shifts])
  const lastWkRev  = useMemo(() => getLastWeekSales(shifts).reduce((s, x) => s + x.total, 0), [shifts])

  const revenue      = weekSales.reduce((sum, s) => sum + s.total, 0)
  const transactions = weekSales.length
  const daysActive   = dayData.filter(d => !d.isFuture && d.revenue > 0).length
  const avgDaily     = daysActive > 0 ? revenue / daysActive : 0
  const bestDay      = dayData.filter(d => !d.isFuture).reduce((best, d) => d.revenue > (best?.revenue || 0) ? d : best, null)
  const cats         = useMemo(() => catPieData(weekSales), [weekSales])
  const totalCat     = cats.reduce((s, d) => s + d.value, 0)

  const monday = getMondayOfWeek(new Date())
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6)
  const rangeLabel = `${monday.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })} – ${sunday.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}`

  if (!weekSales.length) return <EmptyPeriod label="No sales recorded this week yet." />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s4)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s3)' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{rangeLabel}</span>
        <TrendBadge current={revenue} previous={lastWkRev} label="vs last week" />
      </div>

      <div className="grid-4">
        <KpiCard label="Week Revenue"  value={`$${revenue.toFixed(2)}`}   sub={rangeLabel}                                                     icon={DollarSign}  color="#4A7C59" delay={1} />
        <KpiCard label="Transactions"  value={transactions}                sub="This week"                                                       icon={ShoppingBag} color="#C4813A" delay={2} />
        <KpiCard label="Avg Per Day"   value={`$${avgDaily.toFixed(2)}`}   sub={`${daysActive} active day${daysActive !== 1 ? 's' : ''}`}        icon={TrendingUp}  color="#5A6A8A" delay={3} />
        <KpiCard label="Best Day"      value={bestDay?.label ?? '—'}       sub={bestDay?.revenue ? `$${bestDay.revenue.toFixed(2)}` : 'No data'} icon={Award}       color="#8A5A5A" delay={4} />
      </div>

      <div className="card" style={{ padding: 'var(--s5)' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.95rem', marginBottom: 'var(--s4)' }}>Revenue by Day</p>
        <ResponsiveContainer width="100%" height={210}>
          <BarChart data={dayData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
            <Tooltip contentStyle={TT} formatter={v => [`$${v.toFixed(2)}`, 'Revenue']} />
            <Bar dataKey="revenue" radius={[5, 5, 0, 0]} maxBarSize={52}>
              {dayData.map((entry, i) => (
                <Cell key={i} fill={entry.isFuture ? '#B8A99A' : entry.isToday ? '#4A7C59' : '#C4813A'} fillOpacity={entry.isFuture ? 0.3 : 1} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <BarLegend />
      </div>

      {cats.length > 0 && (
        <div className="card" style={{ padding: 'var(--s5)' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.95rem', marginBottom: 'var(--s4)' }}>Revenue by Category</p>
          <div style={{ display: 'flex', gap: 'var(--s5)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <ResponsiveContainer width={130} height={120}>
              <PieChart>
                <Pie data={cats} cx="50%" cy="50%" innerRadius={30} outerRadius={55} paddingAngle={3} dataKey="value" strokeWidth={0}>
                  {cats.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={TT} formatter={v => [`$${v.toFixed(2)}`]} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1, minWidth: 180, display: 'flex', flexDirection: 'column', gap: 'var(--s2)' }}>
              {cats.map((d, i) => {
                const pct = totalCat > 0 ? d.value / totalCat * 100 : 0
                return (
                  <div key={d.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 3 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                      </div>
                      <span style={{ fontWeight: 600 }}>${d.value.toFixed(2)}</span>
                    </div>
                    <div style={{ height: 3, background: 'var(--latte)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: PIE_COLORS[i % PIE_COLORS.length], borderRadius: 99 }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MonthView({ shifts }) {
  const now         = new Date()
  const dayData     = useMemo(() => monthlyDayData(shifts), [shifts])
  const monthSales  = useMemo(() => getMonthSales(shifts),      [shifts])
  const lastMoRev   = useMemo(() => getLastMonthSales(shifts).reduce((s, x) => s + x.total, 0), [shifts])

  const revenue      = monthSales.reduce((sum, s) => sum + s.total, 0)
  const transactions = monthSales.length
  const daysActive   = dayData.filter(d => !d.isFuture && d.revenue > 0).length
  const avgDaily     = daysActive > 0 ? revenue / daysActive : 0
  const monthLabel   = now.toLocaleDateString('en-CA', { month: 'long', year: 'numeric' })

  const monthShifts = useMemo(() => shifts.filter(s => {
    const d = new Date(s.startedAt)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  }), [shifts])
  const items = useMemo(() => topItems(monthShifts), [monthShifts])

  if (!monthSales.length) return <EmptyPeriod label={`No sales recorded in ${monthLabel} yet.`} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s4)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s3)' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{monthLabel}</span>
        <TrendBadge current={revenue} previous={lastMoRev} label="vs last month" />
      </div>

      <div className="grid-4">
        <KpiCard label="Month Revenue"  value={`$${revenue.toFixed(2)}`}   sub={monthLabel}                                              icon={DollarSign}  color="#4A7C59" delay={1} />
        <KpiCard label="Transactions"   value={transactions}                sub="This month"                                              icon={ShoppingBag} color="#C4813A" delay={2} />
        <KpiCard label="Days Active"    value={daysActive}                  sub="Days with sales"                                         icon={Calendar}    color="#5A6A8A" delay={3} />
        <KpiCard label="Daily Average"  value={`$${avgDaily.toFixed(2)}`}   sub="Per active day"                                          icon={TrendingUp}  color="#8A5A5A" delay={4} />
      </div>

      <div className="card" style={{ padding: 'var(--s5)' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.95rem', marginBottom: 'var(--s4)' }}>Revenue by Day</p>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: Math.max(560, dayData.length * 22) }}>
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={dayData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} interval={0} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip contentStyle={TT} formatter={v => [`$${v.toFixed(2)}`, 'Revenue']} labelFormatter={l => `Day ${l}`} />
                <Bar dataKey="revenue" radius={[3, 3, 0, 0]} maxBarSize={20}>
                  {dayData.map((entry, i) => (
                    <Cell key={i} fill={entry.isFuture ? '#B8A99A' : entry.isToday ? '#4A7C59' : '#C4813A'} fillOpacity={entry.isFuture ? 0.25 : 1} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <BarLegend />
      </div>

      {items.length > 0 && <TopItemsCard items={items} title="Top Items This Month" />}
    </div>
  )
}

function AllTimeView({ shifts }) {
  const monthData    = useMemo(() => allTimeMonthlyData(shifts), [shifts])
  const allSales     = useMemo(() => shifts.flatMap(s => s.sales), [shifts])
  const totalRevenue = allSales.reduce((sum, s) => sum + s.total, 0)
  const totalTx      = allSales.length
  const monthsActive = monthData.length
  const avgMonthly   = monthsActive > 0 ? totalRevenue / monthsActive : 0
  const bestMonth    = monthData.reduce((best, m) => m.revenue > (best?.revenue || 0) ? m : best, null)
  const items        = useMemo(() => topItems(shifts), [shifts])

  if (!allSales.length) return <EmptyPeriod label="No sales recorded yet." />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s4)' }}>
      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        {monthsActive > 0 ? `Tracking since ${monthData[0]?.label}` : 'All recorded sales'}
      </span>

      <div className="grid-4">
        <KpiCard label="Total Revenue"  value={`$${totalRevenue.toFixed(2)}`}  sub="All time"                                                         icon={DollarSign}  color="#4A7C59" delay={1} />
        <KpiCard label="Transactions"   value={totalTx}                         sub="All time"                                                         icon={ShoppingBag} color="#C4813A" delay={2} />
        <KpiCard label="Avg Monthly"    value={`$${avgMonthly.toFixed(2)}`}     sub={`Over ${monthsActive} month${monthsActive !== 1 ? 's' : ''}`}     icon={TrendingUp}  color="#5A6A8A" delay={3} />
        <KpiCard label="Best Month"     value={bestMonth?.label ?? '—'}         sub={bestMonth ? `$${bestMonth.revenue.toFixed(2)}` : ''}              icon={Award}       color="#8A5A5A" delay={4} />
      </div>

      <div className="card" style={{ padding: 'var(--s5)' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.95rem', marginBottom: 2 }}>Revenue Trend</p>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 'var(--s4)' }}>Monthly revenue over time</p>
        <ResponsiveContainer width="100%" height={230}>
          <AreaChart data={monthData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#C4813A" stopOpacity={0.22} />
                <stop offset="95%" stopColor="#C4813A" stopOpacity={0}    />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
            <Tooltip contentStyle={TT} formatter={v => [`$${v.toFixed(2)}`, 'Revenue']} />
            <Area type="monotone" dataKey="revenue" stroke="#C4813A" fill="url(#revGrad)" strokeWidth={2.5}
              dot={{ r: 4, fill: '#C4813A', strokeWidth: 0 }}
              activeDot={{ r: 6, fill: '#C4813A', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {monthData.length > 1 && (
        <div className="card" style={{ padding: 'var(--s5)' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.95rem', marginBottom: 'var(--s4)' }}>Month by Month</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s3)' }}>
            {[...monthData].reverse().map((m, i) => {
              const maxRev = Math.max(...monthData.map(x => x.revenue), 1)
              return (
                <div key={m.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-secondary)', minWidth: 60 }}>{m.label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s3)', flex: 1, margin: '0 var(--s4)' }}>
                      <div style={{ flex: 1, height: 6, background: 'var(--latte)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(m.revenue / maxRev) * 100}%`, background: '#C4813A', borderRadius: 99, transition: 'width 0.4s ease' }} />
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>${m.revenue.toFixed(2)}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 6 }}>{m.transactions} sales</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {items.length > 0 && <TopItemsCard items={items} title="Top Items All Time" />}
    </div>
  )
}

// ── Day detail (full-page drill-in) ──────────────────────────────────────────

function DayDetailView({ shift, onBack, onDeleteShift, isGuest }) {
  const stats    = useMemo(() => calcStats(shift.sales), [shift])
  const best     = useMemo(() => topItem(shift.sales),   [shift])
  const label    = fmtDate(shift.startedAt)
  const fullDate = new Date(shift.startedAt).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="anim-fade-in" style={{
      minHeight: 'calc(100vh - 140px)',
      display: 'flex', flexDirection: 'column', gap: 'var(--s4)',
    }}>
      <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} onClick={onBack}>
        <ArrowLeft size={13} /> Back to Sales
      </button>

      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 'var(--s3)',
      }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', lineHeight: 1 }}>{label}</h2>
          <p className="text-muted text-sm" style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Clock size={12} /> 8:00 AM – 3:00 PM · {fullDate}
          </p>
        </div>
        {!isGuest && (
          <button
            className="btn btn-ghost btn-sm"
            style={{ color: 'var(--danger)', borderColor: 'rgba(184,64,64,0.25)' }}
            onClick={() => { onDeleteShift(shift.id); onBack() }}
          >
            <Trash2 size={12} /> Delete Day
          </button>
        )}
      </div>

      <div className="grid-4">
        <KpiCard label="Revenue"      value={`$${stats.totalRevenue.toFixed(2)}`} sub="Day total"        icon={DollarSign}  color="var(--success)" delay={1} />
        <KpiCard label="Transactions" value={stats.totalTransactions}             sub="Sales recorded"   icon={ShoppingBag} color="var(--accent)"  delay={2} />
        <KpiCard label="Avg Order"    value={`$${stats.avgOrder.toFixed(2)}`}     sub="Per transaction"  icon={TrendingUp}  color="#5A6A8A"        delay={3} />
        <KpiCard label="Top Item"     value={best ? best[0] : '—'}                sub={best ? `${best[1]} sold` : 'No data'} icon={Award} color="#8A5A5A" delay={4} />
      </div>

      {shift.sales.length > 0 ? (
        <>
          <DayCharts sales={shift.sales} label={label} />

          <div className="card" style={{ overflow: 'hidden', flex: 1 }}>
            <div style={{ padding: 'var(--s3) var(--s5)', background: 'var(--latte)', borderBottom: '1px solid var(--border)' }}>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.95rem' }}>
                Transaction Log
              </p>
            </div>
            <TransactionTable sales={shift.sales} onDelete={null} />
          </div>
        </>
      ) : (
        <EmptyPeriod label="No sales were recorded this day." />
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Sales() {
  const { shifts, activeShift, isOpen, deleteSale, deleteShift, isGuest } = useApp()
  const [showSaleModal,  setShowSaleModal]  = useState(false)
  const [showMenuModal,  setShowMenuModal]  = useState(false)
  const [openDayId,      setOpenDayId]      = useState(null)
  const [showTxLog,      setShowTxLog]      = useState(true)
  const [period,         setPeriod]         = useState('today')
  const [historyLimit,   setHistoryLimit]   = useState(HISTORY_PAGE_SIZE)

  const todayStr   = new Date().toDateString()
  const todayLabel = new Date().toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' })

  const pastShifts    = useMemo(() => [...shifts].filter(s => new Date(s.startedAt).toDateString() !== todayStr).reverse(), [shifts, todayStr])
  const visibleShifts = useMemo(() => pastShifts.slice(0, historyLimit), [pastShifts, historyLimit])
  const remainingDays = pastShifts.length - visibleShifts.length
  const activeStats   = useMemo(() => activeShift ? calcStats(activeShift.sales) : null, [activeShift])
  const bestItem      = useMemo(() => activeShift ? topItem(activeShift.sales) : null, [activeShift])
  const hasSalesToday = activeShift && activeShift.sales.length > 0
  const openDay       = useMemo(() => pastShifts.find(s => s.id === openDayId) ?? null, [pastShifts, openDayId])

  if (openDay) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <NavBar />
        <div className="page" style={{ maxWidth: 1100, paddingTop: 'var(--s5)' }}>
          <DayDetailView
            shift={openDay}
            isGuest={isGuest}
            onBack={() => setOpenDayId(null)}
            onDeleteShift={deleteShift}
          />
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <NavBar />

      <div className="page" style={{ maxWidth: 1100 }}>

        {/* Header */}
        <div className="anim-slide-up" style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 'var(--s3)', marginTop: 'var(--s5)', marginBottom: 'var(--s4)',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s2)', marginBottom: 4 }}>
              <Calendar size={14} color="var(--text-muted)" />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>{todayLabel}</span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', lineHeight: 1 }}>Sales</h2>
          </div>
          {!isGuest && (
            <div style={{ display: 'flex', gap: 'var(--s2)', alignItems: 'center' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowMenuModal(true)}>
                <BookOpen size={13} /> Menu
              </button>
              <button className="btn btn-primary" onClick={() => setShowSaleModal(true)}>
                <Plus size={15} /> New Sale
              </button>
            </div>
          )}
        </div>

        {/* Status bar */}
        <div className="anim-fade-in" style={{
          display: 'flex', alignItems: 'center', gap: 'var(--s3)',
          padding: 'var(--s3) var(--s4)',
          background: isOpen ? 'rgba(74,124,89,0.07)' : 'rgba(184,64,64,0.05)',
          border: `1px solid ${isOpen ? 'rgba(74,124,89,0.2)' : 'rgba(184,64,64,0.12)'}`,
          borderRadius: 'var(--r2)', marginBottom: 'var(--s4)',
          fontSize: '0.82rem', flexWrap: 'wrap',
        }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: isOpen ? 'var(--success)' : 'var(--danger)', flexShrink: 0, boxShadow: isOpen ? '0 0 6px rgba(74,124,89,0.5)' : 'none' }} />
          <span style={{ fontWeight: 700, color: isOpen ? 'var(--success)' : 'var(--danger)' }}>{isOpen ? 'Open' : 'Closed'}</span>
          <span style={{ color: 'var(--border-strong)' }}>·</span>
          <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={11} /> 8:00 AM – 3:00 PM
          </span>
          {hasSalesToday && (
            <>
              <span style={{ color: 'var(--border-strong)' }}>·</span>
              <span style={{ color: 'var(--text-muted)' }}>
                {activeShift.sales.length} transaction{activeShift.sales.length !== 1 ? 's' : ''} today
              </span>
            </>
          )}
        </div>

        {/* Period tabs */}
        <PeriodTabs value={period} onChange={setPeriod} />

        {/* ── Today ── */}
        {period === 'today' && (
          <>
            {hasSalesToday ? (
              <>
                <div className="grid-4 anim-slide-up" style={{ marginBottom: 'var(--s5)' }}>
                  <KpiCard label="Total Revenue"  value={`$${activeStats.totalRevenue.toFixed(2)}`}  sub="Today's earnings"   icon={DollarSign}  color="var(--success)" delay={1} />
                  <KpiCard label="Transactions"   value={activeStats.totalTransactions}               sub={`Avg ${Math.round(60 * 7 / Math.max(activeStats.totalTransactions, 1))} min apart`} icon={ShoppingBag} color="var(--accent)" delay={2} />
                  <KpiCard label="Avg Order"      value={`$${activeStats.avgOrder.toFixed(2)}`}       sub="Per transaction"    icon={TrendingUp}  color="#5A6A8A"        delay={3} />
                  <KpiCard label="Top Seller"     value={bestItem ? bestItem[0] : '—'}               sub={bestItem ? `${bestItem[1]} sold today` : 'No data yet'} icon={Award} color="#8A5A5A" delay={4} />
                </div>

                <DayCharts sales={activeShift.sales} />

                <div className="card anim-fade-in" style={{ overflow: 'hidden', marginBottom: 'var(--s5)', marginTop: 'var(--s4)' }}>
                  <button
                    onClick={() => setShowTxLog(v => !v)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center',
                      gap: 'var(--s3)', padding: 'var(--s3) var(--s5)',
                      background: 'var(--latte)', border: 'none', cursor: 'pointer',
                      textAlign: 'left', transition: 'background var(--t-fast)',
                      borderBottom: showTxLog ? '1px solid var(--border)' : 'none',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--latte-deep)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--latte)'}
                  >
                    {showTxLog ? <ChevronDown size={14} color="var(--text-muted)" /> : <ChevronRight size={14} color="var(--text-muted)" />}
                    <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.95rem', flex: 1 }}>Transaction Log</p>
                    <span style={{ padding: '2px 10px', borderRadius: 'var(--r-pill)', background: 'rgba(196,129,58,0.12)', fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent)' }}>
                      {activeShift.sales.length} {activeShift.sales.length === 1 ? 'sale' : 'sales'}
                    </span>
                  </button>
                  {showTxLog && <TransactionTable sales={activeShift.sales} onDelete={isGuest ? null : deleteSale} />}
                </div>
              </>
            ) : (
              <div className="card anim-fade-in" style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', padding: 'var(--s8) var(--s6)',
                textAlign: 'center', marginBottom: 'var(--s5)',
              }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: isOpen ? 'rgba(196,129,58,0.1)' : 'rgba(184,64,64,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--s4)' }}>
                  <ShoppingBag size={24} color={isOpen ? 'var(--accent)' : 'var(--danger)'} />
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 'var(--s2)' }}>{isOpen ? 'Ready to Record' : 'Cafe Closed'}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: 300, marginBottom: isOpen ? 'var(--s5)' : 0 }}>
                  {isOpen ? 'No sales recorded yet today. Press New Sale to get started.' : 'Sales are recorded between 8:00 AM and 3:00 PM.'}
                </p>
                {isOpen && <button className="btn btn-primary" onClick={() => setShowSaleModal(true)}><Plus size={15} /> Record First Sale</button>}
              </div>
            )}

            {/* Day History */}
            {pastShifts.length > 0 && (
              <div className="anim-fade-in">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s3)', marginBottom: 'var(--s3)' }}>
                  <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1rem', color: 'var(--text-secondary)' }}>Day History</p>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{pastShifts.length} day{pastShifts.length !== 1 ? 's' : ''}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s2)' }}>
                  {visibleShifts.map(shift => {
                    const stats = calcStats(shift.sales)
                    const best  = topItem(shift.sales)

                    return (
                      <button
                        key={shift.id}
                        onClick={() => setOpenDayId(shift.id)}
                        className="card"
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center',
                          gap: 'var(--s4)', padding: 'var(--s4) var(--s5)',
                          cursor: 'pointer', textAlign: 'left',
                          transition: 'background var(--t-fast), transform var(--t-fast)',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--latte)'; e.currentTarget.style.transform = 'translateX(2px)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.transform = 'translateX(0)' }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.92rem' }}>{fmtDate(shift.startedAt)}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: 'var(--s2)' }}>
                            8:00 AM – 3:00 PM{best ? ` · ${best[0]}` : ''}
                          </span>
                        </div>
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
                            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--accent)', fontSize: '1rem' }}>${stats.totalRevenue.toFixed(2)}</p>
                          </div>
                        </div>
                        <ChevronRight size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                      </button>
                    )
                  })}
                </div>

                {remainingDays > 0 && (
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ width: '100%', marginTop: 'var(--s3)' }}
                    onClick={() => setHistoryLimit(l => l + HISTORY_PAGE_SIZE)}
                  >
                    Show {Math.min(remainingDays, HISTORY_PAGE_SIZE)} more day{Math.min(remainingDays, HISTORY_PAGE_SIZE) !== 1 ? 's' : ''} ({remainingDays} remaining)
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {period === 'week'  && <WeekView    shifts={shifts} />}
        {period === 'month' && <MonthView   shifts={shifts} />}
        {period === 'all'   && <AllTimeView shifts={shifts} />}

      </div>

      {showSaleModal && <SaleEntryModal    onClose={() => setShowSaleModal(false)} />}
      {showMenuModal && <AddMenuItemModal  onClose={() => setShowMenuModal(false)} />}
    </div>
  )
}
