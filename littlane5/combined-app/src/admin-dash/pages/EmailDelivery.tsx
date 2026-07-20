import { useState } from 'react'

interface EmailDeliveryProps {
  sales: any[]
  onResend: (ticketId: string) => Promise<void>
}

const statusColors: Record<string, { bg: string; color: string }> = {
  sent: { bg: '#dcfce7', color: '#16a34a' },
  failed: { bg: '#fee2e2', color: '#dc2626' },
  pending: { bg: '#fef3c7', color: '#d97706' },
}

function Badge({ label, bg, color }: { label: string; bg: string; color: string }) {
  return <span style={{ backgroundColor: bg, color, fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '20px', whiteSpace: 'nowrap' }}>{label}</span>
}

export default function EmailDelivery({ sales = [], onResend }: EmailDeliveryProps) {
  // Only select records that initiated email sending
  const emailRecords = sales.filter(s => s.emailStatus)

  const logs = emailRecords.map((s: any, idx: number) => {
    return {
      id: s.ticketId || s.orderId,
      time: s.updatedAt || s.createdAt || '—',
      recipient: s.email,
      name: s.name,
      subject: `Your ${s.event || 'FRESHERS TAKEOVER'} Ticket Pass`,
      status: s.emailStatus, // sent, failed, pending
      error: s.emailError || '—',
      retryCount: s.errorLog ? s.errorLog.filter((log: any) => log.stage === 'email').length : 0
    }
  })

  const sent = logs.filter(l => l.status === 'sent').length
  const failed = logs.filter(l => l.status === 'failed').length
  const pending = logs.filter(l => l.status === 'pending').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--foreground)', letterSpacing: '-0.5px', margin: 0 }}>Email Delivery</h1>
        <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', margin: '4px 0 0' }}>Monitor ticket emails (SQLite)</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {[
          { label: 'Total Emails', value: logs.length, color: '#9333ea', icon: '📧' },
          { label: 'Sent Successfully', value: sent, color: '#22c55e', icon: '✓' },
          { label: 'Failed Deliveries', value: failed, color: '#ef4444', icon: '✗' },
          { label: 'In Queue', value: pending, color: '#f59e0b', icon: '⏳' },
        ].map(s => (
          <div key={s.label} style={{ backgroundColor: 'var(--card)', borderRadius: '14px', padding: '16px', border: '1px solid var(--border)', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '26px', fontWeight: 800, color: s.color, letterSpacing: '-1px' }}>{s.value}</div>
              <div style={{ fontSize: '20px' }}>{s.icon}</div>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginTop: '4px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ backgroundColor: 'var(--card)', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                {['Trigger Time', 'Recipient', 'Name', 'Subject', 'Status', 'Retries', 'Last Error', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '11px 14px', fontSize: '11px', fontWeight: 700, color: 'var(--muted-foreground)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '20px', color: 'var(--muted-foreground)' }}>No emails triggered yet</td>
                </tr>
              ) : (
                logs.map((l, i) => {
                  const sc = statusColors[l.status] || statusColors.pending
                  return (
                    <tr key={l.id}
                      style={{ borderBottom: i < logs.length - 1 ? '1px solid var(--border)' : 'none' }}
                      onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'var(--muted)'}
                      onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--muted-foreground)', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{l.time}</td>
                      <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>{l.recipient}</td>
                      <td style={{ padding: '12px 14px', fontSize: '12.5px', color: 'var(--foreground)' }}>{l.name}</td>
                      <td style={{ padding: '12px 14px', fontSize: '12.5px', color: 'var(--foreground)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.subject}</td>
                      <td style={{ padding: '12px 14px' }}><Badge label={l.status} {...sc} /></td>
                      <td style={{ padding: '12px 14px', fontSize: '12.5px', color: 'var(--foreground)', textAlign: 'center' }}>{l.retryCount}</td>
                      <td style={{ padding: '12px 14px', fontSize: '12px', color: '#dc2626', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={l.error}>{l.error}</td>
                      <td style={{ padding: '12px 14px' }}>
                        {l.status === 'failed' && (
                          <button
                            onClick={() => onResend(l.id)}
                            style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--muted)', fontSize: '11px', fontWeight: 600, color: 'var(--foreground)', cursor: 'pointer' }}
                          >
                            Retry Resend
                          </button>
                        )}
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
