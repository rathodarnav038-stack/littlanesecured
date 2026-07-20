import { useState } from 'react'

interface QRScansProps {
  sales: any[]
}

const resultColors: Record<string, { bg: string; color: string }> = {
  Accepted: { bg: '#dcfce7', color: '#16a34a' },
  Rejected: { bg: '#fee2e2', color: '#dc2626' },
  Duplicate: { bg: '#fef3c7', color: '#d97706' },
  Expired: { bg: '#ffedd5', color: '#ea580c' },
}

function Badge({ label, bg, color }: { label: string; bg: string; color: string }) {
  return <span style={{ backgroundColor: bg, color, fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '20px', whiteSpace: 'nowrap' }}>{label}</span>
}

export default function QRScans({ sales = [] }: QRScansProps) {
  // Filter for records with QR scans
  const scanSales = sales.filter(s => s.scannedAt)

  const scans = scanSales.map((s: any, idx: number) => {
    return {
      id: idx + 1,
      time: s.scannedAt,
      scanner: s.scannedBy || 'Gate Staff',
      gate: 'Main Entry',
      device: 'Littix Scanner',
      location: 'Venue Entry',
      result: 'Accepted',
      ticketId: s.ticketId || '—',
      attendee: s.name || '—',
      event: s.event || '—'
    }
  })

  const accepted = scans.filter(s => s.result === 'Accepted').length
  const rejected = scans.filter(s => s.result === 'Rejected').length
  const duplicate = scans.filter(s => s.result === 'Duplicate').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--foreground)', letterSpacing: '-0.5px', margin: 0 }}>QR Scan Logs</h1>
        <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', margin: '4px 0 0' }}>Real-time gate scanning activity (SQLite)</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {[
          { label: 'Total Scanned', value: scans.length, color: '#9333ea', icon: '📲' },
          { label: 'Accepted', value: accepted, color: '#22c55e', icon: '✓' },
          { label: 'Rejected / Dup', value: rejected + duplicate, color: '#f59e0b', icon: '⚠' },
          { label: 'Unique Scanners', value: new Set(scans.map(s => s.scanner)).size, color: '#3b82f6', icon: '📡' },
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
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                {['Scan Time', 'Ticket ID', 'Attendee', 'Event', 'Scanner', 'Result'].map(h => (
                  <th key={h} style={{ padding: '11px 14px', fontSize: '11px', fontWeight: 700, color: 'var(--muted-foreground)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scans.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '20px', color: 'var(--muted-foreground)' }}>No scans logged yet</td>
                </tr>
              ) : (
                scans.map((s, i) => {
                  const rc = resultColors[s.result] || resultColors.Accepted
                  return (
                    <tr key={s.id}
                      style={{ borderBottom: i < scans.length - 1 ? '1px solid var(--border)' : 'none' }}
                      onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'var(--muted)'}
                      onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--muted-foreground)', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                        {s.time ? new Date(s.time).toLocaleString() : '—'}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: 700, color: '#9333ea', fontFamily: 'monospace' }}>{s.ticketId}</td>
                      <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>{s.attendee}</td>
                      <td style={{ padding: '12px 14px', fontSize: '12.5px', color: 'var(--foreground)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.event}</td>
                      <td style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--foreground)' }}>{s.scanner}</td>
                      <td style={{ padding: '12px 14px' }}><Badge label={s.result} {...rc} /></td>
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
