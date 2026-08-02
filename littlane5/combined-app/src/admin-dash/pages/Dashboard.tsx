import { useState, useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'

interface DashboardProps {
  sales: any[]
  summary: any
  testMode: boolean
  onManualGenerate: () => void
}

export default function Dashboard({ sales = [], summary = {}, testMode, onManualGenerate }: DashboardProps) {
  const [period, setPeriod] = useState<'today' | '7d'>('7d')
  const [chartMode, setChartMode] = useState<'actual' | 'forecast'>('actual')

  const paidSales = sales.filter(s =>
    ['paid', 'ticket_generated', 'emailed', 'email_failed', 'scanned'].includes(s.status)
  )
  const revenueSales = paidSales.filter(
    s => !s.gender || !String(s.gender).toLowerCase().includes('exclusive')
  )

  const totalRevenue = revenueSales.reduce((acc, s) => acc + (s.amount || 0), 0)
  const totalTickets = paidSales.reduce((acc, s) => acc + (s.quantity || 1), 0)

  const todayStr = new Date().toDateString()
  const todayRevenue = revenueSales
    .filter(s => s.createdAt && new Date(s.createdAt).toDateString() === todayStr)
    .reduce((acc, s) => acc + (s.amount || 0), 0)

  const emailFailures = sales.filter(s => s.emailStatus === 'failed').length
  const ticketFailures = sales.filter(s => s.status === 'ticket_generation_failed').length
  const qrScannedCount = sales.filter(s => s.status === 'scanned' || !!s.scannedAt).length

  // Event breakdown
  const freshersMale = paidSales.filter(
    s =>
      (s.event || '').toUpperCase().includes('FRESHERS') &&
      (s.gender === 'male' || (s.ticketType || '').toLowerCase().includes('male'))
  )
  const freshersFemale = paidSales.filter(
    s =>
      (s.event || '').toUpperCase().includes('FRESHERS') &&
      (s.gender === 'female' || (s.ticketType || '').toLowerCase().includes('female'))
  )
  const auraGenesis = paidSales.filter(s => (s.event || '').toUpperCase().includes('AURA'))
  const ftInvite = paidSales.filter(
    s =>
      (s.gender || '').toLowerCase().includes('exclusive') ||
      (s.ticketType || '').toLowerCase().includes('exclusive')
  )

  const maleCount = freshersMale.reduce((acc, s) => acc + (s.quantity || 1), 0)
  const femaleCount = freshersFemale.reduce((acc, s) => acc + (s.quantity || 1), 0)
  const auraCount = auraGenesis.reduce((acc, s) => acc + (s.quantity || 1), 0)
  const inviteCount = ftInvite.reduce((acc, s) => acc + (s.quantity || 1), 0)
  const grandTotal = Math.max(1, totalTickets)

  const malePct = Math.round((maleCount / grandTotal) * 100)
  const femalePct = Math.round((femaleCount / grandTotal) * 100)
  const auraPct = Math.round((auraCount / grandTotal) * 100)
  const invitePct = Math.round((inviteCount / grandTotal) * 100)

  const getChartData = () => {
    const chartData = []
    const now = new Date()

    if (period === '7d') {
      const dayMap = new Map<string, { revenue: number; orders: number; forecast: number }>()
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(d.getDate() - i)
        const key = d.toLocaleDateString('en-IN', { weekday: 'short' })
        dayMap.set(key, { revenue: 0, orders: 0, forecast: 5000 })
      }
      paidSales.forEach(s => {
        const d = new Date(s.paidAt || s.createdAt)
        const key = d.toLocaleDateString('en-IN', { weekday: 'short' })
        if (dayMap.has(key)) {
          const cur = dayMap.get(key)!
          cur.revenue += s.amount || 0
          cur.orders += 1
          cur.forecast = cur.revenue * 1.25 + 1200
        }
      })
      chartData.push(...Array.from(dayMap.entries()).map(([time, v]) => ({ time, ...v })))
    } else {
      const blocks = ['12am', '3am', '6am', '9am', '12pm', '3pm', '6pm', '9pm']
      const blockMap = new Map<string, { revenue: number; orders: number; forecast: number }>()
      blocks.forEach(b => blockMap.set(b, { revenue: 0, orders: 0, forecast: 1000 }))

      paidSales.forEach(s => {
        const d = new Date(s.paidAt || s.createdAt)
        if (d.toDateString() === todayStr) {
          const hour = d.getHours()
          const blockIndex = Math.floor(hour / 3)
          const key = blocks[blockIndex]
          if (blockMap.has(key)) {
            const cur = blockMap.get(key)!
            cur.revenue += s.amount || 0
            cur.orders += 1
            cur.forecast = cur.revenue * 1.2 + 500
          }
        }
      })
      chartData.push(...Array.from(blockMap.entries()).map(([time, v]) => ({ time, ...v })))
    }
    return chartData
  }

  const chartData = getChartData()

  const liveFeed = useMemo(() => {
    const list: any[] = []
    sales.slice(0, 15).forEach(sale => {
      const timeLabel = sale.createdAt
        ? new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'just now'

      list.push({
        id: `created-${sale.orderId}`,
        type: 'purchase',
        title: `${sale.name || 'Attendee'} booked a pass`,
        sub: `${sale.event || 'FRESHERS TAKEOVER'} · ₹${sale.amount || 0}`,
        time: timeLabel,
        badge: <span className="badge badge-blue"><span className="badge-dot" />New</span>,
      })

      if (['paid', 'ticket_generated', 'emailed', 'scanned'].includes(sale.status)) {
        list.push({
          id: `paid-${sale.orderId}`,
          type: 'payment',
          title: `Payment verified for ${sale.name || 'Attendee'}`,
          sub: `Order #${(sale.orderId || '').substring(0, 8)}`,
          time: sale.paidAt
            ? new Date(sale.paidAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : timeLabel,
          badge: <span className="badge badge-green"><span className="badge-dot" />Paid</span>,
        })
      }

      if (sale.emailStatus === 'failed') {
        list.push({
          id: `email-fail-${sale.orderId}`,
          type: 'email-fail',
          title: `Email delivery failed`,
          sub: sale.emailError || 'SMTP timeout',
          time: timeLabel,
          badge: <span className="badge badge-red"><span className="badge-dot" />Failed</span>,
        })
      }

      if (sale.status === 'scanned' || sale.scannedAt) {
        list.push({
          id: `scan-${sale.orderId}`,
          type: 'scan',
          title: `Gate QR scan validated`,
          sub: `Ticket #${sale.ticketId || ''}`,
          time: sale.scannedAt || timeLabel,
          badge: <span className="badge badge-green"><span className="badge-dot" />Valid</span>,
        })
      }
    })
    return list.slice(0, 8)
  }, [sales])

  // Calculate Health Score
  const healthScore = Math.max(
    10,
    Math.min(
      99,
      Math.round(
        100 -
          (emailFailures > 0 ? (emailFailures / Math.max(1, sales.length)) * 100 : 0) -
          (ticketFailures > 0 ? (ticketFailures / Math.max(1, sales.length)) * 100 : 0)
      )
    )
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gutter)' }}>
      {/* KPI Stat Tiles (Reference .kpi-row Layout) */}
      <div className="kpi-row">
        <div className="tile tile-orange">
          <div className="tile-label">REVENUE MTD</div>
          <div className="tile-value">₹{totalRevenue.toLocaleString()}</div>
          <div className="tile-sub">From {paidSales.length} paid passes</div>
          <div className="tile-delta">
            <span>↑</span> ₹{todayRevenue.toLocaleString()} today
          </div>
        </div>

        <div className="tile tile-teal">
          <div className="tile-label">TOTAL ORDERS</div>
          <div className="tile-value">{sales.length}</div>
          <div className="tile-sub">{paidSales.length} confirmed paid</div>
          <div className="tile-delta">
            <span>↑</span> {testMode ? 'Test mode' : 'Live mode'}
          </div>
        </div>

        <div className="tile tile-gold">
          <div className="tile-label">TICKETS SCANNED</div>
          <div className="tile-value">{qrScannedCount}</div>
          <div className="tile-sub">Of {totalTickets} total passes</div>
          <div className="tile-delta">
            <span>✓</span> Gate active
          </div>
        </div>

        <div className="tile tile-dark">
          <div className="tile-label">SYSTEM FAILURES</div>
          <div className="tile-value">{emailFailures + ticketFailures}</div>
          <div className="tile-sub">{emailFailures} email · {ticketFailures} ticket</div>
          <div className={`tile-delta ${emailFailures + ticketFailures > 0 ? 'down' : 'up'}`}>
            <span>{emailFailures + ticketFailures > 0 ? '⚠' : '✓'}</span>{' '}
            {emailFailures + ticketFailures > 0 ? 'Requires attention' : 'All clear'}
          </div>
        </div>
      </div>

      {/* Main Split Content Row */}
      <div className="main-row">
        {/* Left Column */}
        <div className="left-col">
          {/* Revenue Chart Card */}
          <div className="card chart-card">
            <div className="card-head">
              <div>
                <h3>Revenue vs. Forecast</h3>
                <div className="muted-sm">Live pass sales, rolling timeframe</div>
              </div>
              <div className="card-head-actions">
                <div className="pill-toggle">
                  <button
                    className={period === '7d' ? 'active' : ''}
                    onClick={() => setPeriod('7d')}
                  >
                    7 Days
                  </button>
                  <button
                    className={period === 'today' ? 'active' : ''}
                    onClick={() => setPeriod('today')}
                  >
                    Today
                  </button>
                </div>
                <div className="pill-toggle" style={{ marginLeft: '6px' }}>
                  <button
                    className={chartMode === 'actual' ? 'active' : ''}
                    onClick={() => setChartMode('actual')}
                  >
                    Actual
                  </button>
                  <button
                    className={chartMode === 'forecast' ? 'active' : ''}
                    onClick={() => setChartMode('forecast')}
                  >
                    Forecast
                  </button>
                </div>
              </div>
            </div>

            <div style={{ height: '220px', width: '100%', marginTop: '10px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7C5CFA" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#7C5CFA" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38D9C4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#38D9C4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="time"
                    stroke="#64626F"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#64626F"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `₹${v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#181A24',
                      borderColor: 'rgba(255,255,255,0.08)',
                      borderRadius: '10px',
                      color: '#F5F4F8',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [`₹${val}`, chartMode === 'actual' ? 'Revenue' : 'Forecast']}
                  />
                  <Area
                    type="monotone"
                    dataKey={chartMode === 'actual' ? 'revenue' : 'forecast'}
                    stroke={chartMode === 'actual' ? '#7C5CFA' : '#38D9C4'}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill={`url(#${chartMode === 'actual' ? 'areaGrad' : 'forecastGrad'})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bottom Split Row (Gauge + Ticket Split) */}
          <div className="top-row">
            {/* System Health Score Gauge Card */}
            <div className="card gauge-card" style={{ flex: 1 }}>
              <div className="card-head">
                <h3>System Health Score</h3>
              </div>
              <div className="gauge-wrap" style={{ height: '140px' }}>
                <svg width="140" height="140" viewBox="0 0 160 160">
                  <defs>
                    <linearGradient id="gg" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#38D9C4" />
                      <stop offset="100%" stopColor="#7C5CFA" />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="80"
                    cy="80"
                    r="60"
                    fill="none"
                    stroke="var(--panel-3)"
                    strokeWidth="12"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="60"
                    fill="none"
                    stroke="url(#gg)"
                    strokeWidth="12"
                    strokeDasharray="377"
                    strokeDashoffset={377 - (377 * healthScore) / 100}
                    strokeLinecap="round"
                    transform="rotate(-90 80 80)"
                    style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                  />
                </svg>
                <div className="gauge-center">
                  <div className="n">{healthScore}</div>
                  <div className="l">Score</div>
                </div>
              </div>
            </div>

            {/* Ticket Type Split Card */}
            <div className="card" style={{ flex: 1.3 }}>
              <div className="card-head">
                <h3>Ticket Type Distribution</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="tier-row">
                  <div className="h">
                    <span style={{ color: 'var(--ink)' }}>Male Pass (₹499)</span>
                    <span className="muted">{maleCount} ({malePct}%)</span>
                  </div>
                  <div className="bar">
                    <div
                      className="fill"
                      style={{ width: `${malePct}%`, background: 'var(--grad-violet)' }}
                    />
                  </div>
                </div>

                <div className="tier-row">
                  <div className="h">
                    <span style={{ color: 'var(--ink)' }}>Female Pass (₹399)</span>
                    <span className="muted">{femaleCount} ({femalePct}%)</span>
                  </div>
                  <div className="bar">
                    <div
                      className="fill"
                      style={{ width: `${femalePct}%`, background: 'var(--grad-teal)' }}
                    />
                  </div>
                </div>

                <div className="tier-row">
                  <div className="h">
                    <span style={{ color: 'var(--ink)' }}>Aura Genesis</span>
                    <span className="muted">{auraCount} ({auraPct}%)</span>
                  </div>
                  <div className="bar">
                    <div
                      className="fill"
                      style={{ width: `${auraPct}%`, background: 'var(--grad-gold)' }}
                    />
                  </div>
                </div>

                <div className="tier-row">
                  <div className="h">
                    <span style={{ color: 'var(--ink)' }}>FT Lineup VIP Invite</span>
                    <span className="muted">{inviteCount} ({invitePct}%)</span>
                  </div>
                  <div className="bar">
                    <div
                      className="fill"
                      style={{ width: `${invitePct}%`, background: 'var(--grad-orange)' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="right-col">
          {/* Creative Promo Card */}
          <div className="promo-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div className="mark" style={{ width: '28px', height: '28px', fontSize: '13px', background: 'rgba(255,255,255,0.2)' }}>
                L
              </div>
              <span className="badge-pro" style={{ background: 'rgba(255,255,255,0.25)' }}>
                LITTLANE CREATIVE
              </span>
            </div>

            <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 800 }}>
              Freshers Takeover & Aura Genesis
            </h3>
            <p style={{ margin: 0, fontSize: '12px', opacity: 0.9, lineHeight: 1.4 }}>
              Pune's premier college fest ops engine. Instant QR validation, manual pass issue, & automated delivery.
            </p>

            <div className="promo-btns">
              <button
                className="promo-btn promo-btn-primary"
                onClick={onManualGenerate}
              >
                + Issue Pass
              </button>
              <button
                className="promo-btn promo-btn-secondary"
                onClick={() => {
                  alert('LitTix Live Ops is active and synchronized with Razorpay & Gmail SMTP.')
                }}
              >
                Ops Status
              </button>
            </div>
          </div>

          {/* Activity Timeline Card */}
          <div className="card timeline-card" style={{ flex: 1 }}>
            <div className="card-head">
              <h3>Real-Time Live Activity</h3>
              <div className="muted-sm">Latest 8 events</div>
            </div>

            <div className="timeline scroll" style={{ maxHeight: '340px' }}>
              {liveFeed.length === 0 ? (
                <div style={{ color: 'var(--ink-faint)', fontSize: '12px', padding: '16px 0', textAlign: 'center' }}>
                  No activity logged yet.
                </div>
              ) : (
                liveFeed.map(item => (
                  <div className="tl-item" key={item.id}>
                    <div className="tl-dot">
                      <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
                        {item.type === 'payment'
                          ? 'verified'
                          : item.type === 'email-fail'
                          ? 'report'
                          : item.type === 'scan'
                          ? 'qr_code_scanner'
                          : 'shopping_cart'}
                      </span>
                    </div>
                    <div className="tl-body">
                      <div className="t">
                        <b>{item.title}</b>
                      </div>
                      <div className="time">{item.time} · {item.sub}</div>
                      <div className="tl-tags">{item.badge}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
