import { useState, useEffect, useCallback } from 'react'
import './pr.css'

// ==================== TYPES ====================
interface PRUser {
  id: string
  username: string
  displayName: string
}

interface Sale {
  orderId: string
  name: string
  email: string
  phone: string
  gender: string
  amount: number
  status: string
  ticketId?: string
  createdAt: string
  paymentMethod?: string
  prUserId?: string
}

// ==================== PR USERS (login credentials) ====================
const PR_USERS: (PRUser & { password: string })[] = [
  { id: 'pr1', username: 'partner1', password: 'ftpr@001', displayName: 'Partner One' },
  { id: 'pr2', username: 'partner2', password: 'ftpr@002', displayName: 'Partner Two' },
  { id: 'pr3', username: 'partner3', password: 'ftpr@003', displayName: 'Partner Three' },
  { id: 'pr4', username: 'partner4', password: 'ftpr@004', displayName: 'Partner Four' },
  { id: 'pr5', username: 'partner5', password: 'ftpr@005', displayName: 'Partner Five' },
]

const PRICING = { female: 599, male: 699 }
const API = ''

// ==================== LOGIN PAGE ====================
function LoginPage({ onLogin }: { onLogin: (user: PRUser) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setTimeout(() => {
      const user = PR_USERS.find(u => u.username === username.trim() && u.password === password)
      if (user) {
        const { password: _, ...safeUser } = user
        sessionStorage.setItem('pr_user', JSON.stringify(safeUser))
        onLogin(safeUser)
      } else {
        setError('Invalid credentials')
      }
      setLoading(false)
    }, 400)
  }

  return (
    <div className="pr-login-bg">
      <div className="pr-login-card">
        <div className="pr-logo">
          <span className="pr-logo-text">LITTLANE</span>
          <span className="pr-logo-dot">●</span>
          <span className="pr-logo-sub">Partner Portal</span>
        </div>
        <p className="pr-login-hint">Sign in to manage your ticket sales</p>
        <form onSubmit={handleSubmit} className="pr-login-form">
          <div className="pr-field">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="partner1"
              autoComplete="username"
              required
            />
          </div>
          <div className="pr-field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>
          {error && <div className="pr-error">{error}</div>}
          <button type="submit" className="pr-btn pr-btn-primary" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ==================== SELL TICKET MODAL ====================
function SellTicketModal({
  prUser,
  onClose,
  onSuccess,
}: {
  prUser: PRUser
  onClose: () => void
  onSuccess: () => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cash'>('razorpay')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'form' | 'pending' | 'done'>('form')
  const [message, setMessage] = useState('')

  const amount = PRICING[gender]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !email || !phone) return
    setLoading(true)

    try {
      if (paymentMethod === 'razorpay') {
        // Step 1: Create order on server
        const res = await fetch(`${API}/api/pr/create-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, phone, gender, quantity: 1, prUserId: prUser.id }),
        })
        const data = await res.json()
        if (!data.success) throw new Error(data.message || 'Failed to create order')

        // Step 2: Open Razorpay
        const rzp = new (window as any).Razorpay({
          key: data.keyId,
          amount: data.amount * 100,
          currency: data.currency,
          name: 'Littlane',
          description: `${gender === 'male' ? 'Male' : 'Female'} Pass — Freshers Takeover`,
          order_id: data.orderId,
          prefill: { name, email, contact: phone },
          theme: { color: '#A855F7' },
          handler: async (response: any) => {
            const verRes = await fetch(`${API}/api/verify-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: data.orderId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            })
            const verData = await verRes.json()
            if (verData.success) {
              setMessage('✅ Payment successful! Ticket sent to customer.')
              setStep('done')
              onSuccess()
            } else {
              setMessage('❌ Payment verification failed. Contact admin.')
              setStep('done')
            }
          },
          modal: { ondismiss: () => setLoading(false) },
        })
        rzp.open()
        setLoading(false)
      } else {
        // Cash: submit for admin approval
        const res = await fetch(`${API}/api/pr/cash-request`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, phone, gender, quantity: 1, prUserId: prUser.id, prName: prUser.displayName }),
        })
        const data = await res.json()
        if (!data.success) throw new Error(data.message || 'Failed')
        setMessage('⏳ Cash sale submitted for admin approval. Ticket will be sent once approved.')
        setStep('pending')
        onSuccess()
        setLoading(false)
      }
    } catch (err: any) {
      setMessage(`❌ ${err.message}`)
      setStep('done')
      setLoading(false)
    }
  }

  if (step === 'done' || step === 'pending') {
    return (
      <div className="pr-modal-overlay" onClick={onClose}>
        <div className="pr-modal" onClick={e => e.stopPropagation()}>
          <div className="pr-modal-result">
            <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', textAlign: 'center' }}>{message}</p>
            <button className="pr-btn pr-btn-primary" style={{ marginTop: 20 }} onClick={onClose}>Done</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pr-modal-overlay" onClick={onClose}>
      <div className="pr-modal" onClick={e => e.stopPropagation()}>
        <div className="pr-modal-head">
          <span>Sell Ticket</span>
          <button className="pr-modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="pr-modal-form">
          <div className="pr-field">
            <label>Attendee Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Riya Sharma" required />
          </div>
          <div className="pr-field">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="riya@example.com" required />
          </div>
          <div className="pr-field">
            <label>Phone</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" required />
          </div>
          <div className="pr-row">
            <div className="pr-field">
              <label>Pass Type</label>
              <select value={gender} onChange={e => setGender(e.target.value as any)}>
                <option value="male">Male Pass (₹{PRICING.male})</option>
                <option value="female">Female Pass (₹{PRICING.female})</option>
              </select>
            </div>
            <div className="pr-field">
              <label>Payment</label>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)}>
                <option value="razorpay">Razorpay (Online)</option>
                <option value="cash">Cash (Needs Approval)</option>
              </select>
            </div>
          </div>

          <div className="pr-amount-box">
            <span>Total to collect</span>
            <span className="pr-amount">₹{amount}</span>
          </div>

          {paymentMethod === 'cash' && (
            <div className="pr-cash-notice">
              ⚠️ Cash sales require admin approval before the ticket is sent.
            </div>
          )}

          <button type="submit" className="pr-btn pr-btn-primary" disabled={loading}>
            {loading ? 'Processing…' : paymentMethod === 'razorpay' ? `Pay ₹${amount} via Razorpay` : 'Submit for Approval'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ==================== PR DASHBOARD ====================
function PRDashboard({ prUser, onLogout }: { prUser: PRUser; onLogout: () => void }) {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [showSell, setShowSell] = useState(false)

  const fetchSales = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/pr/sales?prUserId=${prUser.id}`)
      const data = await res.json()
      if (data.success) setSales(data.sales || [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [prUser.id])

  useEffect(() => {
    fetchSales()
    const interval = setInterval(fetchSales, 15000)
    return () => clearInterval(interval)
  }, [fetchSales])

  const totalSold = sales.length
  const totalRevenue = sales
    .filter(s => ['paid', 'ticket_generated', 'emailed', 'scanned'].includes(s.status))
    .reduce((sum, s) => sum + (s.amount || 0), 0)
  const pending = sales.filter(s => s.status === 'pr_cash_pending').length
  const confirmed = sales.filter(s => ['ticket_generated', 'emailed', 'scanned', 'paid'].includes(s.status)).length

  function statusBadge(status: string) {
    if (['ticket_generated', 'emailed', 'scanned'].includes(status))
      return <span className="pr-badge pr-badge-green">✓ Sent</span>
    if (status === 'pr_cash_pending')
      return <span className="pr-badge pr-badge-yellow">⏳ Pending</span>
    if (status === 'paid')
      return <span className="pr-badge pr-badge-green">✓ Paid</span>
    return <span className="pr-badge pr-badge-gray">{status}</span>
  }

  return (
    <div className="pr-dashboard">
      {/* Header */}
      <header className="pr-header">
        <div className="pr-header-left">
          <span className="pr-header-logo">LITTLANE <span>●</span></span>
          <span className="pr-header-name">{prUser.displayName}</span>
        </div>
        <div className="pr-header-right">
          <button className="pr-btn pr-btn-primary" onClick={() => setShowSell(true)}>
            + Sell Ticket
          </button>
          <button className="pr-btn pr-btn-ghost" onClick={onLogout}>
            Sign Out
          </button>
        </div>
      </header>

      {/* KPI tiles */}
      <div className="pr-kpi-row">
        <div className="pr-kpi pr-kpi-purple">
          <div className="pr-kpi-label">Tickets Sold</div>
          <div className="pr-kpi-value">{totalSold}</div>
        </div>
        <div className="pr-kpi pr-kpi-green">
          <div className="pr-kpi-label">Revenue Collected</div>
          <div className="pr-kpi-value">₹{totalRevenue.toLocaleString()}</div>
        </div>
        <div className="pr-kpi pr-kpi-yellow">
          <div className="pr-kpi-label">Pending Approval</div>
          <div className="pr-kpi-value">{pending}</div>
        </div>
        <div className="pr-kpi pr-kpi-teal">
          <div className="pr-kpi-label">Confirmed</div>
          <div className="pr-kpi-value">{confirmed}</div>
        </div>
      </div>

      {/* Sales table */}
      <div className="pr-table-card">
        <div className="pr-table-head">
          <span>Your Ticket Sales</span>
          <button className="pr-btn pr-btn-ghost pr-btn-sm" onClick={fetchSales}>↻ Refresh</button>
        </div>
        {loading ? (
          <div className="pr-empty">Loading…</div>
        ) : sales.length === 0 ? (
          <div className="pr-empty">No tickets sold yet. Click <strong>Sell Ticket</strong> to start!</div>
        ) : (
          <div className="pr-table-scroll">
            <table className="pr-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Attendee</th>
                  <th>Pass Type</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Ticket ID</th>
                </tr>
              </thead>
              <tbody>
                {sales.map(s => (
                  <tr key={s.orderId}>
                    <td>{new Date(s.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{s.name}</div>
                      <div style={{ fontSize: '0.72rem', opacity: 0.55 }}>{s.email}</div>
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>{s.gender} Pass</td>
                    <td style={{ fontWeight: 700 }}>₹{s.amount?.toLocaleString()}</td>
                    <td>
                      <span className={`pr-badge ${s.paymentMethod === 'cash' ? 'pr-badge-yellow' : 'pr-badge-purple'}`}>
                        {s.paymentMethod === 'cash' ? 'Cash' : 'Razorpay'}
                      </span>
                    </td>
                    <td>{statusBadge(s.status)}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', opacity: 0.7 }}>{s.ticketId || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showSell && (
        <SellTicketModal
          prUser={prUser}
          onClose={() => setShowSell(false)}
          onSuccess={() => { setShowSell(false); fetchSales() }}
        />
      )}
    </div>
  )
}

// ==================== ROOT ====================
export default function PRApp() {
  const [prUser, setPrUser] = useState<PRUser | null>(() => {
    try {
      const saved = sessionStorage.getItem('pr_user')
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })

  function handleLogout() {
    sessionStorage.removeItem('pr_user')
    setPrUser(null)
  }

  if (!prUser) return <LoginPage onLogin={setPrUser} />
  return <PRDashboard prUser={prUser} onLogout={handleLogout} />
}
