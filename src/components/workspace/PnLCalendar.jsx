import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

const CYAN = '#22d3ee'
const BG_TOP = '#07101f'
const TEXT_PRIMARY = '#f1f5f9'
const TEXT_MUTED = '#94a3b8'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

function toIso(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function todayStr() {
  const d = new Date()
  return toIso(d.getFullYear(), d.getMonth(), d.getDate())
}

export default function PnLCalendar() {
  const { user } = useAuth()
  const today = new Date()

  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [pnlData, setPnlData] = useState({})
  const [editModal, setEditModal] = useState({ open: false, date: null, symbol: '', pnl: '', rr: '' })
  const [saving, setSaving] = useState(false)

  const loadPnlData = useCallback(async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('pnl_entries')
      .select('*')
      .eq('user_id', user.id)

    if (!error && data) {
      const map = {}
      data.forEach(entry => {
        map[entry.date] = { symbol: entry.symbol, pnl: entry.pnl, rr: entry.rr, id: entry.id }
      })
      setPnlData(map)
    }
  }, [user])

  useEffect(() => {
    loadPnlData()
  }, [loadPnlData])

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  // Summary stats
  const monthEntries = Object.entries(pnlData).filter(([date]) => {
    const d = new Date(date + 'T00:00:00')
    return d.getFullYear() === year && d.getMonth() === month
  })
  const totalPnl = monthEntries.reduce((sum, [, v]) => sum + (parseFloat(v.pnl) || 0), 0)
  const winDays = monthEntries.filter(([, v]) => (parseFloat(v.pnl) || 0) > 0).length
  const lossDays = monthEntries.filter(([, v]) => (parseFloat(v.pnl) || 0) < 0).length
  const winRate = monthEntries.length > 0 ? Math.round((winDays / monthEntries.length) * 100) : 0

  function openModal(date) {
    const existing = pnlData[date] || {}
    setEditModal({
      open: true,
      date,
      symbol: existing.symbol || '',
      pnl: existing.pnl !== undefined ? String(existing.pnl) : '',
      rr: existing.rr !== undefined ? String(existing.rr) : '',
    })
  }

  async function saveEntry() {
    if (!editModal.date) return
    setSaving(true)
    try {
      await supabase.from('pnl_entries').upsert({
        user_id: user.id,
        date: editModal.date,
        symbol: editModal.symbol,
        pnl: parseFloat(editModal.pnl) || 0,
        rr: parseFloat(editModal.rr) || 0,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,date' })

      await loadPnlData()
      setEditModal({ open: false, date: null, symbol: '', pnl: '', rr: '' })
    } catch (err) {
      console.error('Error saving P&L entry:', err)
    } finally {
      setSaving(false)
    }
  }

  const todayIso = todayStr()

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Month navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={prevMonth}
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: TEXT_MUTED, padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit' }}
          >←</button>
          <span style={{ fontSize: '16px', fontWeight: '700', color: TEXT_PRIMARY, minWidth: '160px', textAlign: 'center' }}>
            {MONTHS[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: TEXT_MUTED, padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit' }}
          >→</button>
        </div>

        {/* Month summary */}
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginLeft: 'auto' }}>
          <StatPill label="Total P&L" value={`${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)}`} color={totalPnl >= 0 ? '#22c55e' : '#ef4444'} />
          <StatPill label="Win Days" value={winDays} color="#22c55e" />
          <StatPill label="Loss Days" value={lossDays} color="#ef4444" />
          <StatPill label="Win Rate" value={`${winRate}%`} color={winRate >= 50 ? '#22c55e' : '#ef4444'} />
        </div>
      </div>

      {/* Calendar */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '16px',
        overflow: 'hidden',
      }}>
        {/* Weekday headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {WEEKDAYS.map(d => (
            <div key={d} style={{
              padding: '10px 0',
              textAlign: 'center',
              fontSize: '11px',
              fontWeight: '700',
              color: TEXT_MUTED,
              letterSpacing: '0.06em',
              borderRight: '1px solid rgba(255,255,255,0.04)',
            }}>
              {d}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {cells.map((day, idx) => {
            if (day === null) {
              return (
                <div key={`empty-${idx}`} style={{
                  minHeight: '80px',
                  borderRight: '1px solid rgba(255,255,255,0.04)',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  background: 'rgba(255,255,255,0.01)',
                }} />
              )
            }
            const isoDate = toIso(year, month, day)
            const entry = pnlData[isoDate]
            const pnl = entry ? parseFloat(entry.pnl) : null
            const isToday = isoDate === todayIso
            const isPositive = pnl !== null && pnl > 0
            const isNegative = pnl !== null && pnl < 0

            return (
              <div
                key={isoDate}
                onClick={() => openModal(isoDate)}
                style={{
                  minHeight: '80px',
                  padding: '8px',
                  borderRight: '1px solid rgba(255,255,255,0.04)',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  cursor: 'pointer',
                  background: entry
                    ? isPositive ? 'rgba(34,197,94,0.05)' : 'rgba(239,68,68,0.05)'
                    : 'transparent',
                  outline: isToday ? `1.5px solid ${CYAN}` : 'none',
                  outlineOffset: '-1px',
                  transition: 'background 0.15s',
                  position: 'relative',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                onMouseLeave={e => {
                  e.currentTarget.style.background = entry
                    ? isPositive ? 'rgba(34,197,94,0.05)' : 'rgba(239,68,68,0.05)'
                    : 'transparent'
                }}
              >
                <div style={{
                  fontSize: '11px',
                  fontWeight: isToday ? '700' : '500',
                  color: isToday ? CYAN : TEXT_MUTED,
                  marginBottom: '6px',
                }}>
                  {day}
                </div>
                {entry && pnl !== null && (
                  <>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: '700',
                      color: isPositive ? '#22c55e' : '#ef4444',
                    }}>
                      {isPositive ? '+' : ''}{pnl >= 0 ? '' : ''}{pnl.toFixed(0)}
                    </div>
                    {entry.symbol && (
                      <div style={{ fontSize: '10px', color: TEXT_MUTED, marginTop: '2px' }}>
                        {entry.symbol}
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Edit Modal */}
      {editModal.open && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '24px',
        }}
          onClick={e => { if (e.target === e.currentTarget) setEditModal(prev => ({ ...prev, open: false })) }}
        >
          <div style={{
            background: '#07101f',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            padding: '28px',
            width: '100%',
            maxWidth: '360px',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: TEXT_PRIMARY, marginBottom: '4px' }}>
              Log P&L
            </h3>
            <p style={{ fontSize: '13px', color: TEXT_MUTED, marginBottom: '20px' }}>
              {new Date(editModal.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <ModalInput label="SYMBOL" value={editModal.symbol} onChange={v => setEditModal(p => ({ ...p, symbol: v }))} placeholder="NQ, ES, EURUSD..." />
              <ModalInput label="P&L ($)" type="number" value={editModal.pnl} onChange={v => setEditModal(p => ({ ...p, pnl: v }))} placeholder="e.g. 450 or -200" />
              <ModalInput label="R:R" type="number" value={editModal.rr} onChange={v => setEditModal(p => ({ ...p, rr: v }))} placeholder="e.g. 2.5" />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => setEditModal(p => ({ ...p, open: false }))}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: TEXT_MUTED,
                  padding: '10px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '14px',
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveEntry}
                disabled={saving}
                style={{
                  flex: 1,
                  background: saving ? 'rgba(34,211,238,0.4)' : CYAN,
                  color: '#020617',
                  border: 'none',
                  padding: '10px',
                  borderRadius: '8px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '14px',
                  fontWeight: '700',
                }}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatPill({ label, value, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <span style={{ fontSize: '11px', color: '#475569', letterSpacing: '0.04em', fontWeight: '600' }}>{label}</span>
      <span style={{ fontSize: '15px', fontWeight: '800', color }}>{value}</span>
    </div>
  )
}

function ModalInput({ label, value, onChange, placeholder, type = 'text' }) {
  const CYAN = '#22d3ee'
  const TEXT_PRIMARY = '#f1f5f9'
  const TEXT_MUTED = '#94a3b8'
  return (
    <div>
      <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: TEXT_MUTED, marginBottom: '6px', letterSpacing: '0.06em' }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px',
          padding: '10px 12px',
          color: TEXT_PRIMARY,
          fontSize: '14px',
          outline: 'none',
          fontFamily: 'inherit',
        }}
        onFocus={e => e.target.style.borderColor = CYAN}
        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
      />
    </div>
  )
}
