import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../lib/store'
import type { Ticket } from '../lib/store'
import TicketCard from '../screens/TicketCard'
import QRScanner from '../screens/QRScanner'
import ScanSuccess from '../screens/ScanSuccess'
import ScanRejected from '../screens/ScanRejected'
import Dashboard from '../screens/Dashboard'
import PageTransition from '../components/PageTransition'

type Screen =
  | { name: 'dashboard' }
  | { name: 'ticket'; id: string }
  | { name: 'scanner' }
  | { name: 'scan-success'; ticket: Ticket }
  | { name: 'scan-rejected'; ticket: Ticket | null; rawCode?: string }

export interface RejectedScan {
  ticket: Ticket | null
  rawCode?: string
  timestamp: string
  reason: 'duplicate' | 'cancelled' | 'invalid'
  attemptNumber: number  // How many times this ticket has been rejected this session
}

const DEPTH: Record<Screen['name'], number> = {
  dashboard: 0,
  ticket: 1,
  scanner: 1,
  'scan-success': 2,
  'scan-rejected': 2,
}

function AppShell() {
  const { dark, toggleTheme, tickets, findTicket, scanTicket } = useStore()
  const [screen, setScreen] = useState<Screen>({ name: 'dashboard' })
  const [prevDepth, setPrevDepth] = useState(0)
  // Session-only log of rejected/duplicate scans
  const [rejectedScans, setRejectedScans] = useState<RejectedScan[]>([])

  // Synchronize state with browser history back gestures
  useEffect(() => {
    window.history.replaceState({ name: 'dashboard' }, '')

    const handlePop = (e: PopStateEvent) => {
      if (e.state && e.state.name) {
        setPrevDepth(DEPTH[screen.name])
        setScreen(e.state as Screen)
      } else {
        setScreen({ name: 'dashboard' })
      }
    }
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [screen])

  function go(next: Screen) {
    setPrevDepth(DEPTH[screen.name])
    setScreen(next)
    window.history.pushState(next, '')
  }

  async function handleScan(raw: string) {
    const cleaned = raw.replace(/^LITTIX:/i, '').replace(/^#/, '')
    const outcome = await scanTicket(cleaned, 'Gate Staff')

    // IST timestamp
    const now = new Date()
    const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000)
    const rawH = ist.getUTCHours()
    const ampm = rawH >= 12 ? 'PM' : 'AM'
    const h12 = rawH % 12 === 0 ? 12 : rawH % 12
    const mm = ist.getUTCMinutes().toString().padStart(2, '0')
    const timestamp = `${h12}:${mm} ${ampm}`

    if (outcome.result === 'success' && outcome.ticket) {
      go({ name: 'scan-success', ticket: outcome.ticket })
    } else if (outcome.result === 'rejected' && outcome.ticket) {
      const isCancel = outcome.ticket.status === 'cancelled' || (outcome.ticket.scannedAt === 'Cancelled by Admin')
      const reason: RejectedScan['reason'] = isCancel ? 'cancelled' : 'duplicate'
      // Count how many times this ticket ID has already been rejected this session
      const prevCount = rejectedScans.filter(r => (r.ticket?.id === outcome.ticket!.id || r.rawCode === cleaned)).length
      setRejectedScans(prev => [{
        ticket: outcome.ticket!,
        rawCode: cleaned,
        timestamp,
        reason,
        attemptNumber: prevCount + 1  // 1st duplicate = attempt #1 (2nd scan overall)
      }, ...prev])
      go({ name: 'scan-rejected', ticket: outcome.ticket })
    } else {
      // Not found in DB
      const prevCount = rejectedScans.filter(r => r.rawCode === cleaned).length
      setRejectedScans(prev => [{
        ticket: null,
        rawCode: cleaned,
        timestamp,
        reason: 'invalid',
        attemptNumber: prevCount + 1
      }, ...prev])
      go({ name: 'scan-rejected', ticket: null, rawCode: cleaned })
    }
  }

  const bg = dark ? 'bg-[#0D0D0D]' : 'bg-[#F9F9FB]'
  const direction: 'forward' | 'back' = DEPTH[screen.name] >= prevDepth ? 'forward' : 'back'

  let content
  let key: string = screen.name
  if (screen.name === 'dashboard') {
    content = (
      <Dashboard
        dark={dark}
        onOpenTicket={(id) => go({ name: 'ticket', id })}
        onScan={() => go({ name: 'scanner' })}
        onToggleTheme={toggleTheme}
        rejectedScans={rejectedScans}
      />
    )
  } else if (screen.name === 'ticket') {
    const ticket = findTicket(screen.id) ?? tickets[0]
    key = `ticket-${ticket?.id}`
    content = <TicketCard dark={dark} ticket={ticket} onBack={() => go({ name: 'dashboard' })} />
  } else if (screen.name === 'scanner') {
    content = <QRScanner onBack={() => go({ name: 'dashboard' })} onScan={handleScan} />
  } else if (screen.name === 'scan-success') {
    key = `scan-success-${screen.ticket.id}`
    content = (
      <ScanSuccess
        dark={dark}
        ticket={screen.ticket}
        onBack={() => go({ name: 'dashboard' })}
        onScanNext={() => go({ name: 'scanner' })}
      />
    )
  } else if (screen.name === 'scan-rejected') {
    key = `scan-rejected-${screen.ticket?.id ?? screen.rawCode}`
    content = (
      <ScanRejected
        dark={dark}
        ticket={screen.ticket}
        notFoundId={screen.rawCode}
        onBack={() => go({ name: 'dashboard' })}
        onScanNext={() => go({ name: 'scanner' })}
      />
    )
  }

  return (
    <div
      className={`min-h-screen w-full ${bg}`}
      style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', userSelect: 'none' }}
    >
      <div className="w-full max-w-[520px] mx-auto min-h-screen relative overflow-hidden">
        <AnimatePresence mode="sync" initial={false}>
          <motion.div key={key} className="w-full absolute inset-x-0 top-0">
            <PageTransition variant={screen.name === 'scanner' ? 'fade' : direction}>{content}</PageTransition>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AppShell />
  )
}
