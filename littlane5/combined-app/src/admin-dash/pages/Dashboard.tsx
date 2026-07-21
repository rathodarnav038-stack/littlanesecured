import { useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend,
} from 'recharts'

interface DashboardProps {
  sales: any[]
  summary: any
  testMode: boolean
  onManualGenerate: () => void
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const h = 28, w = 80
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / (max - min || 1)) * h
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
    </svg>
  )
}

const formatRevenue = (v: number) => {
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`
  if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`
  return `₹${v}`
}

export default function Dashboard({ sales = [], summary = {}, testMode, onManualGenerate }: DashboardProps) {
  const [period, setPeriod] = useState<'today' | '7d' | '30d' | '90d' | 'year'>('7d')
  const [activeMetric, setActiveMetric] = useState<'revenue' | 'orders' | 'tickets'>('revenue')
  const [eventModal, setEventModal] = useState<null | { label: string; tickets: any[] }>(null)

  // Calculate live statistics from sales
  const paidSales = sales.filter(s => ['paid', 'ticket_generated', 'emailed', 'email_failed', 'scanned'].includes(s.status))
  
  const totalRevenue = paidSales.reduce((acc, s) => acc + (s.amount || 0), 0)
  const totalTickets = paidSales.reduce((acc, s) => acc + (s.quantity || 1), 0)
  
  const todayStr = new Date().toDateString()
  const todayRevenue = paidSales
    .filter(s => s.createdAt && new Date(s.createdAt).toDateString() === todayStr)
    .reduce((acc, s) => acc + (s.amount || 0), 0)

  const emailFailures = sales.filter(s => s.emailStatus === 'failed').length
  const ticketFailures = sales.filter(s => s.status === 'ticket_generation_failed').length
  const qrScannedCount = sales.filter(s => s.status === 'scanned' || !!s.scannedAt).length

  // Event breakdown
  const freshersMale = paidSales.filter(s =>
    (s.event || '').toUpperCase().includes('FRESHERS') &&
    (s.gender === 'male' || (s.ticketType || '').toLowerCase().includes('male'))
  )
  const freshersFemale = paidSales.filter(s =>
    (s.event || '').toUpperCase().includes('FRESHERS') &&
    (s.gender === 'female' || (s.ticketType || '').toLowerCase().includes('female'))
  )
  const auraGenesis = paidSales.filter(s =>
    (s.event || '').toUpperCase().includes('AURA')
  )

  const eventBreakdown = [
    {
      label: 'Freshers Male Pass',
      emoji: '🧑',
      color: '#6366f1',
      gradient: 'linear-gradient(135deg, #4f46e5, #818cf8)',
      tickets: freshersMale,
      sold: freshersMale.reduce((a, s) => a + (s.quantity || 1), 0),
      revenue: freshersMale.reduce((a, s) => a + (s.amount || 0), 0),
      price: '₹349',
    },
    {
      label: 'Freshers Female Pass',
      emoji: '👩',
      color: '#ec4899',
      gradient: 'linear-gradient(135deg, #db2777, #f472b6)',
      tickets: freshersFemale,
      sold: freshersFemale.reduce((a, s) => a + (s.quantity || 1), 0),
      revenue: freshersFemale.reduce((a, s) => a + (s.amount || 0), 0),
      price: '₹249',
    },
    {
      label: 'Aura Genesis',
      emoji: '✨',
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #d97706, #fbbf24)',
      tickets: auraGenesis,
      sold: auraGenesis.reduce((a, s) => a + (s.quantity || 1), 0),
      revenue: auraGenesis.reduce((a, s) => a + (s.amount || 0), 0),
      price: '₹350',
    },
  ]

  const kpis = [
    { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}`, icon: '₹', color: '#9333ea', spark: [30, 45, 40, 60, 55, 75, 90] },
    { label: "Today's Revenue", value: `₹${todayRevenue.toLocaleString()}`, icon: '📈', color: '#7c3aed', spark: [10, 20, 15, 30, 25, 40, 50] },
    { label: 'Tickets Sold', value: String(totalTickets), icon: '🎫', color: '#6d28d9', spark: [5, 10, 15, 20, 25, 30, 35] },
    { label: 'QR Scanned', value: String(qrScannedCount), icon: '📲', color: '#8b5cf6', spark: [2, 4, 8, 12, 16, 20, 24] },
    { label: 'Total Orders', value: String(sales.length), icon: '📋', color: '#a855f7', spark: [10, 20, 18, 32, 28, 45, 52] },
    { label: 'Successful Payments', value: String(paidSales.length), icon: '✓', color: '#22c55e', spark: [8, 16, 14, 28, 24, 40, 48] },
    { label: 'Failed Payments', value: String(sales.filter(s => s.status === 'failed').length), icon: '✗', color: '#ef4444', spark: [1, 2, 0, 1, 3, 2, 1] },
    { label: 'Emails Delivered', value: String(sales.filter(s => s.emailStatus === 'sent').length), icon: '📧', color: '#3b82f6', spark: [8, 15, 14, 25, 22, 38, 44] },
  ]

  // Map database sales to time periods for the chart
  const getChartData = () => {
    // Basic aggregation by time for past records
    const records = [...paidSales].reverse()
    if (period === 'today') {
      // Group by hours
      const hours = ['12am', '3am', '6am', '9am', '12pm', '3pm', '6pm', '9pm', '11pm']
      return hours.map((h, index) => {
        // filter sales created in this range
        const matching = records.filter(s => {
          const hr = new Date(s.createdAt).getHours()
          const start = index * 2.5
          const end = (index + 1) * 2.5
          return hr >= start && hr < end
        })
        return {
          time: h,
          revenue: matching.reduce((sum, s) => sum + s.amount, 0),
          orders: matching.length,
          tickets: matching.reduce((sum, s) => sum + s.quantity, 0)
        }
      })
    }

    // Default 7 days
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    return days.map((day, idx) => {
      // Simple division of records over 7 slots
      const startIdx = Math.floor((idx / 7) * records.length)
      const endIdx = Math.floor(((idx + 1) / 7) * records.length)
      const slice = records.slice(startIdx, endIdx)
      return {
        time: day,
        revenue: slice.reduce((sum, s) => sum + s.amount, 0),
        orders: slice.length,
        tickets: slice.reduce((sum, s) => sum + s.quantity, 0)
      }
    })
  }

  const chartData = getChartData()

  // Generate live feed items from actual database logs
  const getLiveActivity = () => {
    const list: any[] = []
    sales.slice(0, 15).forEach(sale => {
      const timeLabel = sale.createdAt ? new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'just now'
      
      // Order created event
      list.push({
        id: `created-${sale.orderId}`,
        type: 'purchase',
        msg: `${sale.name} initiated booking`,
        sub: `${sale.event} · ₹${sale.amount}`,
        time: timeLabel,
        color: '#9333ea',
        dot: '💳'
      })

      // Paid / ticket generated event
      if (['paid', 'ticket_generated', 'emailed', 'email_failed', 'scanned'].includes(sale.status)) {
        list.push({
          id: `paid-${sale.orderId}`,
          type: 'payment',
          msg: `Payment Verified`,
          sub: `Order #${sale.orderId.substring(0, 10)} · ID: ${sale.paymentId || 'manual'}`,
          time: sale.paidAt ? new Date(sale.paidAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : timeLabel,
          color: '#22c55e',
          dot: '✓'
        })
      }

      // Email event
      if (sale.emailStatus === 'sent') {
        list.push({
          id: `email-${sale.orderId}`,
          type: 'email',
          msg: `Ticket Emailed`,
          sub: `${sale.email}`,
          time: timeLabel,
          color: '#3b82f6',
          dot: '📧'
        })
      } else if (sale.emailStatus === 'failed') {
        list.push({
          id: `email-fail-${sale.orderId}`,
          type: 'email-fail',
          msg: `Email Delivery Failed`,
          sub: sale.emailError || 'SMTP Error',
          time: timeLabel,
          color: '#ef4444',
          dot: '⚠️'
        })
      }

      // Scan event
      if (sale.status === 'scanned' || sale.scannedAt) {
        list.push({
          id: `scan-${sale.orderId}`,
          type: 'scan',
          msg: `Ticket Scanned at Gate`,
          sub: `Ticket: ${sale.ticketId} · Staff: ${sale.scannedBy || 'Gate A'}`,
          time: sale.scannedAt || timeLabel,
          color: '#f59e0b',
          dot: '📲'
        })
      }
    })
    return list.slice(0, 10)
  }

  const liveFeed = getLiveActivity()

  const metricColors: Record<string, string> = {
    revenue: '#9333ea',
    orders: '#3b82f6',
    tickets: '#22c55e',
  }

  return (
    <>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--foreground)', letterSpacing: '-0.5px', margin: 0 }}>Dashboard</h1>
          <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', margin: '4px 0 0' }}>Welcome back. Here is the real-time activity for your events.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onManualGenerate}
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #10B981, #059669)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
            }}
          >
            Generate Ticket Manually
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '14px',
      }}>
        {kpis.map((kpi, i) => (
          <div
            key={i}
            style={{
              backgroundColor: 'var(--card)',
              borderRadius: '16px',
              padding: '16px',
              border: '1px solid var(--border)',
              boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
              cursor: 'pointer',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <div style={{
                width: '32px', height: '32px',
                borderRadius: '8px',
                backgroundColor: `${kpi.color}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px',
              }}>
                {kpi.icon}
              </div>
            </div>
            <div style={{ fontSize: '21px', fontWeight: 700, color: 'var(--foreground)', letterSpacing: '-0.5px', marginBottom: '2px' }}>
              {kpi.value}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--muted-foreground)', marginBottom: '8px' }}>{kpi.label}</div>
            <Sparkline data={kpi.spark} color={kpi.color} />
          </div>
        ))}
      </div>

      {/* Event Sales Breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--foreground)', margin: 0, letterSpacing: '-0.3px' }}>Event Sales Breakdown</h2>
          <span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>Click any event to view sold tickets</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
          {eventBreakdown.map((ev) => (
            <div
              key={ev.label}
              onClick={() => setEventModal({ label: ev.label, tickets: ev.tickets })}
              style={{
                background: ev.gradient,
                borderRadius: '16px',
                padding: '20px',
                cursor: 'pointer',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: `0 4px 20px ${ev.color}40`,
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 28px ${ev.color}50` }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 20px ${ev.color}40` }}
            >
              <div style={{ position: 'absolute', top: 16, right: 16, fontSize: '28px', opacity: 0.3 }}>{ev.emoji}</div>
              <div style={{ fontSize: '12px', fontWeight: 600, opacity: 0.85, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{ev.label}</div>
              <div style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '4px' }}>{ev.sold}</div>
              <div style={{ fontSize: '11.5px', opacity: 0.8, marginBottom: '12px' }}>tickets sold · {ev.price} each</div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>₹{ev.revenue.toLocaleString()}</span>
                <span style={{ fontSize: '11px', opacity: 0.75 }}>total revenue</span>
              </div>
              <div style={{ marginTop: '8px', fontSize: '11px', opacity: 0.6, textAlign: 'right' }}>→ View sold tickets</div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart + Live Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '16px' }}>
        {/* Revenue Chart */}
        <div style={{
          backgroundColor: 'var(--card)',
          borderRadius: '20px',
          padding: '24px',
          border: '1px solid var(--border)',
          boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--foreground)', margin: 0, letterSpacing: '-0.3px' }}>Sales Analytics</h2>
              <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: '3px 0 0' }}>
                Period Sales: {period === 'today' ? todayRevenue.toLocaleString() : totalRevenue.toLocaleString()} INR
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {/* Metric toggle */}
              <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--muted)', padding: '3px', borderRadius: '8px' }}>
                {(['revenue', 'orders', 'tickets'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setActiveMetric(m)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: activeMetric === m ? 'var(--card)' : 'transparent',
                      color: activeMetric === m ? 'var(--foreground)' : 'var(--muted-foreground)',
                      fontSize: '11.5px',
                      fontWeight: activeMetric === m ? 600 : 400,
                      cursor: 'pointer',
                      boxShadow: activeMetric === m ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                      textTransform: 'capitalize',
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {/* Period filter */}
              <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--muted)', padding: '3px', borderRadius: '8px' }}>
                {(['today', '7d'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: period === p ? '#9333ea' : 'transparent',
                      color: period === p ? 'white' : 'var(--muted-foreground)',
                      fontSize: '11.5px',
                      fontWeight: period === p ? 600 : 400,
                      cursor: 'pointer',
                    }}
                  >
                    {p === '7d' ? '7D' : 'Today'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={metricColors[activeMetric]} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={metricColors[activeMetric]} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
              <YAxis
                tickFormatter={activeMetric === 'revenue' ? formatRevenue : (v: number) => v.toLocaleString()}
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
                width={52}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  fontSize: '12px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                }}
              />
              <Area
                type="monotone"
                dataKey={activeMetric}
                stroke={metricColors[activeMetric]}
                strokeWidth={2}
                fill="url(#grad)"
                dot={false}
                activeDot={{ r: 4, fill: metricColors[activeMetric], stroke: 'white', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Live Activity Feed */}
        <div style={{
          backgroundColor: 'var(--card)',
          borderRadius: '20px',
          padding: '20px',
          border: '1px solid var(--border)',
          boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '400px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--foreground)', margin: 0, letterSpacing: '-0.3px' }}>Live Activity</h2>
              <p style={{ fontSize: '11px', color: 'var(--muted-foreground)', margin: '2px 0 0' }}>Real-time event stream</p>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {liveFeed.length === 0 ? (
              <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', textAlign: 'center', margin: '20px 0' }}>No activity logged yet.</p>
            ) : (
              liveFeed.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '10px',
                    backgroundColor: 'var(--muted)',
                    borderRadius: '10px',
                    borderLeft: `3px solid ${item.color}`,
                  }}
                >
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '8px',
                    backgroundColor: `${item.color}20`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', flexShrink: 0,
                  }}>
                    {item.dot}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.msg}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.sub}
                    </div>
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', flexShrink: 0, marginTop: '2px' }}>
                    {item.time}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Event Modal: Sold Tickets List */}
    {eventModal && (
      <div
        onClick={() => setEventModal(null)}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            backgroundColor: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: '20px', padding: '28px', width: '580px', maxWidth: '95vw',
            maxHeight: '80vh', display: 'flex', flexDirection: 'column',
            boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--foreground)' }}>
                {eventModal.label}
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--muted-foreground)' }}>
                {eventModal.tickets.length} orders · {eventModal.tickets.reduce((a, s) => a + (s.quantity || 1), 0)} tickets sold
              </p>
            </div>
            <button
              onClick={() => setEventModal(null)}
              style={{
                width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--border)',
                backgroundColor: 'var(--muted)', cursor: 'pointer', color: 'var(--foreground)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
              }}
            >✕</button>
          </div>

          {eventModal.tickets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted-foreground)', fontSize: '13px' }}>
              No tickets sold yet for this event.
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Header row */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 120px 60px',
                gap: '8px', padding: '8px 12px',
                fontSize: '10px', fontWeight: 700, color: 'var(--muted-foreground)',
                textTransform: 'uppercase', letterSpacing: '0.5px',
              }}>
                <span>Attendee</span>
                <span>Email</span>
                <span>Ticket ID</span>
                <span style={{ textAlign: 'right' }}>Amount</span>
              </div>
              {eventModal.tickets.map((sale, i) => (
                <div
                  key={sale.orderId || i}
                  style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr 120px 60px',
                    gap: '8px', padding: '10px 12px',
                    backgroundColor: 'var(--muted)', borderRadius: '10px',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {sale.name || 'Unknown'}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', marginTop: '2px' }}>
                      {sale.status === 'scanned' ? (
                        <span style={{ color: '#f59e0b', fontWeight: 600 }}>● Scanned</span>
                      ) : (
                        <span style={{ color: '#22c55e', fontWeight: 600 }}>● Active</span>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {sale.email}
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--foreground)', fontWeight: 500 }}>
                    #{sale.ticketId || '—'}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#9333ea', textAlign: 'right' }}>
                    ₹{(sale.amount || 0).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )}
  </>
  )
}
