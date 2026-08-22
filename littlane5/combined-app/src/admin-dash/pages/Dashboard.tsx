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
  const [period, setPeriod] = useState<'today' | '7d' | '30d'>('7d')
  const [chartMode, setChartMode] = useState<'actual' | 'forecast'>('actual')
  const [popupEvent, setPopupEvent] = useState<{ name: string; top: number; left: number } | null>(null)

  const paidSales = sales.filter(s =>
    ['paid', 'ticket_generated', 'emailed', 'email_failed', 'scanned', 'pr_cash_pending'].includes(s.status)
  )
  const revenueSales = paidSales.filter(
    s => s.status !== 'pr_cash_pending' && (!s.gender || !String(s.gender).toLowerCase().includes('exclusive'))
  )

  const totalRevenue = revenueSales.reduce((acc, s) => acc + (s.amount || 0), 0)
  const totalTickets = paidSales.reduce((acc, s) => acc + (s.quantity || 1), 0)

  const todayStr = new Date().toDateString()
  const todayRevenue = revenueSales
    .filter(s => s.createdAt && new Date(s.createdAt).toDateString() === todayStr)
    .reduce((acc, s) => acc + (s.amount || 0), 0)

  const manualSales = revenueSales.filter(s => s.paymentId === 'manual')
  const razorpaySales = revenueSales.filter(s => s.paymentId !== 'manual')

  const manualRevenue = manualSales.reduce((acc, s) => acc + (s.amount || 0), 0)
  const razorpayRevenue = razorpaySales.reduce((acc, s) => acc + (s.amount || 0), 0)

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

  // Takeover 2.0 (Coffee Rave) — also catch old 'FRESHERS TAKEOVER' records already in DB
  const isT2Sale = (s: any) => {
    const ev = (s.event || '').toUpperCase()
    return ev.includes('TAKEOVER 2') || ev.includes('FRESHERS') || ev === ''
  }
  const takeover2Male = paidSales.filter(
    s =>
      isT2Sale(s) &&
      (s.gender === 'male' || (s.ticketType || '').toLowerCase().includes('male'))
  )
  const takeover2Female = paidSales.filter(
    s =>
      isT2Sale(s) &&
      (s.gender === 'female' || (s.ticketType || '').toLowerCase().includes('female'))
  )

  const t2MaleCount = takeover2Male.reduce((acc, s) => acc + (s.quantity || 1), 0)
  const t2FemaleCount = takeover2Female.reduce((acc, s) => acc + (s.quantity || 1), 0)
  const t2MaleRevenue = takeover2Male.reduce((acc, s) => acc + (s.status === 'pr_cash_pending' ? 0 : s.amount || 0), 0)
  const t2FemaleRevenue = takeover2Female.reduce((acc, s) => acc + (s.status === 'pr_cash_pending' ? 0 : s.amount || 0), 0)
  const grandTotal = Math.max(1, totalTickets)

  const t2MalePct = Math.round((t2MaleCount / grandTotal) * 100)
  const t2FemalePct = Math.round((t2FemaleCount / grandTotal) * 100)

  const getChartData = () => {
    const chartData = []
    const now = new Date()

    if (period === '30d' || period === '7d') {
      const daysCount = period === '30d' ? 29 : 6
      const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      
      const dateKeyMap = new Map<string, { label: string; revenue: number; orders: number; forecast: number }>()
      for (let i = daysCount; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(d.getDate() - i)
        const dateKey = d.toISOString().slice(0, 10)
        
        let label = ''
        if (period === '7d') {
          label = weekdays[d.getDay()]
        } else {
          // 30d label format: "Aug 4" (to prevent overlapping on x-axis)
          label = `${months[d.getMonth()]} ${d.getDate()}`
        }
        
        dateKeyMap.set(dateKey, { label, revenue: 0, orders: 0, forecast: 0 })
      }
      paidSales.forEach(s => {
        const raw = s.paidAt || s.createdAt
        if (!raw) return
        const d = new Date(raw)
        const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        if (dateKeyMap.has(dateKey)) {
          const cur = dateKeyMap.get(dateKey)!
          cur.revenue += s.amount || 0
          cur.orders += 1
        }
      })
      chartData.push(...Array.from(dateKeyMap.values()).map(v => ({
        time: v.label,
        revenue: v.revenue,
        orders: v.orders,
        forecast: v.revenue > 0 ? Math.round(v.revenue * 1.25 + 1200) : 0,
      })))
    } else {
      const blocks = ['12am', '3am', '6am', '9am', '12pm', '3pm', '6pm', '9pm']
      const blockMap = new Map<string, { revenue: number; orders: number; forecast: number }>()
      blocks.forEach(b => blockMap.set(b, { revenue: 0, orders: 0, forecast: 0 }))

      paidSales.forEach(s => {
        const raw = s.paidAt || s.createdAt
        if (!raw) return
        const d = new Date(raw)
        if (d.toDateString() === todayStr) {
          const hour = d.getHours()
          const blockIndex = Math.floor(hour / 3)
          const key = blocks[blockIndex]
          if (blockMap.has(key)) {
            const cur = blockMap.get(key)!
            cur.revenue += s.amount || 0
            cur.orders += 1
            cur.forecast = Math.round(cur.revenue * 1.2 + 500)
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
    sales.forEach(sale => {
      const generatedAt = sale.generatedAt || sale.createdAt
      const dateVal = generatedAt ? new Date(generatedAt) : new Date()
      const diffMin = Math.round((Date.now() - dateVal.getTime()) / 60000)
      const timeLabel =
        diffMin > 60
          ? `${Math.round(diffMin / 60)}h ago`
          : diffMin > 0
          ? `${diffMin}m ago`
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

      if (sale.status === 'pr_cash_pending') {
        list.push({
          id: `pr-cash-${sale.orderId}`,
          type: 'purchase',
          title: `PR cash sale — ${sale.name || 'Attendee'} (${sale.prName || sale.prUserId || 'PR'})`,
          sub: `${sale.event || 'TAKEOVER 2.0'} · ₹${sale.amount || 0} · Awaiting approval`,
          time: timeLabel,
          badge: <span className="badge" style={{ background: 'rgba(251,146,60,0.2)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.4)' }}><span className="badge-dot" style={{ background: '#fb923c' }} />PR Pending</span>,
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
      <div className="kpi-row">
        <div className="tile tile-orange">
          <div className="tile-label">REVENUE MTD</div>
          <div className="tile-value">₹{totalRevenue.toLocaleString()}</div>
          <div className="tile-sub">From {paidSales.length} paid passes</div>
          <div className="tile-delta">
            <span>↑</span> Verified sales
          </div>
        </div>

        <div className="tile tile-teal">
          <div className="tile-label">TODAY'S REVENUE</div>
          <div className="tile-value">₹{todayRevenue.toLocaleString()}</div>
          <div className="tile-sub">Sales logged today</div>
          <div className="tile-delta">
            <span>🟢</span> Live operations
          </div>
        </div>

        <div className="tile tile-violet">
          <div className="tile-label">COLLECTED BY METHOD</div>
          <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, opacity: 0.85 }}>Razorpay:</span>
              <span style={{ fontSize: '15px', fontWeight: 800 }}>₹{razorpayRevenue.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, opacity: 0.85 }}>Manual:</span>
              <span style={{ fontSize: '15px', fontWeight: 800 }}>₹{manualRevenue.toLocaleString()}</span>
            </div>
          </div>
          <div className="tile-delta" style={{ marginTop: '10px' }}>
            <span>💳</span> RZP ({razorpaySales.length}) · MAN ({manualSales.length})
          </div>
        </div>

        <div className="tile tile-gold">
          <div className="tile-label">CONFIRMED PAID</div>
          <div className="tile-value">{paidSales.length}</div>
          <div className="tile-sub">Tickets successfully issued</div>
          <div className="tile-delta">
            <span>✓</span> {testMode ? 'Test mode' : 'Live mode'}
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
                    className={period === '30d' ? 'active' : ''}
                    onClick={() => setPeriod('30d')}
                  >
                    30 Days
                  </button>
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
                    <span style={{ color: 'var(--ink)' }}>Takeover 2.0 Male (₹499)</span>
                    <span className="muted">{t2MaleCount} ({t2MalePct}%)</span>
                  </div>
                  <div className="bar">
                    <div
                      className="fill"
                      style={{ width: `${t2MalePct}%`, background: 'var(--grad-violet)' }}
                    />
                  </div>
                </div>

                <div className="tier-row">
                  <div className="h">
                    <span style={{ color: 'var(--ink)' }}>Takeover 2.0 Female (₹399)</span>
                    <span className="muted">{t2FemaleCount} ({t2FemalePct}%)</span>
                  </div>
                  <div className="bar">
                    <div
                      className="fill"
                      style={{ width: `${t2FemalePct}%`, background: 'var(--grad-teal)' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="right-col">
          {/* Creative Event Overview Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '12px' }}>
            {/* Takeover 2.0 Male Pass */}
            <div
              className="card lt-hover-lift"
              style={{
                cursor: 'default',
                background: 'linear-gradient(135deg, rgba(124,92,250,0.15) 0%, rgba(157,123,255,0.05) 100%)',
                border: '1px solid rgba(124,92,250,0.3)',
                overflow: 'hidden',
                position: 'relative',
                padding: 0,
                borderRadius: 'var(--radius-md)',
              }}
            >
              <img src="/takeover2.jpeg" alt="Takeover 2.0" style={{ width: '100%', height: '70px', objectFit: 'cover', display: 'block', opacity: 0.15, filter: 'blur(10px)', transform: 'scale(1.2)' }} />
              <div style={{ position: 'absolute', inset: 0, padding: '10px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '15px' }}>☕</span>
                    <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#c4b5fd' }}>Takeover 2.0 — Male</h4>
                  </div>
                  <p style={{ margin: '3px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.55)' }}>₹499 · Coffee Rave · Male Passes</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#7C5CFA', fontFamily: 'monospace' }}>{t2MaleCount}</div>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em' }}>SOLD · ₹{t2MaleRevenue.toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Takeover 2.0 Female Pass */}
            <div
              className="card lt-hover-lift"
              style={{
                cursor: 'default',
                background: 'linear-gradient(135deg, rgba(236,72,153,0.15) 0%, rgba(244,63,94,0.05) 100%)',
                border: '1px solid rgba(236,72,153,0.3)',
                overflow: 'hidden',
                position: 'relative',
                padding: 0,
                borderRadius: 'var(--radius-md)',
              }}
            >
              <img src="/takeover2.jpeg" alt="Takeover 2.0" style={{ width: '100%', height: '70px', objectFit: 'cover', display: 'block', opacity: 0.15, filter: 'blur(10px)', transform: 'scale(1.2)' }} />
              <div style={{ position: 'absolute', inset: 0, padding: '10px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '15px' }}>☕</span>
                    <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#f9a8d4' }}>Takeover 2.0 — Female</h4>
                  </div>
                  <p style={{ margin: '3px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.55)' }}>₹399 · Coffee Rave · Female Passes</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#EC4899', fontFamily: 'monospace' }}>{t2FemaleCount}</div>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em' }}>SOLD · ₹{t2FemaleRevenue.toLocaleString()}</div>
                </div>
              </div>
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

      {popupEvent && (
        <>
          {/* Transparent click catcher backdrop */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 199,
              background: 'rgba(0, 0, 0, 0.25)',
              backdropFilter: 'blur(3px)',
              WebkitBackdropFilter: 'blur(3px)',
            }}
            onClick={() => setPopupEvent(null)}
          />

          <div
            className="scroll"
            style={{
              position: 'fixed',
              top: `${Math.max(80, Math.min(popupEvent.top, window.innerHeight - 520))}px`,
              left: `${Math.max(20, popupEvent.left)}px`,
              width: '500px',
              maxWidth: '90vw',
              maxHeight: '480px',
              overflowY: 'auto',
              background: 'var(--panel)',
              border: '1px solid var(--line)',
              borderRadius: '20px',
              boxShadow: 'var(--shadow-card)',
              padding: '24px',
              zIndex: 200,
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--ink)' }}>
                  {popupEvent.name === 'freshers male' ? '🎉 Freshers Takeover (Male)' : popupEvent.name === 'freshers female' ? '👩 Freshers Takeover (Female)' : popupEvent.name === 'aura genesis' ? '✨ Aura Genesis' : '⭐ FT Lineup Invite'} — Buyers
                </h3>
                <div style={{ fontSize: '11px', color: 'var(--ink-soft)', marginTop: '4px' }}>
                  {(() => {
                    const list = popupEvent.name === 'freshers male'
                       ? paidSales.filter(s => !(s.gender || '').toLowerCase().includes('exclusive') && !(s.event || '').toUpperCase().includes('AURA') && (s.gender === 'male' || (s.ticketType || '').toLowerCase().includes('male')))
                       : popupEvent.name === 'freshers female'
                       ? paidSales.filter(s => !(s.gender || '').toLowerCase().includes('exclusive') && !(s.event || '').toUpperCase().includes('AURA') && (s.gender === 'female' || (s.ticketType || '').toLowerCase().includes('female')))
                       : popupEvent.name === 'aura genesis'
                       ? paidSales.filter(s => (s.event || '').toUpperCase().includes('AURA'))
                       : paidSales.filter(s => (s.gender || '').toLowerCase().includes('exclusive') || (s.ticketType || '').toLowerCase().includes('exclusive'))
                    return `${list.length} ticket buyers`
                  })()}
                </div>
              </div>
              <button
                onClick={() => setPopupEvent(null)}
                style={{
                  background: 'var(--panel-2)',
                  border: '1px solid var(--line)',
                  color: 'var(--ink)',
                  width: '30px',
                  height: '30px',
                  borderRadius: '9px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>

            {/* Buyer List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(() => {
                const list = popupEvent.name === 'freshers male'
                  ? paidSales.filter(s => !(s.gender || '').toLowerCase().includes('exclusive') && !(s.event || '').toUpperCase().includes('AURA') && (s.gender === 'male' || (s.ticketType || '').toLowerCase().includes('male')))
                  : popupEvent.name === 'freshers female'
                  ? paidSales.filter(s => !(s.gender || '').toLowerCase().includes('exclusive') && !(s.event || '').toUpperCase().includes('AURA') && (s.gender === 'female' || (s.ticketType || '').toLowerCase().includes('female')))
                  : popupEvent.name === 'aura genesis'
                  ? paidSales.filter(s => (s.event || '').toUpperCase().includes('AURA'))
                  : paidSales.filter(s => (s.gender || '').toLowerCase().includes('exclusive') || (s.ticketType || '').toLowerCase().includes('exclusive'))

                if (list.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: '32px', color: 'var(--ink-faint)', fontSize: '13px' }}>
                      No buyers for this event yet.
                    </div>
                  )
                }

                return list.map((s: any, idx: number) => (
                  <div
                    key={s.orderId || idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      background: 'var(--panel-2)',
                      border: '1px solid var(--line)',
                      borderRadius: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '9px',
                        background: popupEvent.name === 'freshers male' ? 'var(--grad-violet)' : popupEvent.name === 'freshers female' ? 'linear-gradient(135deg, #EC4899 0%, #F43F5E 100%)' : popupEvent.name === 'aura genesis' ? 'var(--grad-teal)' : 'var(--grad-gold)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: 700,
                      }}>
                        {(s.name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--ink)' }}>{s.name || 'Unknown'}</div>
                        <div style={{ fontSize: '10.5px', color: 'var(--ink-soft)' }}>{s.email || '—'}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--ink)' }}>₹{(s.amount || 0).toLocaleString()}</div>
                      <div style={{ fontSize: '10px', color: 'var(--ink-faint)' }}>{s.gender || 'pass'}</div>
                    </div>
                  </div>
                ))
              })()}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
