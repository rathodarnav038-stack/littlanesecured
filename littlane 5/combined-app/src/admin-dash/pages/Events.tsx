// Events page — shows the single real event being managed via this system
// Since this is a single-event ticketing system, we derive info from sales data
interface Sale {
  orderId: string
  event: string
  amount: number
  status: string
  scannedAt?: string
  createdAt: string
}

interface Props {
  sales: Sale[]
  adminKey: string
}

export default function Events({ sales, adminKey }: Props) {
  // Aggregate data per event name
  const eventMap = new Map<string, { name: string; totalRevenue: number; ticketsSold: number; scanned: number; firstSale: string; lastSale: string }>()

  sales.forEach(s => {
    const name = s.event || 'Unknown Event'
    const isPaid = s.status === 'paid' || s.status === 'scanned' || s.status === 'generated'
    const existing = eventMap.get(name)
    if (existing) {
      existing.totalRevenue += isPaid ? s.amount : 0
      existing.ticketsSold += isPaid ? 1 : 0
      existing.scanned += s.scannedAt ? 1 : 0
      if (s.createdAt < existing.firstSale) existing.firstSale = s.createdAt
      if (s.createdAt > existing.lastSale) existing.lastSale = s.createdAt
    } else {
      eventMap.set(name, {
        name,
        totalRevenue: isPaid ? s.amount : 0,
        ticketsSold: isPaid ? 1 : 0,
        scanned: s.scannedAt ? 1 : 0,
        firstSale: s.createdAt,
        lastSale: s.createdAt,
      })
    }
  })

  const events = Array.from(eventMap.values())

  if (events.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--foreground)', letterSpacing: '-0.5px', margin: 0 }}>Events</h1>
          <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', margin: '4px 0 0' }}>No events yet — events will appear once orders are placed</p>
        </div>
        <div style={{ backgroundColor: 'var(--card)', borderRadius: '16px', border: '1px solid var(--border)', padding: '60px 20px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '14px' }}>
          🎪 Event data will appear once tickets are sold
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--foreground)', letterSpacing: '-0.5px', margin: 0 }}>Events</h1>
          <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', margin: '4px 0 0' }}>
            {events.length} event{events.length !== 1 ? 's' : ''} · ₹{events.reduce((a, e) => a + e.totalRevenue, 0).toLocaleString()} total revenue
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
        {events.map((event, idx) => {
          const scanPct = event.ticketsSold > 0 ? Math.round((event.scanned / event.ticketsSold) * 100) : 0
          return (
            <div key={event.name} style={{
              backgroundColor: 'var(--card)', borderRadius: '16px', border: '1px solid var(--border)',
              overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(147,51,234,0.12)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 6px rgba(0,0,0,0.04)' }}
            >
              {/* Banner gradient */}
              <div style={{
                height: '120px', display: 'flex', alignItems: 'flex-end', padding: '16px',
                background: idx % 2 === 0
                  ? 'linear-gradient(135deg, #1a0533, #4c1d95, #7c3aed)'
                  : 'linear-gradient(135deg, #0c1445, #1e3a8a, #3b82f6)',
                position: 'relative',
              }}>
                <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                  <span style={{ backgroundColor: '#dcfce7', color: '#16a34a', fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px' }}>
                    🟢 Active
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: '17px', fontWeight: 800, color: 'white', letterSpacing: '-0.3px' }}>{event.name}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>
                    Sales from {event.firstSale ? new Date(event.firstSale).toLocaleDateString() : '—'} to {event.lastSale ? new Date(event.lastSale).toLocaleDateString() : '—'}
                  </div>
                </div>
              </div>

              <div style={{ padding: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                  {[
                    { label: 'Revenue', value: `₹${event.totalRevenue.toLocaleString()}` },
                    { label: 'Tickets Sold', value: event.ticketsSold.toLocaleString() },
                    { label: 'Scanned', value: event.scanned.toLocaleString() },
                  ].map(item => (
                    <div key={item.label} style={{ backgroundColor: 'var(--muted)', borderRadius: '8px', padding: '8px 10px' }}>
                      <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</div>
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--foreground)', marginTop: '2px' }}>{item.value}</div>
                    </div>
                  ))}
                </div>

                {/* Scan progress bar */}
                <div style={{ marginBottom: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--muted-foreground)', marginBottom: '6px' }}>
                    <span>Scan Rate</span>
                    <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{event.scanned} / {event.ticketsSold} ({scanPct}%)</span>
                  </div>
                  <div style={{ height: '6px', backgroundColor: 'var(--muted)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${scanPct}%`,
                      background: 'linear-gradient(90deg, #9333EA, #C084FC)',
                      borderRadius: '3px', transition: 'width 0.8s ease',
                    }} />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
