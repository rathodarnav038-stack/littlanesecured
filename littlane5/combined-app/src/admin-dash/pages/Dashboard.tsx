import { useState, useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

interface DashboardProps {
  sales: any[]
  summary: any
  testMode: boolean
  onManualGenerate: () => void
}

const formatRevenue = (v: number) => {
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`
  if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`
  return `₹${v}`
}

export default function Dashboard({ sales = [], summary = {}, testMode, onManualGenerate }: DashboardProps) {
  const [period, setPeriod] = useState<'today' | '7d' | '30d' | '90d' | 'year'>('7d')
  const [activeMetric, setActiveMetric] = useState<'revenue' | 'orders' | 'tickets'>('revenue')

  const paidSales = sales.filter(s => ['paid', 'ticket_generated', 'emailed', 'email_failed', 'scanned'].includes(s.status))
  const revenueSales = paidSales.filter(s => !s.gender || !String(s.gender).toLowerCase().includes('exclusive'))
  
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
  const ftInvite = paidSales.filter(s =>
    (s.gender || '').toLowerCase().includes('exclusive') || (s.ticketType || '').toLowerCase().includes('exclusive')
  )

  const metricColors = {
    revenue: '#7c5cfc',
    orders: '#54d7ef',
    tickets: '#d2bbff'
  }

  const getChartData = () => {
    const chartData = []
    const now = new Date()

    if (period === '7d') {
      const dayMap = new Map<string, { revenue: number; orders: number; tickets: number }>()
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(d.getDate() - i)
        const key = d.toLocaleDateString('en-IN', { weekday: 'short' })
        dayMap.set(key, { revenue: 0, orders: 0, tickets: 0 })
      }
      paidSales.forEach(s => {
        const d = new Date(s.paidAt || s.createdAt)
        const key = d.toLocaleDateString('en-IN', { weekday: 'short' })
        if (dayMap.has(key)) {
          const cur = dayMap.get(key)!
          cur.revenue += s.amount || 0
          cur.orders += 1
          cur.tickets += s.quantity || 1
        }
      })
      chartData.push(...Array.from(dayMap.entries()).map(([time, v]) => ({ time, ...v })))
    } else {
      const todayStr = now.toDateString()
      const blocks = ['12am', '3am', '6am', '9am', '12pm', '3pm', '6pm', '9pm']
      const blockMap = new Map<string, { revenue: number; orders: number; tickets: number }>()
      blocks.forEach(b => blockMap.set(b, { revenue: 0, orders: 0, tickets: 0 }))
      
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
            cur.tickets += s.quantity || 1
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
      const timeLabel = sale.createdAt ? new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'just now'
      
      list.push({
        id: `created-${sale.orderId}`,
        type: 'purchase',
        msg: `${sale.name || 'Unknown'} initiated booking`,
        sub: `${sale.event || 'Event'} · ₹${sale.amount || 0}`,
        time: timeLabel,
        color: '#7c5cfc', // iris
        dot: 'shopping_cart'
      })

      if (['paid', 'ticket_generated', 'emailed', 'email_failed', 'scanned'].includes(sale.status)) {
        list.push({
          id: `paid-${sale.orderId}`,
          type: 'payment',
          msg: `Payment Verified`,
          sub: `Order #${(sale.orderId || '').substring(0, 10)}`,
          time: sale.paidAt ? new Date(sale.paidAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : timeLabel,
          color: '#10b981', // emerald
          dot: 'verified'
        })
      }
      
      if (sale.emailStatus === 'failed') {
        list.push({
          id: `email-fail-${sale.orderId}`,
          type: 'email-fail',
          msg: `Transaction Failed`,
          sub: sale.emailError || 'Delivery Timeout',
          time: timeLabel,
          color: '#FF3B30', // red
          dot: 'report'
        })
      }

      if (sale.status === 'scanned' || sale.scannedAt) {
        list.push({
          id: `scan-${sale.orderId}`,
          type: 'scan',
          msg: `Ticket Scanned`,
          sub: `Gate Entry: ${sale.ticketId || ''}`,
          time: sale.scannedAt || timeLabel,
          color: '#009fb5', // cyan/teal
          dot: 'qr_code_scanner'
        })
      }
    })
    
    list.sort((a, b) => {
        // basic sort to keep recent things vaguely grouped, usually backend provides ordered list
        return 0 
    })
    return list.slice(0, 20)
  }, [sales])

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Header Section */}
      <div className="flex flex-col gap-1">
        <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Dashboard Overview</h2>
        <p className="text-on-surface-variant font-body-md text-body-md">Welcome back, Atharva. Here's what's happening with LitTix today.</p>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Revenue */}
        <div className="glass-card p-5 rounded-2xl flex flex-col gap-2 group">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined">payments</span>
            </div>
            <div className="text-[11px] font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">Live</div>
          </div>
          <div>
            <p className="text-on-surface-variant text-[12px] uppercase tracking-wider font-bold">Total Revenue</p>
            <h3 className="text-headline-md font-bold font-data-mono mt-1 text-on-surface tracking-tight">₹{totalRevenue.toLocaleString()}</h3>
          </div>
          <div className="h-10 mt-2 w-full">
            <svg className="sparkline w-full h-full" viewBox="0 0 100 20">
              <path d="M0,15 L10,12 L20,18 L30,10 L40,14 L50,8 L60,12 L70,5 L80,10 L90,2 L100,6" fill="none" stroke="#cabeff" strokeWidth="1.5"></path>
            </svg>
          </div>
        </div>

        {/* 2. Today's Revenue */}
        <div className="glass-card p-5 rounded-2xl flex flex-col gap-2">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl bg-tertiary/10 text-tertiary flex items-center justify-center">
              <span className="material-symbols-outlined">calendar_today</span>
            </div>
          </div>
          <div>
            <p className="text-on-surface-variant text-[12px] uppercase tracking-wider font-bold">Today's Revenue</p>
            <h3 className="text-headline-md font-bold font-data-mono mt-1 text-on-surface tracking-tight">₹{todayRevenue.toLocaleString()}</h3>
          </div>
          <div className="h-10 mt-2 w-full">
            <svg className="sparkline w-full h-full" viewBox="0 0 100 20">
              <path d="M0,10 L25,12 L50,5 L75,15 L100,2" fill="none" stroke="#54d7ef" strokeWidth="1.5"></path>
            </svg>
          </div>
        </div>

        {/* 3. Tickets Sold */}
        <div className="glass-card p-5 rounded-2xl flex flex-col gap-2">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
              <span className="material-symbols-outlined">confirmation_number</span>
            </div>
          </div>
          <div>
            <p className="text-on-surface-variant text-[12px] uppercase tracking-wider font-bold">Tickets Sold</p>
            <h3 className="text-headline-md font-bold font-data-mono mt-1 text-on-surface tracking-tight">{totalTickets.toLocaleString()}</h3>
          </div>
          <div className="h-10 mt-2 w-full">
            <svg className="sparkline w-full h-full" viewBox="0 0 100 20">
              <path d="M0,18 L20,10 L40,14 L60,5 L80,8 L100,2" fill="none" stroke="#d2bbff" strokeWidth="1.5"></path>
            </svg>
          </div>
        </div>

        {/* 4. QR Scanned */}
        <div className="glass-card p-5 rounded-2xl flex flex-col gap-2">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl bg-on-tertiary-fixed-variant/20 text-tertiary flex items-center justify-center">
              <span className="material-symbols-outlined">qr_code_scanner</span>
            </div>
          </div>
          <div>
            <p className="text-on-surface-variant text-[12px] uppercase tracking-wider font-bold">QR Scanned</p>
            <h3 className="text-headline-md font-bold font-data-mono mt-1 text-on-surface tracking-tight">{qrScannedCount.toLocaleString()}</h3>
          </div>
          <div className="h-10 mt-2 w-full">
            <svg className="sparkline w-full h-full" viewBox="0 0 100 20">
              <path d="M0,15 L25,18 L50,12 L75,10 L100,5" fill="none" stroke="#009fb5" strokeWidth="1.5"></path>
            </svg>
          </div>
        </div>

        {/* 5. Total Orders */}
        <div className="glass-card p-5 rounded-2xl flex flex-col gap-2">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl bg-primary-container/20 text-primary-container flex items-center justify-center">
              <span className="material-symbols-outlined">shopping_basket</span>
            </div>
          </div>
          <div>
            <p className="text-on-surface-variant text-[12px] uppercase tracking-wider font-bold">Total Orders</p>
            <h3 className="text-headline-md font-bold font-data-mono mt-1 text-on-surface tracking-tight">{sales.length.toLocaleString()}</h3>
          </div>
          <div className="h-10 mt-2 w-full">
            <svg className="sparkline w-full h-full" viewBox="0 0 100 20">
              <path d="M0,5 L20,15 L40,8 L60,18 L80,12 L100,10" fill="none" stroke="#947dff" strokeWidth="1.5"></path>
            </svg>
          </div>
        </div>

        {/* 6. Successful Payments */}
        <div className="glass-card p-5 rounded-2xl flex flex-col gap-2 border-green-500/20">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-400 flex items-center justify-center">
              <span className="material-symbols-outlined">check_circle</span>
            </div>
          </div>
          <div>
            <p className="text-on-surface-variant text-[12px] uppercase tracking-wider font-bold">Successful Payments</p>
            <h3 className="text-headline-md font-bold font-data-mono mt-1 text-green-400 drop-shadow-[0_0_10px_rgba(48,209,88,0.3)]">{paidSales.length.toLocaleString()}</h3>
          </div>
          <div className="h-10 mt-2 w-full">
            <svg className="sparkline w-full h-full" viewBox="0 0 100 20">
              <path d="M0,10 L33,2 L66,5 L100,0" fill="none" stroke="#30D158" strokeWidth="2"></path>
            </svg>
          </div>
        </div>

        {/* 7. Failed Payments */}
        <div className="glass-card p-5 rounded-2xl flex flex-col gap-2 border-[#FF3B30]/40 bg-[#FF3B30]/5 failure-pulse">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl bg-[#FF3B30]/20 text-[#FF3B30] flex items-center justify-center">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
            </div>
          </div>
          <div>
            <p className="text-[#FF3B30] text-[12px] uppercase tracking-wider font-extrabold">Failed Payments</p>
            <h3 className="text-headline-md font-bold font-data-mono mt-1 text-[#FF3B30] drop-shadow-[0_0_15px_rgba(255,59,48,0.6)]">{(sales.length - paidSales.length).toLocaleString()}</h3>
          </div>
          <div className="h-10 mt-2 w-full">
            <svg className="sparkline w-full h-full" viewBox="0 0 100 20">
              <path d="M0,2 L10,18 L20,4 L30,19 L40,5 L50,18 L60,4 L70,19 L80,5 L90,18 L100,2" fill="none" stroke="#FF3B30" strokeWidth="2"></path>
            </svg>
          </div>
        </div>

        {/* 8. Emails Delivered */}
        <div className="glass-card p-5 rounded-2xl flex flex-col gap-2">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl bg-on-secondary-fixed-variant/20 text-on-secondary-fixed-variant flex items-center justify-center">
              <span className="material-symbols-outlined">mail_outline</span>
            </div>
          </div>
          <div>
            <p className="text-on-surface-variant text-[12px] uppercase tracking-wider font-bold">Emails Delivered</p>
            <h3 className="text-headline-md font-bold font-data-mono mt-1 text-on-surface tracking-tight">{sales.filter(s => s.emailStatus === 'sent').length.toLocaleString()}</h3>
          </div>
          <div className="h-10 mt-2 w-full">
            <svg className="sparkline w-full h-full" viewBox="0 0 100 20">
              <path d="M0,10 H100" fill="none" stroke="#552e9b" strokeWidth="1.5"></path>
            </svg>
          </div>
        </div>
      </div>

      {/* Event Performance cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Freshers Male */}
        <div className="relative h-48 rounded-2xl overflow-hidden glass-card group">
          <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 to-transparent z-10"></div>
          <div className="absolute inset-0 bg-blue-500/10 group-hover:bg-blue-500/20 transition-all"></div>
          <div className="absolute bottom-4 left-4 z-20">
            <h4 className="font-headline-md text-headline-md text-white font-bold">Freshers Male</h4>
            <p className="text-blue-200 text-body-sm font-data-mono">₹{freshersMale.reduce((a, s) => a + (s.amount || 0), 0).toLocaleString()} Revenue</p>
          </div>
        </div>
        {/* Freshers Female */}
        <div className="relative h-48 rounded-2xl overflow-hidden glass-card group">
          <div className="absolute inset-0 bg-gradient-to-t from-pink-900/80 to-transparent z-10"></div>
          <div className="absolute inset-0 bg-pink-500/10 group-hover:bg-pink-500/20 transition-all"></div>
          <div className="absolute bottom-4 left-4 z-20">
            <h4 className="font-headline-md text-headline-md text-white font-bold">Freshers Female</h4>
            <p className="text-pink-200 text-body-sm font-data-mono">₹{freshersFemale.reduce((a, s) => a + (s.amount || 0), 0).toLocaleString()} Revenue</p>
          </div>
        </div>
        {/* Aura Genesis */}
        <div className="relative h-48 rounded-2xl overflow-hidden glass-card group">
          <div className="absolute inset-0 bg-gradient-to-t from-orange-900/80 to-transparent z-10"></div>
          <div className="absolute inset-0 bg-orange-500/10 group-hover:bg-orange-500/20 transition-all"></div>
          <div className="absolute bottom-4 left-4 z-20">
            <h4 className="font-headline-md text-headline-md text-white font-bold">Aura Genesis</h4>
            <p className="text-orange-200 text-body-sm font-data-mono">₹{auraGenesis.reduce((a, s) => a + (s.amount || 0), 0).toLocaleString()} Revenue</p>
          </div>
        </div>
        {/* FT Lineup Invite */}
        <div className="relative h-48 rounded-2xl overflow-hidden glass-card group">
          <div className="absolute inset-0 bg-gradient-to-t from-purple-900/80 to-transparent z-10"></div>
          <div className="absolute inset-0 bg-purple-500/10 group-hover:bg-purple-500/20 transition-all"></div>
          <div className="absolute bottom-4 left-4 z-20">
            <h4 className="font-headline-md text-headline-md text-white font-bold">FT Lineup Invite</h4>
            <p className="text-purple-200 text-body-sm font-data-mono">{ftInvite.length} Invites</p>
          </div>
        </div>
      </div>

      {/* Main Content Row: REVENUE ANALYTICS & LIVE FEED */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2/3): Sophisticated Revenue Chart */}
        <div className="lg:col-span-2 obsidian-glass rounded-3xl p-8 flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-headline-md text-headline-md text-on-surface font-semibold">Revenue Analytics</h4>
              <p className="text-on-surface/60 text-body-sm font-light">Global ticket sales performance across all events</p>
            </div>
            <div className="flex bg-white/5 p-1 rounded-full border border-white/10 shadow-inner">
              <button 
                onClick={() => setPeriod('today')}
                className={`px-5 py-1.5 rounded-full text-[12px] font-bold transition-all ${period === 'today' ? 'bg-iris text-white shadow-lg shadow-iris/20' : 'text-on-surface/40 hover:text-on-surface'}`}
              >Today</button>
              <button 
                onClick={() => setPeriod('7d')}
                className={`px-5 py-1.5 rounded-full text-[12px] font-bold transition-all ${period === '7d' ? 'bg-iris text-white shadow-lg shadow-iris/20' : 'text-on-surface/40 hover:text-on-surface'}`}
              >7 Days</button>
            </div>
          </div>
          
          {/* Premium Chart Visualization (Using Recharts but styled) */}
          <div className="flex-1 relative min-h-[360px] w-full flex flex-col">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="irisFlow" x1="0%" x2="0%" y1="0%" y2="100%">
                    <stop offset="0%" stopColor="#7c5cfc" stopOpacity={0.25} />
                    <stop offset="50%" stopColor="#7c5cfc" stopOpacity={0.1} />
                    <stop offset="100%" stopColor="#7c5cfc" stopOpacity={0} />
                  </linearGradient>
                  <filter id="neonGlow">
                    <feGaussianBlur in="SourceGraphic" result="blur" stdDeviation="4" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <YAxis
                  tickFormatter={formatRevenue}
                  stroke="rgba(255,255,255,0.2)"
                  tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)', fontFamily: 'JetBrains Mono' }}
                  axisLine={false}
                  tickLine={false}
                  width={52}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(20,20,22,0.8)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontFamily: 'JetBrains Mono',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                  }}
                  itemStyle={{ color: '#fff', fontWeight: 700 }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#7c5cfc"
                  strokeWidth={3}
                  fill="url(#irisFlow)"
                  dot={false}
                  activeDot={{ r: 6, fill: '#fff', stroke: '#7c5cfc', strokeWidth: 2, filter: 'url(#neonGlow)' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-8 border-t border-white/5 pt-8">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-[0.2em] text-on-surface/40 font-bold">Avg Order Value</span>
              <span className="font-data-mono text-2xl font-semibold text-on-surface tabular-nums">
                ₹{sales.length > 0 ? (totalRevenue / sales.length).toFixed(0) : 0}
              </span>
            </div>
            <div className="flex flex-col gap-1 border-l border-white/10 pl-8">
              <span className="text-[10px] uppercase tracking-[0.2em] text-on-surface/40 font-bold">Conversion Rate</span>
              <span className="font-data-mono text-2xl font-semibold text-on-surface tabular-nums">
                {sales.length > 0 ? ((paidSales.length / sales.length) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="flex flex-col gap-1 border-l border-white/10 pl-8">
              <span className="text-[10px] uppercase tracking-[0.2em] text-on-surface/40 font-bold">Refund Rate</span>
              <span className="font-data-mono text-2xl font-semibold text-tertiary tabular-nums">
                {sales.length > 0 ? ((sales.filter(s => s.status === 'refunded').length / sales.length) * 100).toFixed(2) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Right (1/3): Cinematic Command Stream Activity */}
        <div className="obsidian-glass rounded-3xl flex flex-col h-[650px] overflow-hidden">
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02] backdrop-blur-md">
            <div>
              <h4 className="font-headline-md text-headline-md text-on-surface font-semibold">Live Activity</h4>
              <p className="text-[10px] text-on-surface/40 uppercase tracking-widest mt-1">High Velocity Stream</p>
            </div>
            <div className="flex items-center gap-2 bg-iris/10 border border-iris/20 px-2.5 py-1 rounded">
              <div className="w-1.5 h-1.5 rounded-full bg-iris animate-pulse"></div>
              <span className="text-[10px] text-iris font-bold uppercase tracking-tighter">Live</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {liveFeed.length === 0 ? (
              <p className="text-[12px] text-on-surface/40 text-center mt-10">No activity logged yet.</p>
            ) : (
              liveFeed.map((item, i) => {
                let glowColor = 'iris';
                let rawColor = '#7c5cfc';
                if (item.type === 'payment') { glowColor = 'emerald-500'; rawColor = '#10b981'; }
                if (item.type === 'email-fail') { glowColor = '[#FF3B30]'; rawColor = '#FF3B30'; }
                if (item.type === 'scan') { glowColor = 'tertiary'; rawColor = '#009fb5'; }

                return (
                  <div key={item.id} className={`live-feed-item glass-card p-4 rounded-xl border-l-[3px] group shadow-lg`} style={{
                    borderColor: rawColor,
                    backgroundColor: `${rawColor}08`,
                  }}>
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center`} style={{
                        backgroundColor: `${rawColor}15`,
                        color: rawColor,
                        boxShadow: `inset 0 0 12px ${rawColor}40`
                      }}>
                        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                          {item.dot}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-body-sm font-bold" style={{ color: item.type === 'email-fail' ? rawColor : 'var(--foreground)' }}>
                            {item.msg}
                          </p>
                          <span className="text-[10px] text-on-surface/40 font-data-mono tabular-nums">{item.time}</span>
                        </div>
                        <p className="text-[11px] text-on-surface/60 font-data-mono tabular-nums leading-relaxed">
                          {item.sub}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
