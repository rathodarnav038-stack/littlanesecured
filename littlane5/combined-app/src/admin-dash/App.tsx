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
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'orders', label: 'Orders', icon: 'shopping_cart' },
  { id: 'tickets', label: 'Tickets', icon: 'confirmation_number' },
  { id: 'customers', label: 'Customers', icon: 'group' },
  { id: 'events', label: 'Events', icon: 'event' },
  { id: 'email', label: 'Email Delivery', icon: 'mail' },
  { id: 'payments', label: 'Payments', icon: 'payments' },
  { id: 'refunds', label: 'Refunds', icon: 'keyboard_return' },
  { id: 'qr', label: 'QR Scan Logs', icon: 'qr_code_scanner' },
  { id: 'analytics', label: 'Analytics', icon: 'analytics' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
]

const NavIcon = ({ icon }: { icon: string }) => {
  return <span className="material-symbols-outlined">{icon}</span>
}

interface AppProps {
  isPresentation?: boolean;
}

export default function App({ isPresentation = false }: AppProps) {
  const [page, setPage] = useState<Page>('dashboard')
  const [dark, setDark] = useState(true) // default to dark for premium obsidian glass experience
  const [search, setSearch] = useState('')
  const [adminKey, setAdminKey] = useState(sessionStorage.getItem('ft_admin_key') || localStorage.getItem('ft_admin_key') || '')
  const [keyInput, setKeyInput] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authChecking, setAuthChecking] = useState(true)
  const [authError, setAuthError] = useState('')
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
  const [isManualSubmitting, setIsManualSubmitting] = useState(false)

  // Obsidian Glass animated features
  const [spotlightPos, setSpotlightPos] = useState({ x: -1000, y: -1000 })
  const [showCurtain, setShowCurtain] = useState(() => {
    // Only show curtain once per session
    return !sessionStorage.getItem('lt_curtain_shown')
  })

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      setSpotlightPos({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    
    if (showCurtain) {
      const timer = setTimeout(() => {
        setShowCurtain(false)
        sessionStorage.setItem('lt_curtain_shown', '1')
      }, 1200)
      return () => {
        window.removeEventListener('pointermove', handlePointerMove)
        clearTimeout(timer)
      }
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
    }
  }, [showCurtain])

  // Manual generation state
  const [manualName, setManualName] = useState('')
  const [manualEmail, setManualEmail] = useState('')
  const [manualPhone, setManualPhone] = useState('')
  const [manualGender, setManualGender] = useState('male')
  const [manualQty, setManualQty] = useState('1')
  const [manualAmount, setManualAmount] = useState(() => localStorage.getItem('ft_price_male') || '399')
  const [manualEvent, setManualEvent] = useState('FRESHERS TAKEOVER')

  const fetchSales = async (keyToUse = adminKey) => {
    if (!keyToUse) {
      setIsAuthenticated(false)
      setAuthChecking(false)
      return false
    }
    try {
      const res = await fetch(`/api/admin/sales?key=${encodeURIComponent(keyToUse)}${isPresentation ? '&pres=true' : ''}`)
      const data = await res.json().catch(() => ({}))
      if (res.status === 401 || !res.ok || !data.success) {
        const errReason = data.message || 'Access Denied: Dashboard is bound to its original deployment device.'
        handleLogout(errReason)
        return false
      }
      const fetchedSales = data.sales || []
      const filteredSales = isPresentation 
        ? fetchedSales.filter((s: any) => s.showInPres)
        : fetchedSales

      // Recalculate summary if in presentation mode
      let activeSummary = data.summary
      if (isPresentation) {
        const totalOrders = filteredSales.length
        const paidOrders = filteredSales.filter((s: any) => s.status === 'paid').length
        const totalRevenue = filteredSales
          .filter((s: any) => s.status === 'paid')
          .reduce((sum: number, s: any) => sum + (Number(s.amount) || 0), 0)
        
        activeSummary = {
          totalOrders,
          paidOrders,
          totalRevenue,
          emailFailures: 0,
          ticketFailures: 0
        }
      }

      setSales(filteredSales)
      setSummary(activeSummary)
      setTestMode(data.testMode)
      setIsAuthenticated(true)
      setAuthError('')
      setAuthChecking(false)
      return true
    } catch (err) {
      console.error('Error fetching sales:', err)
      setAuthChecking(false)
      return false
    }
  }

  useEffect(() => {
    if (adminKey) {
      fetchSales(adminKey)
      const interval = setInterval(() => fetchSales(adminKey), 10000)
      return () => clearInterval(interval)
    } else {
      setAuthChecking(false)
      setIsAuthenticated(false)
    }
  }, [adminKey])

  const handleLogin = async () => {
    const trimmed = keyInput.trim()
    if (!trimmed) return
    setAuthChecking(true)
    setAuthError('')
    const ok = await fetchSales(trimmed)
    if (ok) {
      sessionStorage.setItem('ft_admin_key', trimmed)
      localStorage.setItem('ft_admin_key', trimmed)
      setAdminKey(trimmed)
    }
  }

  const handleLogout = (errMsg = '') => {
    sessionStorage.removeItem('ft_admin_key')
    localStorage.removeItem('ft_admin_key')
    setAdminKey('')
    setIsAuthenticated(false)
    setAuthChecking(false)
    setSales([])
    if (errMsg) setAuthError(errMsg)
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
    if (isManualSubmitting) return
    if (!manualName.trim() || !manualEmail.trim()) {
      alert('Name and Email are required')
      return
    }
    const isAura = manualEvent === 'AURA GENESIS'
    const isInvite = manualEvent === 'FT LINEUP INVITE'
    const finalEvent = isInvite ? 'FRESHERS TAKEOVER' : manualEvent
    const finalGender = isInvite ? 'Exclusive' : (isAura ? 'aura' : manualGender)
    const finalAmount = isInvite ? 0 : manualAmount  // always use what admin typed
    const finalTicketType = isInvite ? 'Exclusive VIP Pass' : (isAura ? 'Aura Genesis' : (manualGender === 'female' ? 'Female Pass' : 'Male Pass'))

    setIsManualSubmitting(true)
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
          gender: finalGender,
          ticketType: finalTicketType,
          quantity: manualQty,
          amount: finalAmount,
          event: finalEvent
        })
      })
      const data = await res.json()
      if (data.success) {
        alert(`Ticket manually generated: ${data.ticket.id}`)
        setShowManualModal(false)
        setManualName('')
        setManualEmail('')
        setManualPhone('')
        // Restore last saved price for current selection
        if (manualEvent === 'AURA GENESIS') {
          setManualAmount(localStorage.getItem('ft_price_aura') || '350')
        } else if (manualGender === 'female') {
          setManualAmount(localStorage.getItem('ft_price_female') || '299')
        } else {
          setManualAmount(localStorage.getItem('ft_price_male') || '399')
        }
        fetchSales()
      } else {
        alert(`Failed: ${data.message}`)
      }
    } catch (err) {
      alert('Error creating manual ticket')
    } finally {
      setIsManualSubmitting(false)
    }
  }

  const handleManualGenderChange = (val: string) => {
    setManualGender(val)
    if (val === 'male') {
      const saved = localStorage.getItem('ft_price_male') || '399'
      setManualAmount(saved)
    } else if (val === 'female') {
      const saved = localStorage.getItem('ft_price_female') || '299'
      setManualAmount(saved)
    }
  }

  if (authChecking && adminKey) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', justifyContent: 'center', height: '100vh',
        backgroundColor: '#0d0d0f', color: '#f4f4f5', fontFamily: "'Inter', sans-serif"
      }}>
        <div style={{
          width: '28px', height: '28px', borderRadius: '50%',
          border: '3px solid rgba(168,85,247,0.2)', borderTopColor: '#A855F7',
          animation: 'spin 0.8s linear infinite'
        }} />
        <p style={{ color: '#9a9a9a', fontSize: '13px', margin: 0 }}>Authenticating admin key...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', justifyContent: 'center', height: '100vh',
        backgroundColor: '#0d0d0f', color: '#f4f4f5', fontFamily: "'Inter', sans-serif"
      }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>🎟 LitTix Enterprise Admin</h2>
        <p style={{ color: '#9a9a9a', fontSize: '13px', margin: 0 }}>Enter your admin key to unlock the dashboard.</p>
        {authError && (
          <div style={{
            color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            padding: '8px 14px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 500, width: '260px', textAlign: 'center'
          }}>
            {authError}
          </div>
        )}
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
        <button
          onClick={handleLogin}
          disabled={authChecking}
          style={{
            backgroundColor: '#A855F7', color: '#fff', border: 'none', padding: '10px 20px',
            borderRadius: '10px', fontWeight: 600, cursor: authChecking ? 'not-allowed' : 'pointer',
            fontSize: '14px', width: '260px', opacity: authChecking ? 0.6 : 1
          }}
        >
          {authChecking ? 'Verifying...' : 'Unlock Dashboard'}
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
        return <Orders sales={sales} onResend={handleResend} globalSearch={search} isPresentation={isPresentation} adminKey={adminKey} onReload={() => fetchSales(adminKey)} />
      case 'tickets':
        return <Tickets sales={sales} onResend={handleResend} adminKey={adminKey} onReload={() => fetchSales(adminKey)} globalSearch={search} isPresentation={isPresentation} />
      case 'customers':
        return <Customers sales={sales} adminKey={adminKey} globalSearch={search} />
      case 'events':
        return <Events sales={sales} adminKey={adminKey} onNavigateToTickets={() => setPage('tickets')} />
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
    <div className={`p-4 ${dark ? 'dark' : ''}`}>
      {/* Aurora Ambient Backgrounds */}
      {dark && (
        <div className="lt-aurora">
          <span></span>
          <span></span>
          <span></span>
        </div>
      )}

      {/* Cursor Spotlight */}
      {dark && (
        <div
          className="lt-spotlight"
          style={{
            left: spotlightPos.x,
            top: spotlightPos.y,
          }}
        />
      )}

      {/* Side Navigation Bar */}
      <aside className="fixed left-4 top-4 bottom-4 w-sidebar-width glass-card rounded-xl z-50 flex flex-col gap-2 p-4">
        <div className="mb-6 flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-lg iris-gradient flex items-center justify-center text-white">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>confirmation_number</span>
          </div>
          <div>
            <h1 className="font-headline-md text-headline-md font-bold text-primary tracking-tight">LitTix</h1>
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Enterprise Admin</p>
          </div>
        </div>
        
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const active = page === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg relative transition-all active:scale-95 text-left ${
                  active 
                  ? "bg-secondary-container/20 text-primary font-bold before:content-[''] before:absolute before:left-0 before:w-1 before:h-4 before:bg-primary before:rounded-full hover:bg-white/5" 
                  : "text-on-surface-variant hover:text-on-surface hover:bg-white/5 hover:scale-[0.98]"
                }`}
              >
                <NavIcon icon={item.icon} />
                <span className="font-body-sm text-body-sm">{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="mt-auto p-2 glass-card rounded-lg flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border border-white/20 bg-primary/20 flex items-center justify-center text-primary font-bold">
            A
          </div>
          <div className="overflow-hidden text-left">
            <p className="font-body-sm text-body-sm text-on-surface truncate">Atharva</p>
            <p className="text-[10px] text-on-surface-variant truncate">Super Admin</p>
          </div>
          <button onClick={handleLogout} className="ml-auto text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </aside>

      {/* Top Navigation Bar */}
      <header className="fixed top-4 left-[calc(268px+2rem)] right-4 h-topbar-height glass-card rounded-full z-40 flex items-center justify-between px-6">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative w-full max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
            <input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-1.5 text-body-sm w-full focus:ring-1 focus:ring-primary focus:bg-white/10 outline-none transition-all text-on-surface placeholder-on-surface-variant/60" 
              placeholder="Search analytics, tickets, or customers..." 
              type="text"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-1 ${testMode ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'} border px-3 py-1 rounded-full`}>
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${testMode ? 'bg-orange-400' : 'bg-green-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${testMode ? 'bg-orange-500' : 'bg-green-500'}`}></span>
            </span>
            <span className="text-[11px] font-bold tracking-wider uppercase">{testMode ? 'TEST' : 'LIVE'}</span>
          </div>
          <button className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-white/5 rounded-full transition-all"><span className="material-symbols-outlined">notifications</span></button>
          <button className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-white/5 rounded-full transition-all"><span className="material-symbols-outlined">help</span></button>
          <button 
            onClick={() => setShowManualModal(true)}
            className="iris-gradient iris-glow px-6 py-2 rounded-full text-white font-bold text-body-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-2 border-none cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            New Ticket
          </button>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="ml-[calc(268px+1rem)] mt-[calc(64px+1rem)] space-y-6 min-h-screen relative z-10">
        {renderPage(page)}
      </main>

      {/* Manual Ticket Modal */}
      {showManualModal && (
        <div className="lt-modal-backdrop" style={{
          position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', fontFamily: "'Inter', sans-serif"
        }}>
          <div className="lt-modal-panel glass-card" style={{
            borderRadius: '24px',
            padding: '32px', width: '480px', position: 'relative',
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 700, color: 'var(--foreground)' }}>Generate Manual Ticket</h3>
            <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: '4px' }}>SELECT EVENT</label>
                <select
                  value={manualEvent}
                  onChange={e => {
                    const evt = e.target.value
                    setManualEvent(evt)
                    if (evt === 'AURA GENESIS') {
                      setManualGender('aura')
                      setManualAmount(localStorage.getItem('ft_price_aura') || '350')
                    } else if (manualGender === 'aura') {
                      setManualGender('male')
                      setManualAmount(localStorage.getItem('ft_price_male') || '399')
                    }
                  }}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)' }}
                >
                  <option value="FRESHERS TAKEOVER">FRESHERS TAKEOVER</option>
                  <option value="AURA GENESIS">AURA GENESIS</option>
                  <option value="FT LINEUP INVITE">FT LINEUP INVITE (FREE)</option>
                </select>
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
              {manualEvent !== 'FT LINEUP INVITE' && (
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
              )}
              <div style={{ display: 'grid', gridTemplateColumns: manualEvent === 'FT LINEUP INVITE' ? '1fr' : '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: '4px' }}>PASS TYPE</label>
                  {manualEvent === 'FT LINEUP INVITE' ? (
                    <div style={{
                      width: '100%', padding: '10px', borderRadius: '8px',
                      border: '1px solid #9333ea', backgroundColor: 'rgba(147,51,234,0.1)',
                      color: '#a855f7', fontWeight: 600, fontSize: '13px',
                      display: 'flex', alignItems: 'center', gap: '6px'
                    }}>
                      ✨ Exclusive VIP Invite (Free)
                    </div>
                  ) : manualEvent === 'AURA GENESIS' ? (
                    <div style={{
                      width: '100%', padding: '10px', borderRadius: '8px',
                      border: '1px solid #f59e0b', backgroundColor: 'rgba(245,158,11,0.1)',
                      color: '#d97706', fontWeight: 600, fontSize: '13px',
                      display: 'flex', alignItems: 'center', gap: '6px'
                    }}>
                      ✨ Aura Genesis Pass
                    </div>
                  ) : (
                    <select
                      value={manualGender}
                      onChange={e => handleManualGenderChange(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)' }}
                    >
                      <option value="male">Freshers Male Pass (₹399)</option>
                      <option value="female">Freshers Female Pass (₹299)</option>
                    </select>
                  )}
                </div>
                {manualEvent !== 'FT LINEUP INVITE' && (
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: '4px' }}>PRICE (₹)</label>
                    <input
                      type="number"
                      value={manualAmount}
                      onChange={e => {
                        const val = e.target.value
                        setManualAmount(val)
                        const key = manualEvent === 'AURA GENESIS' ? 'ft_price_aura' : (manualGender === 'female' ? 'ft_price_female' : 'ft_price_male')
                        localStorage.setItem(key, val)
                      }}
                      style={{
                        width: '100%', padding: '10px', borderRadius: '8px',
                        border: manualEvent === 'AURA GENESIS' ? '1px solid #f59e0b' : '1px solid var(--border)',
                        backgroundColor: manualEvent === 'AURA GENESIS' ? 'rgba(245,158,11,0.08)' : 'var(--muted)',
                        color: manualEvent === 'AURA GENESIS' ? '#d97706' : 'var(--foreground)',
                        fontWeight: manualEvent === 'AURA GENESIS' ? 700 : 400,
                      }}
                    />
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button
                  type="submit"
                  disabled={isManualSubmitting}
                  className="lt-shimmer-btn lt-ripple iris-gradient iris-glow"
                  style={{
                    flex: 1, padding: '12px', borderRadius: '12px', border: 'none',
                    color: 'white', fontWeight: 700, fontSize: '14px',
                    cursor: isManualSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isManualSubmitting ? 0.6 : 1,
                  }}
                >
                  {isManualSubmitting ? 'Processing...' : 'Generate & Email'}
                </button>
                <button
                  type="button"
                  disabled={isManualSubmitting}
                  onClick={() => setShowManualModal(false)}
                  className="lt-hover-scale"
                  style={{
                    flex: 1, padding: '12px', borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.09)', backgroundColor: 'rgba(255,255,255,0.04)',
                    color: 'var(--foreground)', fontWeight: 600,
                    cursor: isManualSubmitting ? 'not-allowed' : 'pointer',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
