import { useState, useMemo } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { Plus, TrendingUp, DollarSign, ShoppingBag, Trash2, BookOpen, Settings } from 'lucide-react'
import { useApp } from '../context/AppContext'
import NavBar from '../components/NavBar'
import SaleEntryModal from '../components/SaleEntryModal'
import AddMenuItemModal from '../components/AddMenuItemModal'

const PERIOD_OPTIONS = ['Daily', 'Weekly', 'Monthly']
const PIE_COLORS = ['#C4813A', '#3D1F10', '#6B3A24', '#4A7C59', '#5A6A8A', '#8A5A5A', '#B8A040', '#40788A']

function startOf(period) {
  const d = new Date()
  if (period === 'Daily') {
    d.setHours(0, 0, 0, 0)
    return d
  }
  if (period === 'Weekly') {
    const day = d.getDay()
    d.setDate(d.getDate() - day)
    d.setHours(0, 0, 0, 0)
    return d
  }
  // Monthly
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
}

export default function Sales() {
  const { sales, deleteSale, menu } = useApp()
  const [period, setPeriod] = useState('Daily')
  const [showSaleModal, setShowSaleModal] = useState(false)
  const [showMenuModal, setShowMenuModal] = useState(false)

  const periodSales = useMemo(() => {
    const cutoff = startOf(period)
    return sales.filter(s => new Date(s.timestamp) >= cutoff)
  }, [sales, period])

  const totalRevenue = periodSales.reduce((sum, s) => sum + s.total, 0)
  const totalTransactions = periodSales.length
  const avgOrder = totalTransactions ? totalRevenue / totalTransactions : 0

  // Category breakdown for pie
  const categoryData = useMemo(() => {
    const map = {}
    periodSales.forEach(sale => {
      sale.items.forEach(item => {
        map[item.category] = (map[item.category] || 0) + item.price * item.quantity
      })
    })
    return Object.entries(map).map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
  }, [periodSales])

  // Bar chart — group by day for weekly/monthly, by hour for daily
  const barData = useMemo(() => {
    if (period === 'Daily') {
      const hours = {}
      for (let h = 6; h <= 20; h++) hours[h] = 0
      periodSales.forEach(s => {
        const h = new Date(s.timestamp).getHours()
        if (hours[h] !== undefined) hours[h] += s.total
      })
      return Object.entries(hours).map(([h, v]) => ({
        label: `${h > 12 ? h - 12 : h}${h >= 12 ? 'pm' : 'am'}`,
        revenue: parseFloat(v.toFixed(2)),
      }))
    }
    if (period === 'Weekly') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const map = {}
      days.forEach(d => map[d] = 0)
      periodSales.forEach(s => {
        const d = days[new Date(s.timestamp).getDay()]
        map[d] += s.total
      })
      return days.map(d => ({ label: d, revenue: parseFloat(map[d].toFixed(2)) }))
    }
    // Monthly — group by day of month
    const map = {}
    periodSales.forEach(s => {
      const d = new Date(s.timestamp).getDate()
      map[d] = (map[d] || 0) + s.total
    })
    return Object.entries(map).sort((a, b) => a[0] - b[0]).map(([d, v]) => ({
      label: d,
      revenue: parseFloat(v.toFixed(2)),
    }))
  }, [periodSales, period])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <NavBar />

      <div className="page" style={{ maxWidth: 1100 }}>

        {/* Header */}
        <div className="section-header anim-slide-up" style={{ marginTop: 'var(--s5)' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)' }}>Sales</h2>
            <p className="text-muted text-sm" style={{ marginTop: 4 }}>
              {totalTransactions} transaction{totalTransactions !== 1 ? 's' : ''} · {period.toLowerCase()} view
            </p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--s2)' }}>
            <button className="btn btn-ghost" onClick={() => setShowMenuModal(true)}>
              <BookOpen size={14} /> Menu
            </button>
            <button className="btn btn-primary" onClick={() => setShowSaleModal(true)}>
              <Plus size={15} /> New Sale
            </button>
          </div>
        </div>

        {/* Period tabs */}
        <div style={{ display: 'flex', gap: 'var(--s1)', marginBottom: 'var(--s5)' }} className="anim-fade-in">
          {PERIOD_OPTIONS.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: '8px 20px',
                borderRadius: 'var(--r2)',
                fontWeight: 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                border: 'none',
                background: period === p ? 'var(--espresso)' : 'var(--latte)',
                color: period === p ? 'var(--cream)' : 'var(--text-secondary)',
                transition: 'all var(--t-base)',
              }}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Stat cards */}
        <div className="grid-3 anim-slide-up" style={{ marginBottom: 'var(--s5)' }}>
          {[
            { label: 'Revenue', value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'var(--success)' },
            { label: 'Transactions', value: totalTransactions, icon: ShoppingBag, color: 'var(--accent)' },
            { label: 'Avg Order', value: `$${avgOrder.toFixed(2)}`, icon: TrendingUp, color: '#5A6A8A' },
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
        {periodSales.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 'var(--s4)', marginBottom: 'var(--s5)' }} className="anim-fade-in">

            {/* Bar chart */}
            <div className="card" style={{ padding: 'var(--s4) var(--s5)' }}>
              <p style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 'var(--s4)' }}>
                Revenue by {period === 'Daily' ? 'Hour' : period === 'Weekly' ? 'Day' : 'Date'}
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

            {/* Pie chart */}
            <div className="card" style={{ padding: 'var(--s4) var(--s5)' }}>
              <p style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 'var(--s3)' }}>
                By Category
              </p>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {categoryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: 'var(--espresso)', border: 'none', borderRadius: 8, color: 'var(--cream)', fontSize: 12 }}
                    formatter={v => [`$${v}`, 'Revenue']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 'var(--s2)' }}>
                {categoryData.map((d, i) => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                    <span style={{ flex: 1, color: 'var(--text-secondary)' }}>{d.name}</span>
                    <span style={{ fontWeight: 600 }}>${d.value.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Transaction log */}
        <div className="card anim-fade-in" style={{ overflow: 'hidden' }}>
          <div style={{
            padding: 'var(--s3) var(--s5)',
            background: 'var(--latte)',
            borderBottom: '1px solid var(--border)',
          }}>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.95rem' }}>
              Transaction Log
            </p>
          </div>

          {periodSales.length === 0 ? (
            <div style={{ padding: 'var(--s7)', textAlign: 'center', color: 'var(--text-muted)' }}>
              <ShoppingBag size={32} style={{ margin: '0 auto var(--s3)', opacity: 0.3 }} />
              <p>No sales recorded for this period.</p>
              <button className="btn btn-primary" style={{ marginTop: 'var(--s4)' }} onClick={() => setShowSaleModal(true)}>
                <Plus size={14} /> Record First Sale
              </button>
            </div>
          ) : (
            [...periodSales].reverse().map((sale, idx) => {
              const time = new Date(sale.timestamp)
              return (
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
                      {time.toLocaleDateString()} {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--accent)' }}>
                    ${sale.total.toFixed(2)}
                  </span>
                  <button className="btn-icon danger" style={{ width: 28, height: 28 }} onClick={() => deleteSale(sale.id)}>
                    <Trash2 size={12} />
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>

      {showSaleModal && <SaleEntryModal onClose={() => setShowSaleModal(false)} />}
      {showMenuModal && <AddMenuItemModal onClose={() => setShowMenuModal(false)} />}
    </div>
  )
}