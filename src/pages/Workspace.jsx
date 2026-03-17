import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/workspace/Sidebar'
import Header from '../components/workspace/Header'
import AICoach from '../components/workspace/AICoach'
import PnLCalendar from '../components/workspace/PnLCalendar'
import Journal from '../components/workspace/Journal'

export default function Workspace() {
  const [activePage, setActivePage] = useState('ai')
  const [searchParams, setSearchParams] = useSearchParams()
  const { user, refreshProfile } = useAuth()

  // Handle post-payment redirect from Stripe
  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    if (!sessionId || !user) return

    fetch('/api/verify-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, userId: user.id }),
    })
      .then(r => r.json())
      .then(() => {
        refreshProfile(user.id)
        setSearchParams({})
      })
      .catch(console.error)
  }, [user])

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#020617' }}>
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header activePage={activePage} />
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {activePage === 'ai' && <AICoach />}
          {activePage === 'pnl' && <PnLCalendar />}
          {activePage === 'journal' && <Journal />}
        </main>
      </div>
    </div>
  )
}
