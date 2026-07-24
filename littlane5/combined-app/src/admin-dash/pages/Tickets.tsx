import { useState } from 'react'

interface TicketsProps {
  sales: any[]
  onResend: (ticketId: string) => Promise<void>
  adminKey: string
  onReload: () => Promise<void> | void
  globalSearch?: string
  isPresentation?: boolean
}

interface Ticket {
  id: string
  buyer: string
  email: string
  phone: string
  event: string
  type: string
  qty: number
  price: number
  generated: string
  expiry: string
  status: 'Active' | 'Scanned' | 'Cancelled' | 'Expired'
  qr: string
  pdf: string
  png: string
  showInPres?: boolean
  orderId: string
}

const typeColors: Record<string, { bg: string; color: string }> = {
  General: { bg: '#f3f4f6', color: '#374151' },
  'Male Pass': { bg: '#dbeafe', color: '#1e40af' },
  'Female Pass': { bg: '#fce7f3', color: '#9d174d' },
  VIP: { bg: '#fdf4ff', color: '#a21caf' },
  Backstage: { bg: '#ede9fe', color: '#7c3aed' },
}

const statusColors: Record<string, { bg: string; color: string }> = {
  Active: { bg: '#dcfce7', color: '#16a34a' },
  Scanned: { bg: '#dbeafe', color: '#2563eb' },
  Cancelled: { bg: '#fee2e2', color: '#dc2626' },
  Expired: { bg: '#ffedd5', color: '#ea580c' },
}

function Badge({ label, bg, color }: { label: string; bg: string; color: string }) {
  return <span style={{ backgroundColor: bg, color, fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '20px', whiteSpace: 'nowrap' }}>{label}</span>
}

