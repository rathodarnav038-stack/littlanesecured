// Refunds page — shows real cancelled/failed orders that could be refunded
// Since there's no separate refunds table, we show failed/cancelled payment records

interface Sale {
  orderId: string
  name: string
  email: string
  event: string
  amount: number
  status: string
  createdAt: string
  ticketId?: string
}

interface Props {
  sales: Sale[]
  adminKey: string
  onResend?: (ticketId: string) => void
}

const statusColors: Record<string, { bg: string; color: string }> = {
  pending: { bg: '#fef3c7', color: '#d97706' },
  failed: { bg: '#fee2e2', color: '#dc2626' },
  cancelled: { bg: '#f3f4f6', color: '#6b7280' },
  paid: { bg: '#dcfce7', color: '#16a34a' },
  generated: { bg: '#ede9fe', color: '#7c3aed' },
  scanned: { bg: '#dbeafe', color: '#2563eb' },
}

function Badge({ label }: { label: string }) {
  const st = statusColors[label] || { bg: '#f3f4f6', color: '#6b7280' }
  return <span style={{ backgroundColor: st.bg, color: st.color, fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '20px', whiteSpace: 'nowrap', textTransform: 'capitalize' }}>{label}</span>
}

export default function Refunds({ sales, adminKey }: Props) {
  // Show all non-paid orders (these are potential refund/failed payment records)
  const problemOrders = sales.filter(s =>
    s.status === 'failed' || s.status === 'cancelled' || s.status === 'pending'
  )

  // Also show paid orders that might need manual refund attention
  const paidOrders = sales.filter(s => s.status === 'paid' || s.status === 'generated' || s.status === 'scanned')

  const total = problemOrders.reduce((a, r) => a + r.amount, 0)
  const failedCount = sales.filter(r => r.status === 'failed').length
  const pendingCount = sales.filter(r => r.status === 'pending').length

  if (sales.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--foreground)', letterSpacing: '-0.5px', margin: 0 }}>Refunds & Failed Payments</h1>
          <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', margin: '4px 0 0' }}>No orders yet</p>
        </div>
        <div style={{ backgroundColor: 'var(--card)', borderRadius: '16px', border: '1px solid var(--border)', padding: '60px 20px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '14px' }}>
          ↩️ Refund and failed payment records will appear here
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--foreground)', letterSpacing: '-0.5px', margin: 0 }}>Refunds & Failed Payments</h1>
          <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', margin: '4px 0 0' }}>
            {failedCount} failed · {pendingCount} pending · ₹{total.toLocaleString()} at-risk amount
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {[
          { label: 'Failed Payments', value: failedCount, color: '#dc2626' },
          { label: 'Pending Payments', value: pendingCount, color: '#d97706' },
          { label: 'Total Orders', value: sales.length, color: '#9333ea' },
          { label: 'Successful', value: paidOrders.length, color: '#16a34a' },
        ].map(s => (
          <div key={s.label} style={{ backgroundColor: 'var(--card)', borderRadius: '14px', padding: '16px', border: '1px solid var(--border)', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: '26px', fontWeight: 800, color: s.color, letterSpacing: '-1px' }}>{s.value}</div>
            <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginTop: '4px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ backgroundColor: 'var(--card)', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'auto', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
              {['Order ID', 'Buyer', 'Event', 'Amount', 'Status', 'Date'].map(h => (
                <th key={h} style={{ padding: '11px 14px', fontSize: '11px', fontWeight: 700, color: 'var(--muted-foreground)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sales.map((r, i) => (
              <tr key={r.orderId}
                style={{ borderBottom: i < sales.length - 1 ? '1px solid var(--border)' : 'none' }}
                onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'var(--muted)'}
                onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent'}
              >
                <td style={{ padding: '13px 14px', fontSize: '12px', fontWeight: 700, color: '#9333ea', fontFamily: 'monospace' }}>#{r.orderId.slice(-8)}</td>
                <td style={{ padding: '13px 14px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>{r.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>{r.email}</div>
                </td>
                <td style={{ padding: '13px 14px', fontSize: '12.5px', color: 'var(--foreground)', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.event}</td>
                <td style={{ padding: '13px 14px', fontSize: '13px', fontWeight: 700, color: r.status === 'failed' ? '#ef4444' : 'var(--foreground)' }}>₹{r.amount.toLocaleString()}</td>
                <td style={{ padding: '13px 14px' }}><Badge label={r.status} /></td>
                <td style={{ padding: '13px 14px', fontSize: '11.5px', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
                  {r.createdAt ? new Date(r.createdAt).toLocaleString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
