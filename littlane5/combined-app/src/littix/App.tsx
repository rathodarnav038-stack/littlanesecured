import { useState } from 'react'
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

  function go(next: Screen) {
    setPrevDepth(DEPTH[screen.name])
    setScreen(next)
  }

  async function handleScan(raw: string) {
    const cleaned = raw.replace(/^LITTIX:/i, '').replace(/^#/, '')
    const outcome = await scanTicket(cleaned, 'Gate Staff')
    if (outcome.result === 'success' && outcome.ticket) {
      go({ name: 'scan-success', ticket: outcome.ticket })
    } else if (outcome.result === 'rejected' && outcome.ticket) {
      // Log rejected (duplicate) scan to session
      setRejectedScans(prev => [{
        ticket: outcome.ticket!,
        rawCode: cleaned,
        timestamp: new Date().toLocaleTimeString('en-IN')
      }, ...prev])
      go({ name: 'scan-rejected', ticket: outcome.ticket })
    } else {
      // Log not-found scan to session
      setRejectedScans(prev => [{
        ticket: null,
        rawCode: cleaned,
        timestamp: new Date().toLocaleTimeString('en-IN')
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
    <div className={`min-h-screen w-full ${bg} transition-colors duration-500`}>
      <div className="w-full max-w-[520px] mx-auto min-h-screen relative overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={key} className="w-full">
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
