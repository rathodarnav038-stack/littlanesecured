import { useState } from 'react'

interface OrdersProps {
  sales: any[]
  onResend: (ticketId: string) => Promise<void>
}

type PaymentStatus = 'Paid' | 'Pending' | 'Failed' | 'Refunded' | 'Cancelled'
type EmailStatus = 'Delivered' | 'Opened' | 'Clicked' | 'Downloaded' | 'Queued' | 'Failed' | 'Spam' | 'Bounced'
type QRStatus = 'Not Scanned' | 'Scanned' | 'Duplicate Scan' | 'Expired' | 'Cancelled'

interface Order {
  id: string
  buyer: string
  email: string
  phone: string
  event: string
  ticketType: string
  qty: number
  subtotal: number
  tax: number
  discount: number
  final: number
  gateway: string
  txnId: string
  paymentStatus: PaymentStatus
  emailStatus: EmailStatus
  downloadStatus: string
  qrStatus: QRStatus
  time: string
  ticketId: string
  errorLog: any[]
}

const paymentColors: Record<PaymentStatus, { bg: string; color: string }> = {
  Paid: { bg: '#dcfce7', color: '#16a34a' },
  Pending: { bg: '#fef3c7', color: '#d97706' },
  Failed: { bg: '#fee2e2', color: '#dc2626' },
  Refunded: { bg: '#ede9fe', color: '#7c3aed' },
  Cancelled: { bg: '#f1f5f9', color: '#64748b' },
}

const emailColors: Record<EmailStatus, { bg: string; color: string }> = {
  Delivered: { bg: '#dcfce7', color: '#16a34a' },
  Opened: { bg: '#dbeafe', color: '#2563eb' },
  Clicked: { bg: '#e0f2fe', color: '#0284c7' },
  Downloaded: { bg: '#ede9fe', color: '#7c3aed' },
  Queued: { bg: '#fef3c7', color: '#d97706' },
  Failed: { bg: '#fee2e2', color: '#dc2626' },
  Spam: { bg: '#fce7f3', color: '#be185d' },
  Bounced: { bg: '#ffedd5', color: '#ea580c' },
}

const qrColors: Record<QRStatus, { bg: string; color: string }> = {
  'Not Scanned': { bg: '#f1f5f9', color: '#64748b' },
  'Scanned': { bg: '#dcfce7', color: '#16a34a' },
  'Duplicate Scan': { bg: '#fef3c7', color: '#d97706' },
  'Expired': { bg: '#ffedd5', color: '#ea580c' },
  'Cancelled': { bg: '#fee2e2', color: '#dc2626' },
}

