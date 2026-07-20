import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import LittixLogo from '../components/LittixLogo'
import AnimatedCounter from '../components/AnimatedCounter'
import { useStore } from '../lib/store'
import type { RejectedScan } from '../littix/App'

interface Props {
  dark: boolean
  onOpenTicket: (id: string) => void
  onScan: () => void
  onToggleTheme: () => void
  rejectedScans: RejectedScan[]
}

export default function Dashboard({ dark, onOpenTicket, onScan, onToggleTheme, rejectedScans }: Props) {
  const { tickets } = useStore()
  const [activeTab, setActiveTab] = useState<'scanned' | 'failed'>('scanned')
  const [search, setSearch] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)

  const bg = dark ? 'bg-[#0D0D0D]' : 'bg-[#F9F9FB]'
  const navBg = dark ? 'bg-[#0D0D0D] border-[#1E1E1E]' : 'bg-[#F9F9FB] border-[#EBEBEB]'
  const cardBg = dark ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-[#EBEBEB]'
  const text = dark ? 'text-white' : 'text-[#111]'
  const subText = dark ? 'text-[#A0A0A0]' : 'text-[#6B6B6B]'
  const searchBg = dark ? 'bg-[#1A1A1A] border-[#2A2A2A] text-white placeholder-[#555]' : 'bg-white border-[#E4E4E7] text-[#111] placeholder-[#A0A0A0]'

  // Get only successfully scanned tickets
  const scannedTickets = useMemo(() => {
    return tickets.filter((t) => t.status === 'scanned')
  }, [tickets])

  // Filter successfully scanned list
  const filteredScanned = useMemo(() => {
    let list = scannedTickets
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((t) => t.attendee.toLowerCase().includes(q) || t.id.toLowerCase().includes(q))
    }
    return list
  }, [scannedTickets, search])

  // Filter session failed scans list
  const filteredFailed = useMemo(() => {
    let list = rejectedScans
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((fs) => {
        const idMatch = (fs.rawCode || '').toLowerCase().includes(q)
        const nameMatch = fs.ticket ? fs.ticket.attendee.toLowerCase().includes(q) : false
        return idMatch || nameMatch
      })
    }
    return list
  }, [rejectedScans, search])

  return (
    <div className={`${bg} flex flex-col w-full min-h-screen`} style={{ fontFamily: 'Inter, sans-serif' }}>

      <div className={`flex items-center justify-between px-4 py-3 border-b ${navBg} sticky top-0 z-10 backdrop-blur-md`}>
        <LittixLogo dark={dark} size="sm" />
        <span className={`text-sm font-semibold ${text}`}>Scanner Panel</span>
        <motion.button
          onClick={onToggleTheme}
          whileTap={{ scale: 0.85 }}
          className={`w-8 h-8 flex items-center justify-center rounded-full ${dark ? 'bg-[#1A1A1A]' : 'bg-white shadow-sm'}`}
          style={{ willChange: 'transform' }}
        >
          {dark ? (
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M13 8.5A5.5 5.5 0 116.5 2a4.5 4.5 0 006.5 6.5z" stroke="#A0A0A0" strokeWidth="1.3" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="7.5" cy="7.5" r="3" stroke="#6B6B6B" strokeWidth="1.3" />
              <path d="M7.5 0.5v2M7.5 12v2M14.5 7.5h-2M2.5 7.5h-2M12.5 2.5l-1.4 1.4M3.9 11.1l-1.4 1.4M12.5 12.5l-1.4-1.4M3.9 3.9L2.5 2.5" stroke="#6B6B6B" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          )}
        </motion.button>
      </div>

      {/* Stats row specific to Scan Panel */}
      <div className="flex gap-2 px-4 pt-4 pb-2">
        <div
          className={`flex-1 rounded-2xl border px-3 py-2.5 ${cardBg}`}
          style={{ boxShadow: dark ? 'none' : '0 1px 8px rgba(0,0,0,0.04)' }}
        >
          <p className="text-xl font-black text-[#22C55E]">
            <AnimatedCounter value={scannedTickets.length} />
          </p>
          <p className={`text-[10px] font-medium mt-0.5 ${subText}`}>Total Scanned</p>
        </div>
        <div
          className={`flex-1 rounded-2xl border px-3 py-2.5 ${cardBg}`}
          style={{ boxShadow: dark ? 'none' : '0 1px 8px rgba(0,0,0,0.04)' }}
        >
          <p className="text-xl font-black text-[#EF4444]">
            <AnimatedCounter value={rejectedScans.length} />
          </p>
          <p className={`text-[10px] font-medium mt-0.5 ${subText}`}>Failed Scans (Session)</p>
        </div>
      </div>

      {/* Search box */}
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
            placeholder="Search scans…"
            className={`text-sm bg-transparent outline-none w-full ${dark ? 'text-white placeholder-[#555]' : 'text-[#111] placeholder-[#A0A0A0]'}`}
          />
        </motion.div>
      </div>

      {/* Tab Selectors */}
      <div className="flex gap-2 px-4 pb-3">
        {(['scanned', 'failed'] as const).map((tab) => (
          <motion.button
            key={tab}
            onClick={() => setActiveTab(tab)}
            whileTap={{ scale: 0.94 }}
            className={`relative px-4 py-1.5 rounded-full text-xs font-semibold border overflow-hidden ${
              activeTab === tab
                ? 'text-white border-[#A855F7]'
                : dark
                ? 'bg-[#1A1A1A] text-[#A0A0A0] border-[#2A2A2A]'
                : 'bg-white text-[#6B6B6B] border-[#E4E4E7]'
            }`}
          >
            {activeTab === tab && (
              <motion.span
                layoutId="filter-pill-bg"
                className="absolute inset-0 bg-[#A855F7]"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative">
              {tab === 'scanned' ? 'Scanned Tickets' : 'Failed & Duplicates'}
            </span>
          </motion.button>
        ))}
      </div>

      <div className={`flex items-center px-4 py-2 border-b text-[9px] font-bold uppercase tracking-widest ${subText}`} style={{ borderColor: dark ? '#1E1E1E' : '#EBEBEB' }}>
        <span style={{ width: 90, flexShrink: 0 }}>Ticket ID</span>
        <span className="flex-1">Attendee / Details</span>
        <span style={{ width: 66 }} className="text-right">Outcome</span>
      </div>

      {/* Scans lists — no AnimatePresence on list items for iPhone performance */}
      <div
        className="flex flex-col overflow-y-auto flex-1"
        style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
      >
        {activeTab === 'scanned' ? (
          filteredScanned.length === 0 ? (
            <p className={`text-xs text-center py-8 ${subText}`}>No scanned tickets yet.</p>
          ) : (
            filteredScanned.map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => onOpenTicket(ticket.id)}
                className="px-4 py-3 border-b flex items-start text-left w-full active:opacity-70 transition-opacity duration-100"
                style={{ borderColor: dark ? '#1A1A1A' : '#F2F2F2' }}
              >
                <span className={`text-[10px] font-mono font-semibold ${subText}`} style={{ width: 90, flexShrink: 0 }}>
                  #{ticket.id.length > 8 ? ticket.id.slice(-8).toUpperCase() : ticket.id.toUpperCase()}
                </span>
                <div className="flex-1">
                  <span className={`text-xs font-semibold block ${text}`}>{ticket.attendee}</span>
                  <p className={`text-[9px] ${subText} mt-0.5`}>
                    {ticket.ticketType} · Scanned by {ticket.scannedBy} at {ticket.scannedAt}
                  </p>
                </div>
                <span className="bg-[#22C55E]/15 text-[#22C55E] text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Success
                </span>
              </button>
            ))
          )
        ) : (
          filteredFailed.length === 0 ? (
            <p className={`text-xs text-center py-8 ${subText}`}>No failed scans in this session.</p>
          ) : (
            filteredFailed.map((item, i) => {
              const canClick = !!item.ticket
              // Badge color + label by reason
              const badgeStyle =
                item.reason === 'cancelled'
                  ? 'bg-[#F59E0B]/15 text-[#F59E0B]'
                  : item.reason === 'invalid'
                  ? 'bg-[#6B7280]/15 text-[#9CA3AF]'
                  : 'bg-[#EF4444]/15 text-[#EF4444]'
              const badgeLabel =
                item.reason === 'cancelled' ? 'Cancelled' : item.reason === 'invalid' ? 'Invalid' : 'Duplicate'
              // Attempt ordinal: 1→"2nd scan", 2→"3rd scan" etc.
              const ordinal = (n: number) => {
                const s = n + 1  // 1st attempt = 2nd scan overall
                const sfx = s === 1 ? 'st' : s === 2 ? 'nd' : s === 3 ? 'rd' : 'th'
                return `${s}${sfx} scan attempt`
              }
              const shortId = item.rawCode
                ? (item.rawCode.length > 8 ? item.rawCode.slice(-8).toUpperCase() : item.rawCode.toUpperCase())
                : 'UNKNOWN'

              return canClick ? (
                <button
                  key={i}
                  onClick={() => onOpenTicket(item.ticket!.id)}
                  className="px-4 py-3 border-b flex items-start text-left w-full active:opacity-70 transition-opacity duration-100"
                  style={{ borderColor: dark ? '#1A1A1A' : '#F2F2F2' }}
                >
                  <span className={`text-[10px] font-mono font-semibold ${subText}`} style={{ width: 90, flexShrink: 0 }}>
                    #{shortId}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className={`text-xs font-semibold block truncate ${text}`}>{item.ticket!.attendee}</span>
                    <p className={`text-[9px] ${subText} mt-0.5`}>
                      {item.ticket!.ticketType} · {ordinal(item.attemptNumber)}
                    </p>
                    {item.reason === 'duplicate' && item.ticket!.scannedAt && (
                      <p className={`text-[9px] text-[#EF4444]/70 mt-0.5`}>
                        First scanned: {item.ticket!.scannedAt}
                      </p>
                    )}
                    <p className={`text-[9px] ${subText} mt-0.5`}>Rejected at {item.timestamp}</p>
                  </div>
                  <span className={`${badgeStyle} text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0 ml-1`}>
                    {badgeLabel}
                  </span>
                </button>
              ) : (
                <div
                  key={i}
                  className="px-4 py-3 border-b flex items-start text-left w-full"
                  style={{ borderColor: dark ? '#1A1A1A' : '#F2F2F2' }}
                >
                  <span className={`text-[10px] font-mono font-semibold ${subText}`} style={{ width: 90, flexShrink: 0 }}>
                    #{shortId}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className={`text-xs font-semibold block ${text}`}>Unknown Ticket</span>
                    <p className={`text-[9px] ${subText} mt-0.5`}>
                      {ordinal(item.attemptNumber)} · Not found in database
                    </p>
                    <p className={`text-[9px] ${subText} mt-0.5`}>Rejected at {item.timestamp}</p>
                  </div>
                  <span className="bg-[#6B7280]/15 text-[#9CA3AF] text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0 ml-1">
                    Invalid
                  </span>
                </div>
              )
            })
          )
        )}
      </div>


      <div className={`px-4 py-3 border-t ${navBg}`}>
        <motion.button
          onClick={onScan}
          whileTap={{ scale: 0.96 }}
          className="w-full bg-[#A855F7] text-white text-xs font-bold py-3 rounded-2xl flex items-center justify-center gap-1.5"
          style={{ boxShadow: '0 4px 20px rgba(168,85,247,0.3)', willChange: 'transform' }}
        >
          📷 Scan Ticket
        </motion.button>
      </div>
    </div>
  )
}
