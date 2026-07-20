import { useState, useEffect } from 'react'

interface Sale {
  orderId: string
  name: string
  email: string
  phone?: string
  gender?: string
  quantity: number
  amount: number
  event: string
  createdAt: string
  status: string
  ticketId?: string
}

interface CustomerRecord {
  name: string
  email: string
  phone: string
  orders: number
  spend: number
  lastPurchase: string
  refunds: number
  avatar: string
}

const gradients = [
  'linear-gradient(135deg, #9333EA, #C084FC)',
  'linear-gradient(135deg, #3b82f6, #60a5fa)',
  'linear-gradient(135deg, #22c55e, #4ade80)',
  'linear-gradient(135deg, #f59e0b, #fbbf24)',
  'linear-gradient(135deg, #ef4444, #f87171)',
  'linear-gradient(135deg, #06b6d4, #22d3ee)',
  'linear-gradient(135deg, #8b5cf6, #a78bfa)',
  'linear-gradient(135deg, #ec4899, #f472b6)',
]

interface Props {
  sales: Sale[]
  adminKey: string
}

export default function Customers({ sales, adminKey }: Props) {
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [search, setSearch] = useState('')

  // Derive real customers from sales data
  const customerMap = new Map<string, CustomerRecord>()
  sales.forEach(sale => {
    const key = sale.email
    const existing = customerMap.get(key)
    const isPaid = sale.status === 'paid' || sale.status === 'scanned' || sale.status === 'generated'
    if (existing) {
      existing.orders += 1
      existing.spend += isPaid ? sale.amount : 0
      if (sale.createdAt > existing.lastPurchase) existing.lastPurchase = sale.createdAt
    } else {
      const initials = sale.name
        .split(' ')
        .map(w => w[0]?.toUpperCase() || '')
        .slice(0, 2)
        .join('')
      customerMap.set(key, {
        name: sale.name,
        email: sale.email,
        phone: sale.phone || '—',
        orders: 1,
        spend: isPaid ? sale.amount : 0,
        lastPurchase: sale.createdAt || '',
        refunds: 0,
        avatar: initials || '??',
      })
    }
  })

  const customers = Array.from(customerMap.values()).sort((a, b) => b.spend - a.spend)

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  )

  if (customers.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--foreground)', letterSpacing: '-0.5px', margin: 0 }}>Customers</h1>
          <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', margin: '4px 0 0' }}>No customers yet — ticket purchases will appear here</p>
        </div>
        <div style={{ backgroundColor: 'var(--card)', borderRadius: '16px', border: '1px solid var(--border)', padding: '60px 20px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '14px' }}>
          👥 Customer data will appear once orders are placed
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--foreground)', letterSpacing: '-0.5px', margin: 0 }}>Customers</h1>
          <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', margin: '4px 0 0' }}>{customers.length} unique customers</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}>
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers..." style={{
              paddingLeft: '32px', paddingRight: '12px', paddingTop: '8px', paddingBottom: '8px',
              backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px',
              fontSize: '13px', color: 'var(--foreground)', outline: 'none', width: '220px',
            }} />
          </div>
          <div style={{ display: 'flex', backgroundColor: 'var(--muted)', borderRadius: '8px', padding: '3px', gap: '2px' }}>
            {(['grid', 'list'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: '5px 10px', borderRadius: '6px', border: 'none',
                backgroundColor: view === v ? '#9333ea' : 'transparent',
                color: view === v ? 'white' : 'var(--muted-foreground)',
                fontSize: '11.5px', fontWeight: 600, cursor: 'pointer',
              }}>{v === 'grid' ? '⊞' : '≡'}</button>
            ))}
          </div>
        </div>
      </div>

      {view === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {filtered.map((c, i) => (
            <div key={c.email} style={{
              backgroundColor: 'var(--card)', borderRadius: '16px', border: '1px solid var(--border)',
              padding: '20px', boxShadow: '0 1px 6px rgba(0,0,0,0.04)', cursor: 'pointer',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(147,51,234,0.1)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 6px rgba(0,0,0,0.04)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '50%',
                  background: gradients[i % gradients.length],
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '15px', fontWeight: 700, color: 'white', flexShrink: 0,
                }}>
                  {c.avatar}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--foreground)' }}>{c.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>{c.email}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                {[
                  { label: 'Orders', value: c.orders },
                  { label: 'Lifetime Spend', value: c.spend > 0 ? `₹${c.spend.toLocaleString()}` : '₹0' },
                  { label: 'Last Purchase', value: c.lastPurchase ? new Date(c.lastPurchase).toLocaleDateString() : '—' },
                  { label: 'Phone', value: c.phone },
                ].map(item => (
                  <div key={item.label} style={{ backgroundColor: 'var(--muted)', borderRadius: '8px', padding: '8px 10px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', marginTop: '2px' }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ backgroundColor: 'var(--card)', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                {['Customer', 'Phone', 'Orders', 'Lifetime Spend', 'Last Purchase'].map(h => (
                  <th key={h} style={{ padding: '11px 16px', fontSize: '11px', fontWeight: 700, color: 'var(--muted-foreground)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c.email}
                  style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'var(--muted)'}
                  onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: gradients[i % gradients.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: 'white', flexShrink: 0 }}>{c.avatar}</div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>{c.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>{c.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '12.5px', color: 'var(--muted-foreground)' }}>{c.phone}</td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 700, color: 'var(--foreground)', textAlign: 'center' }}>{c.orders}</td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 700, color: '#9333ea' }}>₹{c.spend.toLocaleString()}</td>
                  <td style={{ padding: '14px 16px', fontSize: '12px', color: 'var(--muted-foreground)' }}>{c.lastPurchase ? new Date(c.lastPurchase).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