function Badge({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <span style={{
      backgroundColor: bg, color,
      fontSize: '11px', fontWeight: 600,
      padding: '3px 8px', borderRadius: '20px',
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  )
}

function OrderDrawer({ order, onClose, onResend }: { order: Order; onClose: () => void; onResend: (id: string) => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', justifyContent: 'flex-end',
    }}
      onClick={onClose}
    >
      <div style={{
        position: 'absolute', inset: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(4px)',
      }} />

      <div
        style={{
          position: 'relative',
          width: '480px',
          height: '100vh',
          backgroundColor: 'var(--card)',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.15)',
          overflowY: 'auto',
          zIndex: 101,
          animation: 'slideIn 0.25s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drawer header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0,
          backgroundColor: 'var(--card)',
          zIndex: 1,
        }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--foreground)' }}>Order #{order.id.substring(0, 12)}</div>
            <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginTop: '2px' }}>{order.time}</div>
          </div>
          <button onClick={onClose} style={{
            width: '32px', height: '32px', borderRadius: '8px',
            border: '1px solid var(--border)', backgroundColor: 'var(--muted)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--muted-foreground)',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {/* Buyer */}
          <Section title="Buyer Information">
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #9333EA, #C084FC)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '20px', fontWeight: 700, color: 'white', flexShrink: 0,
              }}>
                {order.buyer.charAt(0)}
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--foreground)' }}>{order.buyer}</div>
                <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginTop: '2px' }}>{order.email}</div>
                <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>{order.phone || '—'}</div>
              </div>
            </div>
          </Section>

          {/* Ticket */}
          <Section title="Ticket Information">
            <InfoGrid items={[
              { label: 'Event', value: order.event },
              { label: 'Ticket Type', value: order.ticketType },
              { label: 'Quantity', value: `${order.qty} tickets` },
              { label: 'Ticket ID', value: order.ticketId || '—' },
              { label: 'Status', value: order.qrStatus },
            ]} />

            {order.ticketId && (
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginBottom: '8px' }}>Ticket Actions</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    <a
                      href={`/api/ticket/${order.ticketId}/download`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        padding: '6px 12px', fontSize: '11px', fontWeight: 600, textDecoration: 'none',
                        borderRadius: '7px', border: '1px solid var(--border)', backgroundColor: '#9333EA', color: 'white'
                      }}
                    >
                      Download PDF
                    </a>
                    <button
                      onClick={() => onResend(order.ticketId)}
                      style={{
                        padding: '6px 12px', fontSize: '11px', fontWeight: 600,
                        borderRadius: '7px', border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)',
                        cursor: 'pointer',
                      }}
                    >
                      Resend Ticket Email
                    </button>
                  </div>
                </div>
              </div>
            )}
          </Section>

          {/* Payment */}
          <Section title="Payment Information">
            <InfoGrid items={[
              { label: 'Gateway', value: order.gateway },
              { label: 'Transaction ID', value: order.txnId },
              { label: 'Status', value: <Badge label={order.paymentStatus} {...paymentColors[order.paymentStatus]} /> },
            ]} />
            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginBottom: '8px' }}>Amount Breakdown</div>
              <div style={{ backgroundColor: 'var(--muted)', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ color: 'var(--muted-foreground)' }}>Subtotal</span>
                  <span style={{ fontWeight: 500, color: 'var(--foreground)' }}>₹{order.subtotal.toLocaleString()}</span>
                </div>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700 }}>
                  <span style={{ color: 'var(--foreground)' }}>Total Paid</span>
                  <span style={{ color: '#9333ea' }}>₹{order.final.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </Section>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function InfoGrid({ items }: { items: { label: string; value: React.ReactNode }[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
      {items.map((item, i) => (
        <div key={i} style={{ backgroundColor: 'var(--muted)', borderRadius: '8px', padding: '10px' }}>
          <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>
            {item.label}
          </div>
          <div style={{ fontSize: '12.5px', fontWeight: 500, color: 'var(--foreground)' }}>{item.value}</div>
        </div>
      ))}
    </div>
  )
}

export default function Orders({ sales = [], onResend }: OrdersProps) {
  const [selected, setSelected] = useState<Order | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [searchQ, setSearchQ] = useState('')

  // Map SQLite sales rows to unified Order UI model
  const orders: Order[] = sales.map((s: any) => {
    let paymentStatus: PaymentStatus = 'Pending'
    if (['paid', 'ticket_generated', 'emailed', 'email_failed', 'scanned'].includes(s.status)) {
      paymentStatus = 'Paid'
    } else if (s.status === 'failed') {
      paymentStatus = 'Failed'
    }

    let emailStatus: EmailStatus = 'Queued'
    if (s.emailStatus === 'sent') {
      emailStatus = 'Delivered'
    } else if (s.emailStatus === 'failed') {
      emailStatus = 'Failed'
    }

    const tType = s.gender === 'male' ? 'Male Pass' : s.gender === 'female' ? 'Female Pass' : 'General'

    return {
      id: s.orderId,
      buyer: s.name,
      email: s.email,
      phone: s.phone,
      event: s.event || 'FRESHERS TAKEOVER',
      ticketType: tType,
      qty: s.quantity || 1,
      subtotal: s.amount,
      tax: 0,
      discount: 0,
      final: s.amount,
      gateway: s.paymentId === 'manual' ? 'Manual' : 'Razorpay',
      txnId: s.paymentId || '—',
      paymentStatus,
      emailStatus,
      downloadStatus: s.ticketId ? 'PDF' : '—',
      qrStatus: (s.status === 'scanned' || s.scannedAt) ? 'Scanned' : 'Not Scanned',
      time: s.createdAt ? new Date(s.createdAt).toLocaleString('en-IN') : '—',
      ticketId: s.ticketId || '',
      errorLog: s.errorLog || []
    }
  })

  const filtered = orders.filter(o => {
    if (filter !== 'all' && o.paymentStatus.toLowerCase() !== filter) return false
    if (searchQ) {
      const q = searchQ.toLowerCase()
      return o.id.toLowerCase().includes(q) || o.buyer.toLowerCase().includes(q) || o.email.toLowerCase().includes(q) || o.txnId.toLowerCase().includes(q)
    }
    return true
  })

  const totalAmount = filtered.reduce((a, o) => a + (o.paymentStatus === 'Paid' ? o.final : 0), 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--foreground)', letterSpacing: '-0.5px', margin: 0 }}>Orders</h1>
          <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', margin: '4px 0 0' }}>
            {filtered.length} orders · ₹{totalAmount.toLocaleString()} total revenue
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '0 0 280px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="Search orders, buyers, TXN IDs..."
            style={{
              width: '100%', paddingLeft: '32px', paddingRight: '10px', paddingTop: '8px', paddingBottom: '8px',
              backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px',
              fontSize: '13px', color: 'var(--foreground)', outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--muted)', padding: '3px', borderRadius: '10px' }}>
          {(['all', 'paid', 'pending', 'failed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '5px 12px', borderRadius: '7px', border: 'none',
                backgroundColor: filter === f ? '#9333ea' : 'transparent',
                color: filter === f ? 'white' : 'var(--muted-foreground)',
                fontSize: '12px', fontWeight: filter === f ? 600 : 400,
                cursor: 'pointer', textTransform: 'capitalize',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{
        backgroundColor: 'var(--card)',
        borderRadius: '16px',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1400px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                {[
                  { label: 'Order ID', width: '110px' },
                  { label: 'Buyer', width: '220px' },
                  { label: 'Event', width: '180px' },
                  { label: 'Ticket', width: '110px' },
                  { label: 'Qty', width: '60px' },
                  { label: 'Amount', width: '90px' },
                  { label: 'Gateway', width: '100px' },
                  { label: 'TXN ID', width: '120px' },
                  { label: 'Payment', width: '110px' },
                  { label: 'Email', width: '110px' },
                  { label: 'Download', width: '90px' },
                  { label: 'QR', width: '120px' },
                  { label: 'Time', width: '180px' },
                  { label: '', width: '80px' }
                ].map(col => (
                  <th key={col.label} style={{
                    padding: '11px 14px',
                    fontSize: '11px', fontWeight: 700,
                    color: 'var(--muted-foreground)',
                    textAlign: 'left',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    whiteSpace: 'nowrap',
                    width: col.width,
                    minWidth: col.width,
                  }}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={14} style={{ textAlign: 'center', padding: '20px', color: 'var(--muted-foreground)' }}>No orders found</td>
                </tr>
              ) : (
                filtered.map((o, i) => (
                  <tr
                    key={o.id}
                    style={{
                      borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                      cursor: 'pointer',
                      transition: 'background-color 0.1s',
                    }}
                    onClick={() => setSelected(o)}
                  >
                    <td style={{ padding: '13px 14px', fontSize: '12px', fontWeight: 700, color: '#9333ea', whiteSpace: 'nowrap', width: '110px', minWidth: '110px' }}>
                      #{o.id.substring(0, 8).toUpperCase()}
                    </td>
                    <td style={{ padding: '13px 14px', width: '220px', minWidth: '220px', maxWidth: '220px', overflow: 'hidden' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{o.buyer}</div>
                      <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{o.email}</div>
                    </td>
                    <td style={{ padding: '13px 14px', fontSize: '12.5px', color: 'var(--foreground)', width: '180px', minWidth: '180px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {o.event}
                    </td>
                    <td style={{ padding: '13px 14px', width: '110px', minWidth: '110px' }}>
                      <span style={{
                        backgroundColor: o.ticketType === 'VIP' ? '#fdf4ff' : o.ticketType === 'Backstage' ? '#ede9fe' : '#f3f4f6',
                        color: o.ticketType === 'VIP' ? '#a21caf' : o.ticketType === 'Backstage' ? '#7c3aed' : '#374151',
                        fontSize: '11px', fontWeight: 600,
                        padding: '3px 8px', borderRadius: '6px',
                        display: 'inline-block',
                      }}>
                        {o.ticketType}
                      </span>
                    </td>
                    <td style={{ padding: '13px 14px', fontSize: '13px', color: 'var(--foreground)', fontWeight: 500, width: '60px', minWidth: '60px' }}>
                      {o.qty}
                    </td>
                    <td style={{ padding: '13px 14px', width: '90px', minWidth: '90px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--foreground)' }}>₹{o.final.toLocaleString()}</div>
                    </td>
                    <td style={{ padding: '13px 14px', fontSize: '12px', color: 'var(--muted-foreground)', whiteSpace: 'nowrap', width: '100px', minWidth: '100px' }}>
                      {o.gateway}
                    </td>
                    <td style={{ padding: '13px 14px', fontSize: '11px', color: 'var(--muted-foreground)', fontFamily: 'monospace', whiteSpace: 'nowrap', width: '120px', minWidth: '120px', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {o.txnId !== '—' ? o.txnId.substring(0, 10) : '—'}
                    </td>
                    <td style={{ padding: '13px 14px', whiteSpace: 'nowrap', width: '110px', minWidth: '110px' }}>
                      <Badge label={o.paymentStatus} {...paymentColors[o.paymentStatus]} />
                    </td>
                    <td style={{ padding: '13px 14px', whiteSpace: 'nowrap', width: '110px', minWidth: '110px' }}>
                      <Badge label={o.emailStatus} {...emailColors[o.emailStatus]} />
                    </td>
                    <td style={{ padding: '13px 14px', fontSize: '12px', color: 'var(--muted-foreground)', whiteSpace: 'nowrap', width: '90px', minWidth: '90px' }}>
                      {o.downloadStatus}
                    </td>
                    <td style={{ padding: '13px 14px', whiteSpace: 'nowrap', width: '120px', minWidth: '120px' }}>
                      <Badge label={o.qrStatus} {...qrColors[o.qrStatus]} />
                    </td>
                    <td style={{ padding: '13px 14px', fontSize: '11px', color: 'var(--muted-foreground)', whiteSpace: 'nowrap', width: '180px', minWidth: '180px' }}>
                      {o.time}
                    </td>
                    <td style={{ padding: '13px 14px', width: '80px', minWidth: '80px' }}>
                      <button
                        onClick={e => { e.stopPropagation(); setSelected(o) }}
                        style={{
                          padding: '5px 10px', borderRadius: '7px',
                          border: '1px solid var(--border)',
                          backgroundColor: 'var(--muted)',
                          fontSize: '11.5px', fontWeight: 600, color: 'var(--foreground)',
                          cursor: 'pointer', whiteSpace: 'nowrap',
                        }}
                      >
                        View →
                      </button>
                    </td>
                  </tr>
                ))

              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && <OrderDrawer order={selected} onClose={() => setSelected(null)} onResend={onResend} />}
    </div>
  )
}
