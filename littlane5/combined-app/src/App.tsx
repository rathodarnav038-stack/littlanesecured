import { useState, useEffect } from 'react'
import { StoreProvider } from './lib/store'
import LittixApp from './littix/App'
import AdminDashboard from './admin-dash/App'

function MainAppShell() {
  const [path, setPath] = useState(window.location.pathname)

  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname)
    }
    window.addEventListener('popstate', handlePopState)
    
    const interval = setInterval(() => {
      if (window.location.pathname !== path) {
        setPath(window.location.pathname)
      }
    }, 200)

    return () => {
      window.removeEventListener('popstate', handlePopState)
      clearInterval(interval)
    }
  }, [path])

  if (path.startsWith('/dashboard')) {
    return <AdminDashboard />
  }

  if (path.startsWith('/tickets')) {
    return <LittixApp />
  }

  // Redirect root to the Littlane site
  window.location.href = '/'
  return null
}


export default function App() {
  return (
    <StoreProvider>
      <MainAppShell />
    </StoreProvider>
  )
}
