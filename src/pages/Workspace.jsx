import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/workspace/Sidebar'
import Header from '../components/workspace/Header'
import AICoach from '../components/workspace/AICoach'
import PnLCalendar from '../components/workspace/PnLCalendar'
import Journal from '../components/workspace/Journal'
import DailyPlan from '../components/workspace/DailyPlan'
import Analytics from '../components/workspace/Analytics'
import Dashboard from '../components/workspace/Dashboard'
import OnboardingChecklist from '../components/workspace/OnboardingChecklist'

export default function Workspace() {
  const [activePage, setActivePage] = useState('dashboard')
  const [searchParams, setSearchParams] = useSearchParams()
  const { user, refreshProfile } = useAuth()

  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    if (!sessionId || !user) return
    fetch('/api/verify-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, userId: user.id }),
    })
      .then(r => r.json())
      .then(() => { refreshProfile(user.id); setSearchParams({}) })
      .catch(console.error)
  }, [user])

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#070b14' }}>
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header activePage={activePage} />
        <main style={{ flex: 1, overflowY: 'auto', padding: '28px 24px' }}>
          <OnboardingChecklist setActivePage={setActivePage} />
          {activePage === 'dashboard' && <Dashboard setActivePage={setActivePage} />}
          {activePage === 'ai'        && <AICoach />}
          {activePage === 'plan'      && <DailyPlan />}
          {activePage === 'pnl'       && <PnLCalendar />}
          {activePage === 'journal'   && <Journal />}
          {activePage === 'analytics' && <Analytics />}
        </main>
      </div>
    </div>
  )
}
