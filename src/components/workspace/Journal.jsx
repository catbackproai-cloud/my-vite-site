import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

const CYAN = '#22d3ee'
const TEXT_PRIMARY = '#f1f5f9'
const TEXT_MUTED = '#94a3b8'
const TEXT_DIM = '#475569'

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const SESSION_OPTIONS = ['Pre-Market', 'London', 'London/NY Overlap', 'New York AM', 'New York PM', 'Asia', 'Other']
const SETUP_OPTIONS = ['Pullback', 'Breakout', 'Reversal', 'Order Block', 'FVG', 'Supply/Demand', 'Support/Resistance', 'Trend Continuation', 'Range', 'Other']

const TEXT_SECTIONS = [
  { key: 'notes',   label: "Today's Notes",    placeholder: "What happened today? Walk through your trades, observations, and any notable moments..." },
  { key: 'learned', label: "What I Learned",   placeholder: "New insights, patterns, or lessons from today's session..." },
  { key: 'improve', label: "What to Improve",  placeholder: "What will you work on tomorrow? Habits, rules, mindset areas..." },
]

function Checkbox({ checked, onChange, label, desc }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        background: checked ? 'rgba(34,211,238,0.06)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${checked ? 'rgba(34,211,238,0.25)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: '9px',
        padding: '10px 12px',
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
        transition: 'all 0.15s ease',
        fontFamily: 'inherit',
      }}
    >
      <div style={{
        width: '16px',
        height: '16px',
        borderRadius: '4px',
        border: `1.5px solid ${checked ? CYAN : 'rgba(255,255,255,0.2)'}`,
        background: checked ? 'rgba(34,211,238,0.2)' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        marginTop: '1px',
        transition: 'all 0.15s ease',
        boxShadow: checked ? '0 0 8px rgba(34,211,238,0.2)' : 'none',
      }}>
        {checked && (
          <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
            <path d="M1 3.5L3.5 6L8 1" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      <div>
        <div style={{ fontSize: '13px', fontWeight: '500', color: checked ? TEXT_PRIMARY : TEXT_MUTED, lineHeight: 1.2 }}>{label}</div>
        {desc && <div style={{ fontSize: '11px', color: TEXT_DIM, marginTop: '2px', lineHeight: 1.3 }}>{desc}</div>}
      </div>
    </button>
  )
}

function SelectField({ value, onChange, options, placeholder }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '8px',
        color: value ? TEXT_PRIMARY : TEXT_DIM,
        fontSize: '13px',
        padding: '8px 12px',
        fontFamily: 'inherit',
        outline: 'none',
        cursor: 'pointer',
        width: '100%',
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2364748b' stroke-width='1.5' stroke-linecap='round' fill='none'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 10px center',
        paddingRight: '32px',
      }}
    >
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

