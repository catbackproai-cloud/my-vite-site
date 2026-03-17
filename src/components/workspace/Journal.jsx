import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

const CYAN = '#22d3ee'
const TEXT_PRIMARY = '#f1f5f9'
const TEXT_MUTED = '#94a3b8'

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const sections = [
  { key: 'notes', label: "Today's Notes", placeholder: "What happened today? How did you trade? Any notable moments or observations..." },
  { key: 'learned', label: "What I Learned", placeholder: "What new insights, patterns, or lessons did you take away from today's session?" },
  { key: 'improve', label: "What to Improve", placeholder: "What will you work on tomorrow? Any habits, rules, or mindset areas to focus on?" },
]

export default function Journal() {
  const { user } = useAuth()
  const [day, setDay] = useState(todayStr())
  const [journal, setJournal] = useState({ notes: '', learned: '', improve: '' })
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  const [loading, setLoading] = useState(false)
  const saveTimerRef = useRef(null)

  const loadJournal = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', day)
        .single()

      if (data) {
        setJournal({ notes: data.notes || '', learned: data.learned || '', improve: data.improve || '' })
      } else {
        setJournal({ notes: '', learned: '', improve: '' })
      }
      setLastSaved(null)
    } catch {
      setJournal({ notes: '', learned: '', improve: '' })
    } finally {
      setLoading(false)
    }
  }, [user, day])

  useEffect(() => {
    loadJournal()
  }, [loadJournal])

  async function saveJournal(data) {
    if (!user) return
    setSaving(true)
    try {
      await supabase.from('journal_entries').upsert({
        user_id: user.id,
        date: day,
        notes: data.notes,
        learned: data.learned,
        improve: data.improve,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,date' })
      setLastSaved(new Date())
    } catch (err) {
      console.error('Journal save error:', err)
    } finally {
      setSaving(false)
    }
  }

  function handleChange(field, value) {
    const updated = { ...journal, [field]: value }
    setJournal(updated)

    // Debounced auto-save
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      saveJournal(updated)
    }, 1500)
  }

  function changeDay(delta) {
    const d = new Date(day + 'T00:00:00')
    d.setDate(d.getDate() + delta)
    setDay(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
  }

  const totalChars = (journal.notes + journal.learned + journal.improve).length

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto' }}>
      {/* Date nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => changeDay(-1)}
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: TEXT_MUTED, padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px' }}
          >←</button>
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            padding: '6px 16px',
            fontSize: '14px',
            color: TEXT_PRIMARY,
            fontWeight: '600',
          }}>
            {new Date(day + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <button
            onClick={() => changeDay(1)}
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: TEXT_MUTED, padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px' }}
          >→</button>
          <button
            onClick={() => setDay(todayStr())}
            style={{ background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)', color: CYAN, padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', fontWeight: '600' }}
          >Today</button>
        </div>

        {/* Save status */}
        <div style={{ marginLeft: 'auto', fontSize: '12px', color: TEXT_MUTED, display: 'flex', alignItems: 'center', gap: '6px' }}>
          {saving ? (
            <span style={{ color: CYAN }}>Saving...</span>
          ) : lastSaved ? (
            <span style={{ color: '#22c55e' }}>✓ Saved {lastSaved.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
          ) : null}
          {totalChars > 0 && (
            <span style={{ color: '#475569' }}>{totalChars} chars</span>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: TEXT_MUTED, fontSize: '14px' }}>
          Loading journal...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {sections.map(section => (
            <div key={section.key} style={{
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '14px',
              padding: '20px',
              transition: 'border-color 0.2s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <label style={{
                  fontSize: '13px',
                  fontWeight: '700',
                  color: TEXT_PRIMARY,
                  letterSpacing: '-0.2px',
                }}>
                  {section.label}
                </label>
                <span style={{ fontSize: '11px', color: '#475569' }}>
                  {journal[section.key].length} chars
                </span>
              </div>
              <textarea
                value={journal[section.key]}
                onChange={e => handleChange(section.key, e.target.value)}
                placeholder={section.placeholder}
                rows={5}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  resize: 'vertical',
                  color: TEXT_PRIMARY,
                  fontSize: '14px',
                  lineHeight: '1.7',
                  fontFamily: 'inherit',
                  caretColor: CYAN,
                  minHeight: '100px',
                }}
                onFocus={e => e.currentTarget.parentElement.style.borderColor = 'rgba(34,211,238,0.25)'}
                onBlur={e => e.currentTarget.parentElement.style.borderColor = 'rgba(255,255,255,0.08)'}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
