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
  const paid = sales.filter(s => s.status === 'paid' || s.status === 'scanned' || s.status === 'generated')

  // --- Revenue by day (last 7 days) ---
  const dayMap = new Map<string, { revenue: number; orders: number }>()
  const now = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = d.toLocaleDateString('en-IN', { weekday: 'short' })
    dayMap.set(key, { revenue: 0, orders: 0 })
  }
  paid.forEach(s => {
    const d = new Date(s.paidAt || s.createdAt)
    const key = d.toLocaleDateString('en-IN', { weekday: 'short' })
    if (dayMap.has(key)) {
      const cur = dayMap.get(key)!
      cur.revenue += s.amount
      cur.orders += 1
    }
  })
  const revenueData = Array.from(dayMap.entries()).map(([day, v]) => ({ day, ...v }))

  // --- Ticket type breakdown ---
  const typeCount: Record<string, number> = {}
  sales.forEach(s => {
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

      {/* Revenue chart */}
      <div style={{ backgroundColor: 'var(--card)', borderRadius: '20px', padding: '24px', border: '1px solid var(--border)', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--foreground)', margin: 0, letterSpacing: '-0.3px' }}>Revenue & Orders (Last 7 Days)</h2>
          <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: '3px 0 0' }}>Based on real payment data</p>
        </div>
        {revenueData.every(d => d.revenue === 0) ? (
          <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-foreground)', fontSize: '14px' }}>
            No paid orders yet — revenue chart will populate as tickets are sold
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9333ea" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#9333ea" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="ordGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="rev" orientation="left" tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={48} />
              <YAxis yAxisId="ord" orientation="right" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={40} />
              <Tooltip content={<CustomTooltip />} />
              <Area yAxisId="rev" type="monotone" dataKey="revenue" name="Revenue (₹)" stroke="#9333ea" strokeWidth={2} fill="url(#revGrad)" dot={false} />
              <Area yAxisId="ord" type="monotone" dataKey="orders" name="Orders" stroke="#3b82f6" strokeWidth={2} fill="url(#ordGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Ticket type breakdown */}
      {ticketTypes.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
