import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import LittixLogo from '../components/LittixLogo'
import AnimatedCounter from '../components/AnimatedCounter'
import { useStore } from '../lib/store'

interface Props {
  dark: boolean
  onOpenTicket: (id: string) => void
  onScan: () => void
  onGenerate: () => void
  onToggleTheme: () => void
}

function StatusPill({ status }: { status: string }) {
  if (status === 'scanned') {
    return (
      <motion.span
        layout
        className="bg-[#22C55E]/15 text-[#22C55E] text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
      >
        Scanned
      </motion.span>
    )
  }
  return (
    <motion.span
      layout
      className="bg-[#6B7280]/15 text-[#6B7280] text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
    >
      Pending
    </motion.span>
  )
}

export default function Dashboard({ dark, onOpenTicket, onScan, onGenerate, onToggleTheme }: Props) {
  const { tickets } = useStore()
  const [activeFilter, setActiveFilter] = useState<'all' | 'scanned' | 'pending'>('all')
  const [search, setSearch] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)

  const bg = dark ? 'bg-[#0D0D0D]' : 'bg-[#F9F9FB]'
  const navBg = dark ? 'bg-[#0D0D0D] border-[#1E1E1E]' : 'bg-[#F9F9FB] border-[#EBEBEB]'
  const cardBg = dark ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-[#EBEBEB]'
  const text = dark ? 'text-white' : 'text-[#111]'
  const subText = dark ? 'text-[#A0A0A0]' : 'text-[#6B6B6B]'
  const searchBg = dark ? 'bg-[#1A1A1A] border-[#2A2A2A] text-white placeholder-[#555]' : 'bg-white border-[#E4E4E7] text-[#111] placeholder-[#A0A0A0]'

  const filters: { key: typeof activeFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'scanned', label: 'Scanned' },
    { key: 'pending', label: 'Pending' },
  ]

  const stats = useMemo(() => ({
    total: tickets.length,
    scanned: tickets.filter((t) => t.status === 'scanned').length,
    pending: tickets.filter((t) => t.status === 'pending').length,
  }), [tickets])

  const filtered = useMemo(() => {
    let list = activeFilter === 'all' ? tickets : tickets.filter((t) => t.status === activeFilter)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((t) => t.attendee.toLowerCase().includes(q) || t.id.toLowerCase().includes(q) || t.event.toLowerCase().includes(q))
    }
    return list
  }, [tickets, activeFilter, search])

  return (
    <div className={`${bg} flex flex-col w-full min-h-screen`} style={{ fontFamily: 'Inter, sans-serif' }}>

      <motion.div
        className={`flex items-center justify-between px-4 py-3 border-b ${navBg} sticky top-0 z-10 backdrop-blur`}
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <LittixLogo dark={dark} size="sm" />
        <span className={`text-sm font-semibold ${text}`}>Dashboard</span>
        <motion.button
          onClick={onToggleTheme}
          whileTap={{ scale: 0.85 }}
          whileHover={{ scale: 1.08 }}
          className={`w-8 h-8 flex items-center justify-center rounded-full ${dark ? 'bg-[#1A1A1A]' : 'bg-white shadow-sm'}`}
        >
          <AnimatePresence mode="wait" initial={false}>
            {dark ? (
              <motion.svg
                key="moon"
                width="15" height="15" viewBox="0 0 15 15" fill="none"
                initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                <path d="M13 8.5A5.5 5.5 0 116.5 2a4.5 4.5 0 006.5 6.5z" stroke="#A0A0A0" strokeWidth="1.3" strokeLinejoin="round" />
              </motion.svg>
            ) : (
              <motion.svg
                key="sun"
                width="15" height="15" viewBox="0 0 15 15" fill="none"
                initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                <circle cx="7.5" cy="7.5" r="3" stroke="#6B6B6B" strokeWidth="1.3" />
                <path d="M7.5 0.5v2M7.5 12v2M14.5 7.5h-2M2.5 7.5h-2M12.5 2.5l-1.4 1.4M3.9 11.1l-1.4 1.4M12.5 12.5l-1.4-1.4M3.9 3.9L2.5 2.5" stroke="#6B6B6B" strokeWidth="1.3" strokeLinecap="round" />
              </motion.svg>
            )}
          </AnimatePresence>
        </motion.button>
      </motion.div>

      <div className="flex gap-2 px-4 pt-4 pb-2">
        {[
          { label: 'Total', value: stats.total, color: dark ? '#A0A0A0' : '#6B6B6B' },
          { label: 'Scanned', value: stats.scanned, color: '#22C55E' },
          { label: 'Pending', value: stats.pending, color: '#6B7280' },
        ].map(({ label, value, color }, i) => (
          <motion.div
            key={label}
            className={`flex-1 rounded-2xl border px-3 py-2.5 ${cardBg}`}
            style={{ boxShadow: dark ? 'none' : '0 1px 8px rgba(0,0,0,0.04)' }}
            initial={{ opacity: 0, y: 16, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, delay: 0.05 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -3, boxShadow: dark ? '0 8px 20px rgba(168,85,247,0.12)' : '0 8px 20px rgba(0,0,0,0.08)' }}
          >
            <p className="text-xl font-black" style={{ color }}>
              <AnimatedCounter value={value} />
            </p>
            <p className={`text-[10px] font-medium mt-0.5 ${subText}`}>{label}</p>
          </motion.div>
        ))}
      </div>

      <div className="px-4 pb-2">
        <motion.div
          className={`flex items-center gap-2 rounded-2xl px-4 py-3 border ${searchBg}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{
            opacity: 1,
            y: 0,
            borderColor: searchFocused ? '#A855F7' : undefined,
            boxShadow: searchFocused ? '0 0 0 3px rgba(168,85,247,0.15)' : '0 0 0 0px rgba(168,85,247,0)',
          }}
          transition={{ duration: 0.3 }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
            <circle cx="6" cy="6" r="4.5" stroke={dark ? '#555' : '#A0A0A0'} strokeWidth="1.2" />
            <path d="M10 10l2.5 2.5" stroke={dark ? '#555' : '#A0A0A0'} strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search tickets…"
            className={`text-sm bg-transparent outline-none w-full ${dark ? 'text-white placeholder-[#555]' : 'text-[#111] placeholder-[#A0A0A0]'}`}
          />
        </motion.div>
      </div>

      <div className="flex gap-2 px-4 pb-3">
        {filters.map(({ key, label }) => (
          <motion.button
            key={key}
            onClick={() => setActiveFilter(key)}
            whileTap={{ scale: 0.94 }}
            className={`relative px-4 py-1.5 rounded-full text-xs font-semibold border overflow-hidden ${
              activeFilter === key
                ? 'text-white border-[#A855F7]'
                : dark
                ? 'bg-[#1A1A1A] text-[#A0A0A0] border-[#2A2A2A]'
                : 'bg-white text-[#6B6B6B] border-[#E4E4E7]'
            }`}
          >
            {activeFilter === key && (
              <motion.span
                layoutId="filter-pill-bg"
                className="absolute inset-0 bg-[#A855F7]"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative">{label}</span>
          </motion.button>
        ))}
      </div>

      <div className={`flex items-center px-4 py-2 border-b text-[9px] font-bold uppercase tracking-widest ${subText}`} style={{ borderColor: dark ? '#1E1E1E' : '#EBEBEB' }}>
        <span style={{ width: 90, flexShrink: 0 }}>Ticket ID</span>
        <span className="flex-1">Attendee</span>
        <span style={{ width: 56 }} className="text-right">Status</span>
      </div>

      <div className="flex flex-col overflow-y-auto flex-1">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 && (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`text-xs text-center py-8 ${subText}`}
            >
              No tickets match.
            </motion.p>
          )}
          {filtered.map((ticket, i) => (
            <motion.button
              layout
              key={ticket.id}
              onClick={() => onOpenTicket(ticket.id)}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -24, transition: { duration: 0.2 } }}
              transition={{ duration: 0.35, delay: Math.min(i * 0.035, 0.4), ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ backgroundColor: dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.015)' }}
              whileTap={{ scale: 0.985 }}
              className="px-4 py-3 border-b text-left w-full"
              style={{ borderColor: dark ? '#1A1A1A' : '#F2F2F2' }}
            >
              <div className="flex items-center mb-1 gap-2">
                <span
                  className={`text-[10px] font-mono font-semibold ${subText}`}
                  style={{
                    width: 90,
                    flexShrink: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'block',
                  }}
                  title={ticket.id}
                >
                  #{ticket.id.length > 8 ? ticket.id.slice(-8).toUpperCase() : ticket.id.toUpperCase()}
                </span>
                <span className={`flex-1 text-xs font-semibold truncate ${text}`}>{ticket.attendee}</span>
                <StatusPill status={ticket.status} />
              </div>
              <div className="flex items-start">
                <div style={{ width: 90, flexShrink: 0 }} />
                <div className="flex-1">
                  <p className={`text-[10px] ${subText}`}>
                    by <span className={`font-medium ${dark ? 'text-[#ccc]' : 'text-[#444]'}`}>{ticket.generatedBy}</span>
                    {' · '}{ticket.generatedAt}
                  </p>
                  {ticket.status === 'scanned' && (
                    <p className="text-[10px] text-[#22C55E]">
                      ↳ {ticket.scannedBy} · {ticket.scannedAt}
                    </p>
                  )}
                </div>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      <motion.div
        className={`flex gap-2 px-4 py-3 border-t ${navBg}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <motion.button
          onClick={onGenerate}
          whileHover={{ scale: 1.02, boxShadow: '0 6px 28px rgba(168,85,247,0.45)' }}
          whileTap={{ scale: 0.96 }}
          className="flex-1 bg-[#A855F7] text-white text-xs font-bold py-3 rounded-2xl flex items-center justify-center gap-1.5"
          style={{ boxShadow: '0 4px 20px rgba(168,85,247,0.3)' }}
        >
          + New Ticket
        </motion.button>
        <motion.button
          onClick={onScan}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          className={`flex-1 text-xs font-bold py-3 rounded-2xl border flex items-center justify-center gap-1.5 ${dark ? 'bg-[#1A1A1A] border-[#2A2A2A] text-white' : 'bg-white border-[#E4E4E7] text-[#111]'}`}
        >
          Scan Ticket
        </motion.button>
      </motion.div>
    </div>
  )
}
