import { useState, useEffect, useCallback } from 'react'

interface PRApprovalsProps {
  adminKey: string
  isPresentation?: boolean
}

interface PendingSale {
  orderId: string
  name: string
  email: string
  phone: string
  gender: string
  amount: number
  status: string
  ticketId?: string
  createdAt: string
  prUserId?: string
  prName?: string
}

export default function PRApprovals({ adminKey, isPresentation = false }: PRApprovalsProps) {
  const [pending, setPending] = useState<PendingSale[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchPending = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/pr-approvals?key=${encodeURIComponent(adminKey)}`)
      const data = await res.json()
      if (data.success) setPending(data.pending || [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [adminKey])

  useEffect(() => {
    fetchPending()
    const interval = setInterval(fetchPending, 15000)
    return () => clearInterval(interval)
  }, [fetchPending])

  async function handleApprove(orderId: string) {
    if (isPresentation) return
    setActionId(orderId)
    try {
      const res = await fetch('/api/admin/pr-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ orderId }),
      })
      const data = await res.json()
      if (data.success) {
        showToast(data.message || 'Ticket approved and emailed!', 'success')
        fetchPending()
      } else {
        showToast(data.message || 'Error approving', 'error')
      }
    } catch {
      showToast('Network error', 'error')
    } finally {
      setActionId(null)
    }
  }

  async function handleReject(orderId: string) {
    if (isPresentation) return
    if (!window.confirm('Reject this cash sale?')) return
    setActionId(orderId)
    try {
      const res = await fetch('/api/admin/pr-reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ orderId }),
      })
      const data = await res.json()
      if (data.success) {
        showToast('Sale rejected.', 'success')
        fetchPending()
      } else {
        showToast(data.message || 'Error rejecting', 'error')
      }
    } catch {
      showToast('Network error', 'error')
    } finally {
      setActionId(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gutter)' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: toast.type === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
          border: `1px solid ${toast.type === 'success' ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
          color: toast.type === 'success' ? '#4ade80' : '#fca5a5',
          padding: '12px 20px', borderRadius: 12, fontWeight: 700, fontSize: '0.85rem',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header tile */}
      <div className="kpi-row">
        <div className="tile tile-orange">
          <div className="tile-label">PENDING APPROVALS</div>
          <div className="tile-value">{pending.length}</div>
          <div className="tile-sub">Partner cash sales awaiting approval</div>
          <div className="tile-delta">
            <span>{pending.length > 0 ? '⚠️' : '✓'}</span>{' '}
            {pending.length > 0 ? 'Needs your action' : 'All clear'}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card table-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Partner Cash Sale Approvals</span>
          <button
            className="btn btn-ghost btn-sm"
            onClick={fetchPending}
            style={{ fontSize: '0.78rem', padding: '6px 14px' }}
          >
            ↻ Refresh
          </button>
        </div>
        <div className="table-scroll scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Partner</th>
                <th>Attendee</th>
                <th>Pass</th>
                <th>Amount</th>
                <th>Submitted</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--ink-faint)' }}>
                    Loading…
                  </td>
                </tr>
              ) : pending.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--ink-faint)' }}>
                    ✅ No pending approvals right now.
                  </td>
                </tr>
              ) : (
                pending.map(s => (
                  <tr key={s.orderId}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{s.prName || s.prUserId}</div>
                      <div style={{ fontSize: '0.72rem', opacity: 0.5 }}>{s.prUserId}</div>
                    </td>
                    <td>
                      <div className="cell-main">
                        <div className="cell-thumb" style={{ background: 'var(--grad-orange)' }}>💵</div>
                        <div>
                          <div className="cell-title">{s.name}</div>
                          <div className="cell-sub">{s.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>{s.gender} Pass</td>
                    <td style={{ fontWeight: 800, color: 'var(--accent)' }}>₹{s.amount?.toLocaleString()}</td>
                    <td style={{ fontSize: '0.78rem', opacity: 0.6 }}>
                      {new Date(s.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td>
                      {isPresentation ? (
                        <span style={{ opacity: 0.4, fontSize: '0.78rem' }}>Admin only</span>
                      ) : (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => handleApprove(s.orderId)}
                            disabled={actionId === s.orderId}
                            style={{
                              background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.4)',
                              color: '#4ade80', borderRadius: 8, padding: '6px 14px',
                              fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
                              opacity: actionId === s.orderId ? 0.5 : 1,
                            }}
                          >
                            {actionId === s.orderId ? '…' : '✓ Approve'}
                          </button>
                          <button
                            onClick={() => handleReject(s.orderId)}
                            disabled={actionId === s.orderId}
                            style={{
                              background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                              color: '#fca5a5', borderRadius: 8, padding: '6px 14px',
                              fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
                              opacity: actionId === s.orderId ? 0.5 : 1,
                            }}
                          >
                            ✕ Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
