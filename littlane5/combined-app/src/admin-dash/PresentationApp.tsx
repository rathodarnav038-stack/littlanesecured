import { useState, useEffect } from 'react'

export default function PresentationApp() {
  const [dark, setDark] = useState(false)
  const [adminKey, setAdminKey] = useState(sessionStorage.getItem('ft_admin_key') || localStorage.getItem('ft_admin_key') || '')
  const [keyInput, setKeyInput] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authChecking, setAuthChecking] = useState(true)
  const [authError, setAuthError] = useState('')
  
  const [presConfig, setPresConfig] = useState({ enabled: true, revenue: 154500, orders: 450, tickets: 512 })

  const fetchConfig = async (keyToUse = adminKey) => {
    if (!keyToUse) {
      setIsAuthenticated(false)
      setAuthChecking(false)
      return false
    }
    try {
      const res = await fetch(`/api/admin/presentation-config?key=${encodeURIComponent(keyToUse)}`)
      const data = await res.json().catch(() => ({}))
      if (res.status === 401 || !res.ok || !data.success) {
        handleLogout('Access Denied')
        return false
      }
      if (data.config && data.config.enabled) {
        setPresConfig({
            enabled: true,
            revenue: Number(data.config.revenue) || 0,
            orders: Number(data.config.orders) || 0,
            tickets: Number(data.config.tickets) || 0
        })
      }
      setIsAuthenticated(true)
      setAuthError('')
      setAuthChecking(false)
      return true
    } catch (err) {
      console.error('Error fetching config:', err)
      setAuthChecking(false)
      return false
    }
  }

  useEffect(() => {
    if (adminKey) {
      fetchConfig(adminKey)
      const interval = setInterval(() => fetchConfig(adminKey), 5000)
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
    const ok = await fetchConfig(trimmed)
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
    if (errMsg) setAuthError(errMsg)
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
          Unlock Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className={dark ? 'dark' : ''} style={{
      minHeight: '100vh',
      backgroundColor: dark ? '#0d0d0f' : '#f4f4f5',
      color: dark ? '#f4f4f5' : '#18181b',
      fontFamily: "'Inter', sans-serif",
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
          display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 40,
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
          <nav style={{ flex: 1, padding: '12px' }}>
            <div style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px',
                borderRadius: '10px', marginBottom: '2px', cursor: 'pointer', border: 'none',
                background: 'linear-gradient(135deg, #9333EA, #A855F7)',
                color: '#ffffff', fontSize: '13.5px', fontWeight: 600,
                textAlign: 'left', letterSpacing: '-0.1px', boxShadow: '0 2px 8px rgba(147,51,234,0.35)',
            }}>
              <span style={{ opacity: 1, flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
                </svg>
              </span>
              Dashboard
            </div>
            {['Orders', 'Tickets', 'Customers', 'Events'].map(label => (
              <div key={label} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px',
                borderRadius: '10px', marginBottom: '2px', cursor: 'pointer', border: 'none',
                color: 'var(--muted-foreground)', fontSize: '13.5px', fontWeight: 450,
              }}>
                <span style={{ opacity: 0.7, flexShrink: 0 }}>
                  <div style={{ width: '18px', height: '18px', border: '2px dashed var(--muted-foreground)', borderRadius: '4px' }} />
                </span>
                {label}
              </div>
            ))}
          </nav>
        </aside>

        {/* Main Panel */}
        <div style={{ flex: 1, marginLeft: '264px', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <header style={{
            height: '60px', backgroundColor: 'var(--card)', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', padding: '0 24px', gap: '16px', position: 'sticky', top: 0, zIndex: 30,
          }}>
            <div style={{ flex: 1 }} />
            <button
              onClick={() => setDark(!dark)}
              style={{
                width: '36px', height: '36px', borderRadius: '10px', border: '1px solid var(--border)',
                backgroundColor: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--muted-foreground)',
              }}>
              {dark ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
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
             <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--foreground)', letterSpacing: '-0.5px', margin: 0 }}>Overview</h1>
                    <p style={{ fontSize: '14px', color: 'var(--muted-foreground)', margin: '4px 0 0' }}>Real-time sales & metrics</p>
                    </div>
                </div>

                {/* Big Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                    <div style={{ backgroundColor: 'var(--card)', borderRadius: '16px', border: '1px solid var(--border)', padding: '24px', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Total Revenue</div>
                        <div style={{ fontSize: '32px', fontWeight: 800, color: '#9333ea', letterSpacing: '-1px' }}>₹{presConfig.revenue.toLocaleString()}</div>
                    </div>
                    
                    <div style={{ backgroundColor: 'var(--card)', borderRadius: '16px', border: '1px solid var(--border)', padding: '24px', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Tickets Sold</div>
                        <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-1px' }}>{presConfig.tickets}</div>
                    </div>

                    <div style={{ backgroundColor: 'var(--card)', borderRadius: '16px', border: '1px solid var(--border)', padding: '24px', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Total Orders</div>
                        <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-1px' }}>{presConfig.orders}</div>
                    </div>
                </div>

                <div style={{ height: '400px', backgroundColor: 'var(--card)', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-foreground)' }}>
                    Chart Data Unavailable in Display Mode
                </div>
             </div>
          </main>
        </div>
      </div>
    </div>
  )
}