export default function Journal() {
  const { user, profile } = useAuth()
  const [day, setDay] = useState(todayStr())
  const [journal, setJournal] = useState({
    notes: '', learned: '', improve: '',
    session: '', setup_type: '',
    rule_violated: false, violated_rule: '',
    confluences_met: [],
  })
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  const [loading, setLoading] = useState(false)
  const saveTimerRef = useRef(null)

  // Confluences defined by user in their Daily Plan settings
  const userConfluences = profile?.confluences || []

  const loadJournal = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', day)
        .single()

      if (data) {
        setJournal({
          notes: data.notes || '',
          learned: data.learned || '',
          improve: data.improve || '',
          session: data.session || '',
          setup_type: data.setup_type || '',
          rule_violated: data.rule_violated || false,
          violated_rule: data.violated_rule || '',
          confluences_met: data.confluences_met || [],
        })
      } else {
        setJournal({ notes: '', learned: '', improve: '', session: '', setup_type: '', rule_violated: false, violated_rule: '', confluences_met: [] })
      }
      setLastSaved(null)
    } catch {
      setJournal({ notes: '', learned: '', improve: '', session: '', setup_type: '', rule_violated: false, violated_rule: '', confluences_met: [] })
    } finally {
      setLoading(false)
    }
  }, [user, day])

  useEffect(() => { loadJournal() }, [loadJournal])

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
        session: data.session,
        setup_type: data.setup_type,
        rule_violated: data.rule_violated,
        violated_rule: data.violated_rule,
        confluences_met: data.confluences_met,
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
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => saveJournal(updated), 1200)
  }

  function toggleConfluence(name) {
    const current = journal.confluences_met || []
    const updated = current.includes(name)
      ? current.filter(c => c !== name)
      : [...current, name]
    handleChange('confluences_met', updated)
  }

  function changeDay(delta) {
    const d = new Date(day + 'T00:00:00')
    d.setDate(d.getDate() + delta)
    setDay(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
  }

  const confluenceCount = (journal.confluences_met || []).length
  const totalChars = (journal.notes + journal.learned + journal.improve).length

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto' }} className="fade-in">
      {/* Date nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => changeDay(-1)}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: TEXT_MUTED, padding: '6px 12px', borderRadius: '7px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px', transition: 'all 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          >←</button>
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: '8px',
            padding: '6px 16px',
            fontSize: '14px',
            color: TEXT_PRIMARY,
            fontWeight: '600',
            letterSpacing: '-0.2px',
          }}>
            {new Date(day + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <button
            onClick={() => changeDay(1)}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: TEXT_MUTED, padding: '6px 12px', borderRadius: '7px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px', transition: 'all 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          >→</button>
          <button
            onClick={() => setDay(todayStr())}
            style={{ background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)', color: CYAN, padding: '6px 12px', borderRadius: '7px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', fontWeight: '600', transition: 'all 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,211,238,0.14)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(34,211,238,0.08)'}
          >Today</button>
        </div>

        <div style={{ marginLeft: 'auto', fontSize: '12px', color: TEXT_MUTED, display: 'flex', alignItems: 'center', gap: '8px' }}>
          {saving ? (
            <span style={{ color: CYAN, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', border: '1.5px solid #22d3ee', borderTopColor: 'transparent', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
              Saving
            </span>
          ) : lastSaved ? (
            <span style={{ color: '#22c55e' }}>✓ Saved {lastSaved.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
          ) : null}
          {totalChars > 0 && <span style={{ color: TEXT_DIM }}>{totalChars} chars</span>}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[180, 140, 140].map((h, i) => (
            <div key={i} className="shimmer" style={{ borderRadius: '14px', height: `${h}px` }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* ── Trade Metrics ── */}
          <div style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '14px',
            padding: '20px',
          }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: TEXT_MUTED, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '16px' }}>
              Trade Metrics
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '11px', color: TEXT_DIM, display: 'block', marginBottom: '6px', fontWeight: '500' }}>Session</label>
                <SelectField value={journal.session} onChange={v => handleChange('session', v)} options={SESSION_OPTIONS} placeholder="Which session?" />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: TEXT_DIM, display: 'block', marginBottom: '6px', fontWeight: '500' }}>Setup Type</label>
                <SelectField value={journal.setup_type} onChange={v => handleChange('setup_type', v)} options={SETUP_OPTIONS} placeholder="What was the setup?" />
              </div>
            </div>

            {/* Dynamic Confluence checklist */}
            <div style={{ marginBottom: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <label style={{ fontSize: '11px', color: TEXT_DIM, fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Confluence</label>
                {userConfluences.length > 0 && (
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: confluenceCount >= Math.ceil(userConfluences.length * 0.75) ? '#22c55e' : confluenceCount >= Math.ceil(userConfluences.length * 0.5) ? CYAN : TEXT_DIM,
                    background: confluenceCount >= Math.ceil(userConfluences.length * 0.75) ? 'rgba(34,197,94,0.1)' : confluenceCount >= Math.ceil(userConfluences.length * 0.5) ? 'rgba(34,211,238,0.1)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${confluenceCount >= Math.ceil(userConfluences.length * 0.75) ? 'rgba(34,197,94,0.25)' : confluenceCount >= Math.ceil(userConfluences.length * 0.5) ? 'rgba(34,211,238,0.25)' : 'rgba(255,255,255,0.08)'}`,
                    padding: '2px 8px',
                    borderRadius: '20px',
                  }}>
                    {confluenceCount}/{userConfluences.length}
                  </span>
                )}
              </div>
              {userConfluences.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {userConfluences.map(name => (
                    <Checkbox
                      key={name}
                      checked={(journal.confluences_met || []).includes(name)}
                      onChange={() => toggleConfluence(name)}
                      label={name}
                    />
                  ))}
                </div>
              ) : (
                <div style={{
                  padding: '14px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px dashed rgba(255,255,255,0.1)',
                  borderRadius: '9px',
                  fontSize: '12px',
                  color: TEXT_DIM,
                  textAlign: 'center',
                }}>
                  No confluences set — add them in{' '}
                  <span style={{ color: CYAN, fontWeight: '500' }}>Daily Plan → My Confluences</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Rule Violation ── */}
          <div style={{
            background: journal.rule_violated ? 'rgba(239,68,68,0.04)' : 'rgba(255,255,255,0.025)',
            border: `1px solid ${journal.rule_violated ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: '14px',
            padding: '20px',
            transition: 'all 0.2s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: journal.rule_violated ? '14px' : '0' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: journal.rule_violated ? '#fca5a5' : TEXT_MUTED }}>Rule Violated Today?</div>
                <div style={{ fontSize: '11px', color: TEXT_DIM, marginTop: '2px' }}>Accountability — be honest</div>
              </div>
              {/* Toggle */}
              <button
                type="button"
                onClick={() => handleChange('rule_violated', !journal.rule_violated)}
                style={{
                  width: '42px',
                  height: '24px',
                  borderRadius: '12px',
                  border: 'none',
                  background: journal.rule_violated ? 'rgba(239,68,68,0.7)' : 'rgba(255,255,255,0.1)',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background 0.2s ease',
                  flexShrink: 0,
                }}
              >
                <div style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: 'white',
                  position: 'absolute',
                  top: '3px',
                  left: journal.rule_violated ? '21px' : '3px',
                  transition: 'left 0.2s ease',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                }} />
              </button>
            </div>
            {journal.rule_violated && (
              <input
                type="text"
                value={journal.violated_rule}
                onChange={e => handleChange('violated_rule', e.target.value)}
                placeholder="Which rule? Be specific — 'Moved stop', 'Entered early', 'Traded outside session'..."
                style={{
                  width: '100%',
                  background: 'rgba(239,68,68,0.06)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: '8px',
                  color: TEXT_PRIMARY,
                  fontSize: '13px',
                  padding: '10px 12px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  caretColor: '#ef4444',
                }}
                onFocus={e => e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)'}
              />
            )}
          </div>

          {/* ── Text Sections ── */}
          {TEXT_SECTIONS.map(section => (
            <div key={section.key} style={{
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '14px',
              padding: '20px',
              transition: 'border-color 0.2s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: TEXT_PRIMARY, letterSpacing: '-0.2px' }}>
                  {section.label}
                </label>
                <span style={{ fontSize: '11px', color: TEXT_DIM }}>{journal[section.key].length} chars</span>
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
