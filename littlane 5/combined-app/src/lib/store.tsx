import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type TicketType = 'General' | 'VIP' | 'Backstage' | 'Male Pass' | 'Female Pass'
export type TicketStatus = 'pending' | 'scanned'

export interface Ticket {
  id: string
  event: string
  attendee: string
  email: string
  phone?: string
  dateLabel: string
  venue: string
  ticketType: TicketType
  price: string
  qty: number
  generatedBy: string
  generatedAt: string
  status: TicketStatus
  scannedBy?: string
  scannedAt?: string
}

const THEME_KEY = 'littix-theme-v1'

interface StoreValue {
  tickets: Ticket[]
  dark: boolean
  loading: boolean
  toggleTheme: () => void
  refreshTickets: () => Promise<void>
  addTicket: (input: {
    event: string
    attendee: string
    email: string
    dateLabel: string
    ticketType: TicketType
  }) => Promise<Ticket>
  scanTicket: (idOrRaw: string, scannedBy: string) => Promise<{ result: 'success' | 'rejected' | 'not_found'; ticket?: Ticket }>
  findTicket: (id: string) => Ticket | undefined
}

const StoreContext = createContext<StoreValue | null>(null)

function loadTheme(): boolean {
  try {
    const raw = localStorage.getItem(THEME_KEY)
    if (raw) return raw === 'dark'
  } catch {
    // ignore
  }
  return true
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [dark, setDark] = useState<boolean>(loadTheme)
  const [loading, setLoading] = useState<boolean>(false)

  const adminKey = useMemo(() => {
    return localStorage.getItem('ft_admin_key') || sessionStorage.getItem('ft_admin_key') || 'change-me-admin-key'
  }, [])

  const refreshTickets = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/sales?key=${adminKey}`)
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.sales) {
          // Map DB sales to Littix Ticket objects
          const mapped: Ticket[] = data.sales.map((sale: any) => {
            const isScanned = sale.status === 'scanned' || !!sale.scannedAt
            return {
              id: sale.ticketId || sale.orderId,
              event: sale.event || 'FRESHERS TAKEOVER',
              attendee: sale.name,
              email: sale.email,
              phone: sale.phone || '',
              dateLabel: sale.generatedAt ? new Date(sale.generatedAt).toLocaleString() : 'TBA',
              venue: 'Symbiosis Grounds, Pune',
              ticketType: sale.gender === 'male' ? 'Male Pass' : sale.gender === 'female' ? 'Female Pass' : 'General',
              price: `₹${sale.amount}`,
              qty: sale.quantity || 1,
              generatedBy: 'Admin',
              generatedAt: sale.generatedAt ? new Date(sale.generatedAt).toLocaleString() : 'TBA',
              status: isScanned ? 'scanned' : 'pending',
              scannedBy: sale.scannedBy || undefined,
              scannedAt: sale.scannedAt || undefined
            }
          })
          setTickets(mapped)
        }
      }
    } catch (err) {
      console.error('Failed to load tickets from server', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshTickets()
    // Poll every 8 seconds for real-time updates
    const interval = setInterval(refreshTickets, 8000)
    return () => clearInterval(interval)
  }, [adminKey])

  useEffect(() => {
    localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light')
  }, [dark])

  const value = useMemo<StoreValue>(() => ({
    tickets,
    dark,
    loading,
    toggleTheme: () => setDark((d) => !d),
    refreshTickets,
    addTicket: async (input) => {
      const res = await fetch('/api/admin/generate-ticket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey
        },
        body: JSON.stringify({
          name: input.attendee,
          email: input.email,
          event: input.event,
          ticketType: input.ticketType,
          quantity: 1,
          amount: input.ticketType === 'VIP' ? 189 : input.ticketType === 'Backstage' ? 349 : 89
        })
      })

      if (!res.ok) {
        throw new Error('Failed to generate ticket on server')
      }

      const data = await res.json()
      if (!data.success) {
        throw new Error(data.message || 'Server error generating ticket')
      }

      await refreshTickets()

      return {
        id: data.ticket.id,
        event: data.ticket.event,
        attendee: data.ticket.attendee,
        email: data.ticket.email,
        dateLabel: new Date(data.ticket.generatedAt).toLocaleString(),
        venue: 'Symbiosis Grounds, Pune',
        ticketType: data.ticket.ticketType,
        price: `₹${data.ticket.price}`,
        qty: data.ticket.qty,
        generatedBy: data.ticket.generatedBy,
        generatedAt: new Date(data.ticket.generatedAt).toLocaleString(),
        status: 'pending'
      }
    },
    scanTicket: async (idOrRaw, scannedBy) => {
      try {
        const cleanId = idOrRaw.trim()
        const res = await fetch('/api/scan-ticket', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ticketId: cleanId,
            scannedBy
          })
        })

        if (!res.ok) {
          return { result: 'not_found' }
        }

        const data = await res.json()
        if (data.result === 'success') {
          await refreshTickets()
          const matchedTicket = tickets.find(t => t.id === cleanId) || {
            id: data.ticket.id,
            event: data.ticket.event,
            attendee: data.ticket.attendee,
            email: data.ticket.email,
            phone: data.ticket.phone,
            dateLabel: 'TBA',
            venue: 'Symbiosis Grounds, Pune',
            ticketType: data.ticket.ticketType === 'male' ? 'Male Pass' : data.ticket.ticketType === 'female' ? 'Female Pass' : 'General',
            price: `₹${data.ticket.amount}`,
            qty: data.ticket.quantity || 1,
            generatedBy: 'Admin',
            generatedAt: data.ticket.generatedAt ? new Date(data.ticket.generatedAt).toLocaleString() : 'TBA',
            status: 'scanned',
            scannedBy: data.ticket.scannedBy,
            scannedAt: data.ticket.scannedAt
          }
          return {
            result: 'success',
            ticket: {
              ...matchedTicket,
              phone: data.ticket.phone,
              status: 'scanned',
              scannedBy: data.ticket.scannedBy,
              scannedAt: data.ticket.scannedAt
            } as Ticket
          }
        } else if (data.result === 'rejected') {
          const matchedTicket = tickets.find(t => t.id === cleanId)
          return {
            result: 'rejected',
            ticket: matchedTicket
          }
        }
      } catch (err) {
        console.error('Scan api error:', err)
      }
      return { result: 'not_found' }
    },
    findTicket: (id) => tickets.find((t) => t.id === id),
  }), [tickets, dark, loading, adminKey])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
