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
  const [eventFilter, setEventFilter] = useState<string>('all')
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  
  // Only show records with generated tickets and apply search if provided
  const ticketSales = sales.filter(s => {
    if (!s.ticketId) return false
    if (eventFilter !== 'all' && (s.event || 'FRESHERS TAKEOVER').toLowerCase() !== eventFilter) return false
    
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

  // Optimistic UI updates
  const [optimisticPres, setOptimisticPres] = useState<Record<string, boolean>>({})

  const togglePresMode = async (orderId: string, currentVal: boolean) => {
    if (!adminKey || isPresentation) return;
    
    const newVal = !currentVal;
    // Instantly update UI
    setOptimisticPres(prev => ({ ...prev, [orderId]: newVal }))

    try {
      const res = await fetch('/api/admin/toggle-presentation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ orderId, showInPres: newVal })
      })
      if (!res.ok) {
        // Revert if failed
        setOptimisticPres(prev => ({ ...prev, [orderId]: currentVal }))
        alert("Failed to update presentation mode.")
      }
    } catch (err) {
      console.error(err);
      // Revert if failed
      setOptimisticPres(prev => ({ ...prev, [orderId]: currentVal }))
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
      type: s.gender === 'male' ? 'Male Pass' : s.gender === 'female' ? 'Female Pass' : (String(s.gender || '').toLowerCase().includes('exclusive') ? 'Exclusive Pass' : 'General'),
      qty: s.quantity || 1,
      price: s.amount,
      generated: s.generatedAt ? new Date(s.generatedAt).toLocaleString('en-IN') : '—',
      expiry: 'Event End',
      status: isCancelled ? 'Cancelled' : (isScanned ? 'Scanned' : 'Active'),
      qr: '✓',
      pdf: '✓',
      png: '✓',
      showInPres: s.showInPres || false,
    }
  })

  const totalAmount = tickets.reduce((a, t) => a + t.price, 0)
  const totalFreshers = tickets.reduce((a, t) => {
    if (t.event.toLowerCase() !== 'freshers takeover') return a
    return a + t.price
  }, 0)
  const totalAura = tickets.reduce((a, t) => {
    if (t.event.toLowerCase() !== 'aura genesis') return a
    return a + t.price
  }, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--foreground)', letterSpacing: '-0.5px', margin: 0 }}>Tickets</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
            <span style={{ fontSize: '14px', color: 'var(--muted-foreground)' }}>{tickets.length} tickets</span>
            <span style={{ fontSize: '14px', color: 'var(--muted-foreground)' }}>·</span>
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#059669', backgroundColor: '#d1fae5', padding: '4px 10px', borderRadius: '8px', border: '1px solid #10b981' }}>
              ₹{totalAmount.toLocaleString()} Total
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px', fontSize: '12.5px', color: 'var(--muted-foreground)', marginTop: '10px', flexWrap: 'wrap' }}>
            <span style={{ backgroundColor: 'var(--muted)', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border)' }}>Freshers: <strong style={{ color: 'var(--foreground)' }}>₹{totalFreshers.toLocaleString()}</strong></span>
            <span style={{ backgroundColor: 'var(--muted)', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border)' }}>Aura: <strong style={{ color: 'var(--foreground)' }}>₹{totalAura.toLocaleString()}</strong></span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Event Filters */}
        <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--muted)', padding: '3px', borderRadius: '10px' }}>
          {(['all', 'freshers takeover', 'aura genesis'] as const).map(e => (
            <button
              key={e}
              onClick={() => setEventFilter(e)}
              style={{
                padding: '5px 12px', borderRadius: '7px', border: 'none',
                backgroundColor: eventFilter === e ? '#10b981' : 'transparent',
                color: eventFilter === e ? 'white' : 'var(--muted-foreground)',
                fontSize: '12px', fontWeight: eventFilter === e ? 600 : 400,
                cursor: 'pointer', textTransform: 'capitalize',
              }}
            >
              {e === 'all' ? 'All Events' : e}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card lt-in" style={{ borderRadius: '16px', overflow: 'hidden', ['--lt-i' as any]: 2 }}>
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
                        <td style={{ padding: '13px 14px', textAlign: 'center' }}>
                          <button
                            onClick={e => { 
                              e.stopPropagation(); 
                              const currentVal = optimisticPres[t.orderId] !== undefined ? optimisticPres[t.orderId] : !!t.showInPres;
                              togglePresMode(t.orderId, currentVal); 
                            }}
                            style={{
                              padding: '6px', borderRadius: '8px',
                              border: 'none',
                              backgroundColor: (optimisticPres[t.orderId] !== undefined ? optimisticPres[t.orderId] : t.showInPres) ? '#f3e8ff' : 'var(--muted)',
                              color: (optimisticPres[t.orderId] !== undefined ? optimisticPres[t.orderId] : t.showInPres) ? '#9333ea' : 'var(--muted-foreground)',
                              fontSize: '16px', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              width: '32px', height: '32px', transition: 'all 0.1s'
                            }}
                            title={(optimisticPres[t.orderId] !== undefined ? optimisticPres[t.orderId] : t.showInPres) ? 'Visible on Presentation' : 'Hidden on Presentation'}
                          >
                            {(optimisticPres[t.orderId] !== undefined ? optimisticPres[t.orderId] : t.showInPres) ? '👁️' : '🙈'}
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
