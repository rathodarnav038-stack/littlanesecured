import { useState, useEffect } from 'react'
import Dashboard from './pages/Dashboard'
import Orders from './pages/Orders'
import Customers from './pages/Customers'
import Events from './pages/Events'
import EmailDelivery from './pages/EmailDelivery'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import QRScans from './pages/QRScans'
import Refunds from './pages/Refunds'
import Tickets from './pages/Tickets'

type Page =
  | 'dashboard'
  | 'orders'
  | 'tickets'
  | 'customers'
  | 'events'
  | 'email'
  | 'payments'
  | 'refunds'
  | 'qr'
  | 'analytics'
  | 'reports'
  | 'admins'
  | 'settings'

const navItems: { id: Page; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '⬛' },
  { id: 'orders', label: 'Orders', icon: '📋' },
  { id: 'tickets', label: 'Tickets', icon: '🎫' },
  { id: 'customers', label: 'Customers', icon: '👥' },
  { id: 'events', label: 'Events', icon: '🎪' },
  { id: 'email', label: 'Email Delivery', icon: '📧' },
  { id: 'payments', label: 'Payments', icon: '💳' },
  { id: 'refunds', label: 'Refunds', icon: '↩️' },
  { id: 'qr', label: 'QR Scan Logs', icon: '📲' },
  { id: 'analytics', label: 'Analytics', icon: '📊' },
  { id: 'reports', label: 'Reports', icon: '📄' },
  { id: 'admins', label: 'Admins', icon: '🛡️' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
]

const NavIcon = ({ id }: { id: Page }) => {
  const icons: Record<Page, JSX.Element> = {
    dashboard: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
    orders: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    tickets: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
      </svg>
    ),
    customers: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
    events: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    email: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
      </svg>
    ),
    payments: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
    refunds: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
      </svg>
    ),
    qr: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="5" height="5" /><rect x="16" y="3" width="5" height="5" /><rect x="3" y="16" width="5" height="5" />
        <path d="M21 16h-3v3M18 21h3M13 3v5M13 11v2M13 16v5M8 13h3M16 13h2" />
      </svg>
    ),
    analytics: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    reports: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    admins: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    settings: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  }
  return icons[id]
}

