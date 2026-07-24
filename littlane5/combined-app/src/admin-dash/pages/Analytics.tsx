import { useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'

interface Sale {
  orderId: string
  name: string
  email: string
  amount: number
  quantity: number
  status: string
  gender?: string
  ticketId?: string
  createdAt: string
  paidAt?: string
  scannedAt?: string
  emailStatus?: string
}

interface Props {
  sales: Sale[]
}

const COLORS = ['#9333ea', '#a855f7', '#c084fc', '#3b82f6', '#22c55e']

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { color: string; name: string; value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 14px', fontSize: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
      <div style={{ fontWeight: 700, marginBottom: '6px', color: 'var(--foreground)' }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: p.color }} />
          <span style={{ color: 'var(--muted-foreground)' }}>{p.name}:</span>
          <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

export default function Analytics({ sales }: Props) {
  const [activeMetric, setActiveMetric] = useState<'Revenue' | 'Orders' | 'Tickets'>('Revenue')
  const [activePeriod, setActivePeriod] = useState<'Today' | '7D'>('Today')

  // Safely grab paid orders (matching server statuses)
  const paid = sales.filter(s => ['paid', 'ticket_generated', 'emailed', 'email_failed', 'scanned'].includes(s.status))

  // --- Dynamic Chart Bucketing ---
  const chartData = []
  const now = new Date()

  if (activePeriod === '7D') {
    const dayMap = new Map<string, { revenue: number; orders: number; tickets: number }>()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const key = d.toLocaleDateString('en-IN', { weekday: 'short' })
      dayMap.set(key, { revenue: 0, orders: 0, tickets: 0 })
    }
    paid.forEach(s => {
      const d = new Date(s.paidAt || s.createdAt)
      const key = d.toLocaleDateString('en-IN', { weekday: 'short' })
      if (dayMap.has(key)) {
        const cur = dayMap.get(key)!
        cur.revenue += s.amount
        cur.orders += 1
        cur.tickets += s.quantity || 1
      }
    })
    chartData.push(...Array.from(dayMap.entries()).map(([time, v]) => ({ time, ...v })))
  } else {
    // Today (3-hour blocks)
    const todayStr = now.toDateString()
    const blocks = ['12am', '3am', '6am', '9am', '12pm', '3pm', '6pm', '9pm']
    const blockMap = new Map<string, { revenue: number; orders: number; tickets: number }>()
    blocks.forEach(b => blockMap.set(b, { revenue: 0, orders: 0, tickets: 0 }))
    
    paid.forEach(s => {
      const d = new Date(s.paidAt || s.createdAt)
      if (d.toDateString() === todayStr) {
        const hour = d.getHours()
        const blockIndex = Math.floor(hour / 3)
        const key = blocks[blockIndex]
        if (blockMap.has(key)) {
          const cur = blockMap.get(key)!
          cur.revenue += s.amount
          cur.orders += 1
          cur.tickets += s.quantity || 1
        }
      }
    })
    chartData.push(...Array.from(blockMap.entries()).map(([time, v]) => ({ time, ...v })))
  }

  const periodSales = chartData.reduce((acc, cur) => acc + cur.revenue, 0)
  const periodOrders = chartData.reduce((acc, cur) => acc + cur.orders, 0)
  const periodTickets = chartData.reduce((acc, cur) => acc + cur.tickets, 0)

  let displayValue = 0
  if (activeMetric === 'Revenue') displayValue = periodSales
  if (activeMetric === 'Orders') displayValue = periodOrders
  if (activeMetric === 'Tickets') displayValue = periodTickets

  const activeColor = activeMetric === 'Revenue' ? '#9333ea' : activeMetric === 'Orders' ? '#3b82f6' : '#22c55e'
  const activeKey = activeMetric.toLowerCase()

  // --- Ticket type breakdown ---
  const typeCount: Record<string, number> = {}
  paid.forEach(s => {
    const type = s.gender === 'male' ? 'Male Pass' : s.gender === 'female' ? 'Female Pass' : 'General'
    typeCount[type] = (typeCount[type] || 0) + 1
  })
  const total = Object.values(typeCount).reduce((a, b) => a + b, 0) || 1
  const ticketTypes = Object.entries(typeCount).map(([name, count], i) => ({
    name,
    value: Math.round((count / total) * 100),
    color: COLORS[i % COLORS.length],
  }))

  // --- KPI metrics from real data ---
  const totalRevenue = paid.reduce((a, s) => a + s.amount, 0)
  const totalOrders = sales.length
  const scanned = sales.filter(s => s.scannedAt).length
  const emailDelivered = sales.filter(s => s.emailStatus === 'sent').length
  const emailFailed = sales.filter(s => s.emailStatus === 'failed').length
  const avgOrderValue = paid.length > 0 ? Math.round(totalRevenue / paid.length) : 0
  const scanRate = paid.length > 0 ? ((scanned / paid.length) * 100).toFixed(1) : '0.0'
  const emailRate = (paid.length > 0 && emailDelivered + emailFailed > 0)
    ? (emailDelivered / (emailDelivered + emailFailed) * 100).toFixed(1)
    : '—'

  const kpiMetrics = [
    { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}` },
    { label: 'Total Orders', value: totalOrders.toLocaleString() },
    { label: 'Paid Tickets', value: paid.length.toLocaleString() },
    { label: 'QR Scan Rate', value: `${scanRate}%` },
    { label: 'Avg Order Value', value: avgOrderValue > 0 ? `₹${avgOrderValue.toLocaleString()}` : '—' },
    { label: 'Email Delivery Rate', value: emailRate !== '—' ? `${emailRate}%` : '—' },
    { label: 'Tickets Scanned', value: scanned.toLocaleString() },
    { label: 'Emails Sent', value: emailDelivered.toLocaleString() },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--foreground)', letterSpacing: '-0.5px', margin: 0 }}>Analytics</h1>
        <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', margin: '4px 0 0' }}>Live performance metrics from your SQLite database</p>
      </div>

      {/* KPI metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
        {kpiMetrics.map(m => (
          <div key={m.label} style={{
            backgroundColor: 'var(--card)', borderRadius: '14px', padding: '16px',
            border: '1px solid var(--border)', boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
          }}>
            <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginBottom: '8px' }}>{m.label}</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.5px' }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Sales Analytics Chart */}
      <div style={{ backgroundColor: 'var(--card)', borderRadius: '20px', padding: '24px', border: '1px solid var(--border)', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
        
        {/* Header matching screenshot */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--foreground)', margin: 0, letterSpacing: '-0.3px' }}>Sales Analytics</h2>
            <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', margin: '4px 0 0' }}>
              Period {activeMetric}: {activeMetric === 'Revenue' ? `${displayValue.toLocaleString()} INR` : displayValue.toLocaleString()}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {/* Metric Toggle */}
            <div style={{ display: 'flex', backgroundColor: 'var(--muted)', borderRadius: '8px', padding: '4px' }}>
              {(['Revenue', 'Orders', 'Tickets'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setActiveMetric(m)}
                  style={{
                    padding: '6px 14px', fontSize: '13px', fontWeight: 600, border: 'none', borderRadius: '6px', cursor: 'pointer',
                    backgroundColor: activeMetric === m ? 'var(--card)' : 'transparent',
                    color: activeMetric === m ? 'var(--foreground)' : 'var(--muted-foreground)',
                    boxShadow: activeMetric === m ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.2s',
                    outline: activeMetric === m && activeMetric === 'Revenue' ? '1.5px solid #3b82f6' : 'none'
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
            {/* Period Toggle */}
            <div style={{ display: 'flex', backgroundColor: 'var(--muted)', borderRadius: '8px', padding: '4px' }}>
              {(['Today', '7D'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setActivePeriod(p)}
                  style={{
                    padding: '6px 14px', fontSize: '13px', fontWeight: 600, border: 'none', borderRadius: '6px', cursor: 'pointer',
                    backgroundColor: activePeriod === p ? '#9333ea' : 'transparent',
                    color: activePeriod === p ? '#fff' : 'var(--muted-foreground)',
                    boxShadow: activePeriod === p ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* The Chart */}
        <div style={{ width: '100%', overflowX: 'auto' }}>
          <div style={{ minWidth: '600px' }}>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={activeColor} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={activeColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="time" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tickFormatter={v => activeMetric === 'Revenue' ? `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v}` : v} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey={activeKey} name={activeMetric} stroke={activeColor} strokeWidth={2.5} fill="url(#colorGrad)" dot={false} activeDot={{ r: 5, fill: activeColor, stroke: 'var(--card)', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Ticket type breakdown */}
      {ticketTypes.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <div style={{ backgroundColor: 'var(--card)', borderRadius: '20px', padding: '20px', border: '1px solid var(--border)', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--foreground)', margin: '0 0 16px', letterSpacing: '-0.2px' }}>Ticket Types</h3>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={ticketTypes} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                  {ticketTypes.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => `${v}%`} contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {ticketTypes.map(t => (
                <div key={t.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: t.color }} />
                    <span style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>{t.name}</span>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--foreground)' }}>{t.value}%</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--card)', borderRadius: '20px', padding: '20px', border: '1px solid var(--border)', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--foreground)', margin: '0 0 16px', letterSpacing: '-0.2px' }}>Payment Gateway</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6' }} />
                  <span style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>Razorpay</span>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--foreground)' }}>100%</span>
              </div>
              <div style={{ height: '6px', backgroundColor: 'var(--muted)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '100%', background: 'linear-gradient(90deg, #3b82f6, #60a5fa)', borderRadius: '3px' }} />
              </div>
              <p style={{ fontSize: '11px', color: 'var(--muted-foreground)', margin: 0 }}>All transactions processed via Razorpay</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
