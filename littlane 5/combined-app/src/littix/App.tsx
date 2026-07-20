import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../lib/store'
import GenerateTicket from '../screens/GenerateTicket'
import TicketCard from '../screens/TicketCard'
import QRScanner from '../screens/QRScanner'
import ScanSuccess from '../screens/ScanSuccess'
import ScanRejected from '../screens/ScanRejected'
import Dashboard from '../screens/Dashboard'
import PageTransition from '../components/PageTransition'

type Screen =
  | { name: 'dashboard' }
  | { name: 'generate' }
  | { name: 'ticket'; id: string }
  | { name: 'scanner' }
  | { name: 'scan-success'; id: string }
  | { name: 'scan-rejected'; id: string | null; rawCode?: string }

const DEPTH: Record<Screen['name'], number> = {
  dashboard: 0,
  generate: 1,
  ticket: 1,
  scanner: 1,
  'scan-success': 2,
  'scan-rejected': 2,
}

function AppShell() {
  const { dark, toggleTheme, tickets, findTicket, scanTicket } = useStore()
  const [screen, setScreen] = useState<Screen>({ name: 'dashboard' })
  const [prevDepth, setPrevDepth] = useState(0)

  function go(next: Screen) {
    setPrevDepth(DEPTH[screen.name])
    setScreen(next)
  }

  async function handleScan(raw: string) {
    const cleaned = raw.replace(/^LITTIX:/i, '').replace(/^#/, '')
    const outcome = await scanTicket(cleaned, 'Maria Santos')
    if (outcome.result === 'success' && outcome.ticket) {
      go({ name: 'scan-success', id: outcome.ticket.id })
    } else if (outcome.result === 'rejected' && outcome.ticket) {
      go({ name: 'scan-rejected', id: outcome.ticket.id })
    } else {
      go({ name: 'scan-rejected', id: null, rawCode: cleaned })
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
        onGenerate={() => go({ name: 'generate' })}
        onToggleTheme={toggleTheme}
      />
    )
  } else if (screen.name === 'generate') {
    content = (
      <GenerateTicket
        dark={dark}
        onBack={() => go({ name: 'dashboard' })}
        onGenerated={(id) => go({ name: 'ticket', id })}
      />
    )
  } else if (screen.name === 'ticket') {
    const ticket = findTicket(screen.id) ?? tickets[0]
    key = `ticket-${ticket?.id}`
    content = <TicketCard dark={dark} ticket={ticket} onBack={() => go({ name: 'dashboard' })} />
  } else if (screen.name === 'scanner') {
    content = <QRScanner onBack={() => go({ name: 'dashboard' })} onScan={handleScan} />
  } else if (screen.name === 'scan-success') {
    const ticket = findTicket(screen.id)
    if (!ticket) {
      content = (
        <Dashboard
          dark={dark}
          onOpenTicket={(id) => go({ name: 'ticket', id })}
          onScan={() => go({ name: 'scanner' })}
          onGenerate={() => go({ name: 'generate' })}
          onToggleTheme={toggleTheme}
        />
      )
    } else {
      content = (
        <ScanSuccess
          dark={dark}
          ticket={ticket}
          onBack={() => go({ name: 'dashboard' })}
          onScanNext={() => go({ name: 'scanner' })}
        />
      )
    }
  } else if (screen.name === 'scan-rejected') {
    const ticket = screen.id ? findTicket(screen.id) ?? null : null
    content = (
      <ScanRejected
        dark={dark}
        ticket={ticket}
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