export default function App() {
  const [page, setPage] = useState<Page>('dashboard')
  const [dark, setDark] = useState(false)
  const [search, setSearch] = useState('')
  const [adminKey, setAdminKey] = useState(sessionStorage.getItem('ft_admin_key') || localStorage.getItem('ft_admin_key') || '')
  const [keyInput, setKeyInput] = useState('')
  const [sales, setSales] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({
    totalOrders: 0,
    paidOrders: 0,
    totalRevenue: 0,
    emailFailures: 0,
    ticketFailures: 0
  })
  const [testMode, setTestMode] = useState(true)
  const [showManualModal, setShowManualModal] = useState(false)

  // Manual generation state
  const [manualName, setManualName] = useState('')
  const [manualEmail, setManualEmail] = useState('')
  const [manualPhone, setManualPhone] = useState('')
  const [manualGender, setManualGender] = useState('male')
  const [manualQty, setManualQty] = useState('1')
  const [manualAmount, setManualAmount] = useState('1')
  const [manualEvent, setManualEvent] = useState('FRESHERS TAKEOVER')

  const fetchSales = async () => {
    if (!adminKey) return
    try {
      const res = await fetch(`/api/admin/sales?key=${adminKey}`)
      if (res.status === 401) {
        handleLogout()
        return
      }
      const data = await res.json()
      if (data.success) {
        setSales(data.sales)
        setSummary(data.summary)
        setTestMode(data.testMode)
      }
    } catch (err) {
      console.error('Error fetching sales:', err)
    }
  }

  useEffect(() => {
    if (adminKey) {
      fetchSales()
      const interval = setInterval(fetchSales, 10000)
      return () => clearInterval(interval)
    }
  }, [adminKey])

  const handleLogin = () => {
    const trimmed = keyInput.trim()
    if (!trimmed) return
    sessionStorage.setItem('ft_admin_key', trimmed)
    localStorage.setItem('ft_admin_key', trimmed)
    setAdminKey(trimmed)
  }

  const handleLogout = () => {
    sessionStorage.removeItem('ft_admin_key')
    localStorage.removeItem('ft_admin_key')
    setAdminKey('')
    setSales([])
  }

  const handleResend = async (ticketId: string) => {
    try {
      const res = await fetch(`/api/ticket/${ticketId}/resend?key=${adminKey}`, { method: 'POST' })
      const data = await res.json()
      alert(data.message)
      fetchSales()
    } catch (err) {
      alert('Error resending ticket')
    }
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualName.trim() || !manualEmail.trim()) {
      alert('Name and Email are required')
      return
    }
    try {
      const res = await fetch('/api/admin/generate-ticket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey
        },
        body: JSON.stringify({
          name: manualName,
          email: manualEmail,
          phone: manualPhone,
          gender: manualGender,
          quantity: manualQty,
          amount: manualAmount,
          event: manualEvent
        })
      })
      const data = await res.json()
      if (data.success) {
        alert(`Ticket manually generated: ${data.ticket.id}`)
        setShowManualModal(false)
        setManualName('')
        setManualEmail('')
        setManualPhone('')
        setManualAmount('2')
        fetchSales()
      } else {
        alert(`Failed: ${data.message}`)
      }
    } catch (err) {
      alert('Error creating manual ticket')
    }
  }

  const handleManualGenderChange = (val: string) => {
    setManualGender(val)
    if (val === 'male') {
      setManualAmount('1')
    } else if (val === 'female') {
      setManualAmount('2')
    }
  }

  if (!adminKey) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', justifyContent: 'center', height: '100vh',
        backgroundColor: '#0d0d0f', color: '#f4f4f5', fontFamily: "'Inter', sans-serif"
      }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>🎟 LitTix Enterprise Admin</h2>
        <p style={{ color: '#9a9a9a', fontSize: '13px', margin: 0 }}>Enter your admin key to unlock the dashboard.</p>
        <input
          type="password"
          value={keyInput}
          onChange={e => setKeyInput(e.target.value)}
          placeholder="Admin key"
          onKeyDown={e => { if (e.key === 'Enter') handleLogin() }}
          style={{
            backgroundColor: '#17171a', border: '1px solid #2a2a2e', color: '#f4f4f5',
            padding: '10px 14px', borderRadius: '10px', fontSize: '14px', outline: 'none', width: '260px'
          }}
        />
        <button onClick={handleLogin} style={{
          backgroundColor: '#A855F7', color: '#fff', border: 'none', padding: '10px 20px',
          borderRadius: '10px', fontWeight: 600, cursor: 'pointer', fontSize: '14px', width: '260px'
        }}>
          Unlock Dashboard
        </button>
      </div>
    )
  }

  function renderPage(page: Page) {
    switch (page) {
      case 'dashboard':
        return <Dashboard sales={sales} summary={summary} testMode={testMode} onManualGenerate={() => setShowManualModal(true)} />
      case 'orders':
      case 'payments':
        return <Orders sales={sales} onResend={handleResend} />
      case 'tickets':
        return <Tickets sales={sales} onResend={handleResend} />
      case 'customers':
        return <Customers sales={sales} />
      case 'events':
        return <Events sales={sales} />
      case 'email':
        return <EmailDelivery sales={sales} onResend={handleResend} />
      case 'refunds':
        return <Refunds sales={sales} />
      case 'qr':
        return <QRScans sales={sales} />
      case 'analytics':
      case 'reports':
        return <Analytics sales={sales} />
      case 'settings':
      case 'admins':
        return <Settings sales={sales} adminKey={adminKey} testMode={testMode} />
      default:
        return <Dashboard sales={sales} summary={summary} testMode={testMode} onManualGenerate={() => setShowManualModal(true)} />
    }
  }

  return (
    <div className={dark ? 'dark' : ''} style={{
      minHeight: '100vh',
      backgroundColor: dark ? '#0d0d0f' : '#f4f4f5',
      color: dark ? '#f4f4f5' : '#18181b',
      fontFamily: "'Inter', sans-serif",
      // Define our CSS variables so they function reliably in both dark and light modes
      ['--background' as any]: dark ? '#09090b' : '#f4f4f5',
      ['--card' as any]: dark ? '#18181b' : '#ffffff',
      ['--border' as any]: dark ? '#27272a' : '#e4e4e7',
      ['--foreground' as any]: dark ? '#f4f4f5' : '#18181b',
      ['--muted' as any]: dark ? '#27272a' : '#f4f4f5',
      ['--muted-foreground' as any]: dark ? '#a1a1aa' : '#71717a',
    }}>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        {/* Sidebar */}
        <aside style={{
          width: '264px', minHeight: '100vh', backgroundColor: 'var(--card)', borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 40, overflowY: 'auto',
        }}>
          <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px', height: '36px', background: 'linear-gradient(135deg, #9333EA, #C084FC)',
                borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--foreground)', letterSpacing: '-0.3px' }}>LitTix</div>
                <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', fontWeight: 500 }}>Enterprise Admin</div>
              </div>
            </div>
          </div>

          <nav style={{ flex: 1, padding: '12px 12px' }}>
            {navItems.map(item => {
              const active = page === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setPage(item.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px',
                    borderRadius: '10px', marginBottom: '2px', cursor: 'pointer', border: 'none',
                    background: active ? 'linear-gradient(135deg, #9333EA, #A855F7)' : 'transparent',
                    color: active ? '#ffffff' : 'var(--muted-foreground)', fontSize: '13.5px', fontWeight: active ? 600 : 450,
                    textAlign: 'left', letterSpacing: '-0.1px', boxShadow: active ? '0 2px 8px rgba(147,51,234,0.35)' : 'none',
                  }}
                >
                  <span style={{ opacity: active ? 1 : 0.7, flexShrink: 0 }}>
                    <NavIcon id={item.id} />
                  </span>
                  {item.label}
                </button>
              )
            })}
          </nav>

          <div style={{ padding: '12px', borderTop: '1px solid var(--border)' }}>
            <button onClick={handleLogout} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px',
              borderRadius: '10px', border: 'none', background: 'transparent', color: '#ef4444',
              fontSize: '13.5px', fontWeight: 500, cursor: 'pointer', textAlign: 'left',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              Logout
            </button>
          </div>
        </aside>

        {/* Main Panel */}
        <div style={{ flex: 1, marginLeft: '264px', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <header style={{
            height: '60px', backgroundColor: 'var(--card)', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', padding: '0 24px', gap: '16px', position: 'sticky', top: 0, zIndex: 30,
          }}>
            <div style={{ flex: 1, maxWidth: '420px', position: 'relative' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search orders, tickets, buyers..."
                style={{
                  width: '100%', paddingLeft: '36px', paddingRight: '12px', paddingTop: '8px', paddingBottom: '8px',
                  backgroundColor: 'var(--muted)', border: '1px solid var(--border)', borderRadius: '10px',
                  fontSize: '13px', color: 'var(--foreground)', outline: 'none',
                }}
              />
            </div>

            <div style={{ flex: 1 }} />

            {/* Manual Ticket Generator Trigger */}
            <button
              onClick={() => setShowManualModal(true)}
              style={{
                background: 'linear-gradient(135deg, #22C55E, #16A34A)', color: 'white', border: 'none',
                padding: '6px 14px', borderRadius: '10px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(34,197,94,0.3)'
              }}
            >
              + Manual Ticket
            </button>

            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px',
              backgroundColor: testMode ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)',
              borderRadius: '20px', fontSize: '12px', fontWeight: 600, color: testMode ? '#d97706' : '#16a34a',
            }}>
              <div style={{
                width: '6px', height: '6px', borderRadius: '50%',
                backgroundColor: testMode ? '#f59e0b' : '#22c55e',
                animation: 'pulse 2s infinite',
              }} />
              {testMode ? 'Test Mode' : 'Live'}
            </div>

            <button
              onClick={() => setDark(!dark)}
              style={{
                width: '36px', height: '36px', borderRadius: '10px', border: '1px solid var(--border)',
                backgroundColor: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--muted-foreground)',
              }}>
              {dark ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                </svg>
              )}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #9333EA, #C084FC)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: 'white',
              }}>A</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--foreground)' }}>Atharva</span>
                <span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>Super Admin</span>
              </div>
            </div>
          </header>

          <main style={{ flex: 1, padding: '24px', backgroundColor: 'var(--background)' }}>
            {renderPage(page)}
          </main>
        </div>
      </div>

      {/* Manual Ticket Modal */}
      {showManualModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', fontFamily: "'Inter', sans-serif"
        }}>
          <div style={{
            backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px',
            padding: '28px', width: '480px', position: 'relative', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 700, color: 'var(--foreground)' }}>Generate Manual Ticket</h3>
            <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: '4px' }}>EVENT NAME</label>
                <input
                  type="text"
                  value={manualEvent}
                  onChange={e => setManualEvent(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: '4px' }}>ATTENDEE NAME</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Nair"
                  value={manualName}
                  onChange={e => setManualName(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: '4px' }}>ATTENDEE EMAIL</label>
                <input
                  type="email"
                  required
                  placeholder="priya@example.com"
                  value={manualEmail}
                  onChange={e => setManualEmail(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: '4px' }}>ATTENDEE PHONE</label>
                <input
                  type="text"
                  placeholder="+91 99999 88888"
                  value={manualPhone}
                  onChange={e => setManualPhone(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: '4px' }}>TICKET TIER / GENDER</label>
                  <select
                    value={manualGender}
                    onChange={e => handleManualGenderChange(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)' }}
                  >
                    <option value="male">Male Pass (₹1)</option>
                    <option value="female">Female Pass (₹2)</option>
                    <option value="VIP">VIP Ticket (₹189)</option>
                    <option value="Backstage">Backstage (₹349)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: '4px' }}>PRICE (₹)</label>
                  <input
                    type="number"
                    value={manualAmount}
                    onChange={e => setManualAmount(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#22C55E', color: 'white', fontWeight: 600, cursor: 'pointer' }}>Generate & Email</button>
                <button type="button" onClick={() => setShowManualModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)', cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
