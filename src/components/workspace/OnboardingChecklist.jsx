import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

const CYAN = '#22d3ee'
const TEXT_PRIMARY = '#f1f5f9'
const TEXT_MUTED = '#94a3b8'

export default function OnboardingChecklist({ setActivePage }) {
  const { user, profile } = useAuth()
  const [counts, setCounts] = useState({ trades: 0, journal: 0, messages: 0 })
  const [dismissed, setDismissed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const key = `mta-onboarding-dismissed-${user?.id}`
    if (localStorage.getItem(key)) setDismissed(true)
  }, [user])

  useEffect(() => {
    if (!user || dismissed) return
    async function fetchCounts() {
      const [{ count: trades }, { count: journal }, { count: messages }] = await Promise.all([
        supabase.from('pnl_entries').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('journal_entries').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('ai_messages').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('role', 'user'),
      ])
      setCounts({ trades: trades || 0, journal: journal || 0, messages: messages || 0 })
      setLoading(false)
    }
    fetchCounts()
  }, [user, dismissed])

  if (dismissed || loading) return null

  const steps = [
    {
      label: 'Set your trading plan',
      done: !!profile?.trading_plan,
      action: () => setActivePage('ai'),
      hint: 'Open AI Coach → click "Trading Plan"',
    },
    {
      label: 'Log your first trade',
      done: counts.trades > 0,
      action: () => setActivePage('pnl'),
      hint: 'Go to P&L Calendar and click any day',
    },
    {
      label: 'Write your first journal entry',
      done: counts.journal > 0,
      action: () => setActivePage('journal'),
      hint: 'Go to Journal and write about today',
    },
    {
      label: 'Ask the AI coach a question',
      done: counts.messages > 0,
      action: () => setActivePage('ai'),
      hint: 'Go to AI Coach and send a message',
    },
  ]

  const completedCount = steps.filter(s => s.done).length
  const allDone = completedCount === steps.length

  function dismiss() {
    localStorage.setItem(`mta-onboarding-dismissed-${user?.id}`, '1')
    setDismissed(true)
  }

  return (
    <div style={{
      background: 'rgba(6,15,30,0.8)',
      border: '1px solid rgba(34,211,238,0.12)',
      borderRadius: '12px',
      padding: '20px 24px',
      marginBottom: '20px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: TEXT_PRIMARY, letterSpacing: '-0.02em' }}>
              Getting started
            </span>
            <span style={{
              fontSize: '11px',
              background: allDone ? 'rgba(34,211,238,0.15)' : 'rgba(255,255,255,0.06)',
              color: allDone ? CYAN : TEXT_MUTED,
              padding: '2px 8px',
              borderRadius: '20px',
              fontWeight: '500',
            }}>
              {completedCount}/{steps.length}
            </span>
          </div>
          <p style={{ fontSize: '12px', color: TEXT_MUTED, margin: 0 }}>
            {allDone ? "You're all set! You can dismiss this." : 'Complete these steps to get the most out of MaxTradeAI'}
          </p>
        </div>
        <button onClick={dismiss} style={{
          background: 'none',
          border: 'none',
          color: TEXT_MUTED,
          fontSize: '18px',
          cursor: 'pointer',
          padding: '0 0 0 12px',
          lineHeight: 1,
        }}>×</button>
      </div>

      {/* Progress bar */}
      <div style={{ height: '2px', background: 'rgba(255,255,255,0.06)', borderRadius: '1px', margin: '14px 0' }}>
        <div style={{
          height: '100%',
          width: `${(completedCount / steps.length) * 100}%`,
          background: CYAN,
          borderRadius: '1px',
          transition: 'width 0.4s ease',
        }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {steps.map((step, i) => (
          <div
            key={i}
            onClick={!step.done ? step.action : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '8px 10px',
              borderRadius: '8px',
              cursor: step.done ? 'default' : 'pointer',
              background: step.done ? 'transparent' : 'rgba(255,255,255,0.02)',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { if (!step.done) e.currentTarget.style.background = 'rgba(34,211,238,0.05)' }}
            onMouseLeave={e => { if (!step.done) e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
          >
            {/* Checkbox */}
            <div style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              border: step.done ? 'none' : '1.5px solid rgba(255,255,255,0.2)',
              background: step.done ? CYAN : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              {step.done && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1" stroke="#020617" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <span style={{
                fontSize: '13px',
                color: step.done ? TEXT_MUTED : TEXT_PRIMARY,
                textDecoration: step.done ? 'line-through' : 'none',
                letterSpacing: '-0.01em',
              }}>
                {step.label}
              </span>
              {!step.done && (
                <span style={{ fontSize: '11px', color: TEXT_MUTED, marginLeft: '8px' }}>{step.hint}</span>
              )}
            </div>
            {!step.done && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TEXT_MUTED} strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