export default function Tickets({ sales = [], onResend, adminKey, onReload, globalSearch = '', isPresentation = false }: TicketsProps) {
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  
  // Only show records with generated tickets and apply search if provided
  const ticketSales = sales.filter(s => {
    if (!s.ticketId) return false
    const q = globalSearch.toLowerCase()
    if (q) {
      return (s.ticketId || '').toLowerCase().includes(q) || 
             (s.name || '').toLowerCase().includes(q) || 
             (s.email || '').toLowerCase().includes(q)
    }
    return true
  })

  const handleCancel = async (ticketId: string) => {
    if (!window.confirm(`Are you sure you want to CANCEL ticket ${ticketId}? Scanning it at the gate will be rejected.`)) {
      return
    }
    setCancellingId(ticketId)
    try {
      const res = await fetch('/api/admin/cancel-ticket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey
        },
        body: JSON.stringify({ ticketId })
      })
      const data = await res.json()
      if (data.success) {
        alert(data.message)
        await onReload()
      } else {
        alert('Failed: ' + data.message)
      }
    } catch (err) {
      alert('Error cancelling ticket')
    } finally {
      setCancellingId(null)
    }
  }

  const togglePresMode = async (orderId: string, currentVal: boolean) => {
    if (!adminKey || isPresentation) return;
    try {
      const res = await fetch('/api/admin/toggle-presentation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ orderId, showInPres: !currentVal })
      })
      if (res.ok && onReload) {
        onReload();
      }
    } catch (err) {
      console.error(err);
    }
  }

  const tickets: Ticket[] = ticketSales.map((s: any) => {
    const isCancelled = s.status === 'cancelled'
    const isScanned = s.status === 'scanned' || !!s.scannedAt
    return {
      id: s.ticketId,
      buyer: s.name,
      email: s.email,
      phone: s.phone || '—',
      event: s.event || 'FRESHERS TAKEOVER',
      type: s.gender === 'male' ? 'Male Pass' : s.gender === 'female' ? 'Female Pass' : 'General',
      qty: s.quantity || 1,
      price: s.amount,
      generated: s.generatedAt ? new Date(s.generatedAt).toLocaleString('en-IN') : '—',
      expiry: 'Event End',
      status: isCancelled ? 'Cancelled' : (isScanned ? 'Scanned' : 'Active'),
      qr: '✓',
      pdf: '✓',
      png: '✓',
      showInPres: s.showInPres || false,
      orderId: s.orderId
    }
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--foreground)', letterSpacing: '-0.5px', margin: 0 }}>Tickets</h1>
          <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', margin: '4px 0 0' }}>{tickets.length} tickets · All events</p>
        </div>
      </div>

      <div style={{ backgroundColor: 'var(--card)', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                {['Ticket ID', 'Attendee', 'Event', 'Type', 'Qty', 'Price', 'Generated', 'Status', ...(isPresentation ? [] : ['Pres. Mode']), 'Actions'].map(h => (
                  <th key={h} style={{ padding: '11px 14px', fontSize: '11px', fontWeight: 700, color: 'var(--muted-foreground)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '20px', color: 'var(--muted-foreground)' }}>No tickets generated yet</td>
                </tr>
              ) : (
                tickets.map((t, i) => {
                  const tc = typeColors[t.type] || typeColors.General
                  const sc = statusColors[t.status] || statusColors.Active
                  return (
                    <tr key={t.id}
                      style={{ borderBottom: i < tickets.length - 1 ? '1px solid var(--border)' : 'none' }}
                      onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'var(--muted)'}
                      onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '13px 14px', fontSize: '12.5px', fontWeight: 700, color: '#9333ea', fontFamily: 'monospace' }}>{t.id}</td>
                      <td style={{ padding: '13px 14px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>{t.buyer}</div>
                        <div style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>{t.email}</div>
                      </td>
                      <td style={{ padding: '13px 14px', fontSize: '12.5px', color: 'var(--foreground)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.event}</td>
                      <td style={{ padding: '13px 14px' }}><Badge label={t.type} {...tc} /></td>
                      <td style={{ padding: '13px 14px', fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', textAlign: 'center' }}>{t.qty}</td>
                      <td style={{ padding: '13px 14px', fontSize: '13px', fontWeight: 700, color: '#9333ea' }}>₹{t.price.toLocaleString()}</td>
                      <td style={{ padding: '13px 14px', fontSize: '11.5px', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>{t.generated}</td>
                      <td style={{ padding: '13px 14px' }}><Badge label={t.status} {...sc} /></td>
                      {!isPresentation && (
                        <td style={{ padding: '13px 14px' }}>
                          <button
                            onClick={e => { e.stopPropagation(); togglePresMode(t.orderId, !!t.showInPres); }}
                            style={{
                              padding: '4px 8px', borderRadius: '6px',
                              border: t.showInPres ? '1px solid #9333ea' : '1px solid var(--border)',
                              backgroundColor: t.showInPres ? '#f3e8ff' : 'var(--muted)',
                              color: t.showInPres ? '#9333ea' : 'var(--muted-foreground)',
                              fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: '4px'
                            }}
                          >
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: t.showInPres ? '#9333ea' : 'transparent', border: t.showInPres ? 'none' : '1px solid var(--muted-foreground)' }} />
                            {t.showInPres ? 'Shown' : 'Hidden'}
                          </button>
                        </td>
                      )}
                      <td style={{ padding: '13px 14px' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            onClick={() => onResend(t.id)}
                            disabled={t.status === 'Cancelled'}
                            style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--muted)', fontSize: '11px', fontWeight: 600, color: t.status === 'Cancelled' ? 'var(--muted-foreground)' : 'var(--foreground)', cursor: t.status === 'Cancelled' ? 'not-allowed' : 'pointer' }}
                          >
                            Resend Email
                          </button>
                          <a
                            href={t.status === 'Cancelled' ? '#' : `/api/ticket/${t.id}/download`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', backgroundColor: t.status === 'Cancelled' ? '#fca5a5' : '#9333ea', color: 'white', textDecoration: 'none', fontSize: '11px', fontWeight: 600, cursor: t.status === 'Cancelled' ? 'not-allowed' : 'pointer' }}
                          >
                            Download PDF
                          </a>
                          <button
                            onClick={() => handleCancel(t.id)}
                            disabled={t.status === 'Cancelled' || cancellingId === t.id}
                            style={{
                              padding: '4px 10px', borderRadius: '6px', border: 'none',
                              backgroundColor: '#EF4444', color: 'white',
                              fontSize: '11px', fontWeight: 600,
                              cursor: t.status === 'Cancelled' || cancellingId === t.id ? 'not-allowed' : 'pointer',
                              opacity: t.status === 'Cancelled' ? 0.4 : 1
                            }}
                          >
                            {cancellingId === t.id ? '...' : 'Cancel'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
