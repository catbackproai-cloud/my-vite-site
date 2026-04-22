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

const BIAS_OPTIONS = [
  { value: 'bullish', label: 'Bullish', emoji: '↑', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)' },
  { value: 'bearish', label: 'Bearish', emoji: '↓', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)' },
  { value: 'neutral', label: 'Neutral', emoji: '→', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' },
]

const SESSION_CHECKBOXES = [
  { key: 'london',   label: 'London',             desc: '3:00 – 11:00 AM UTC' },
  { key: 'new_york', label: 'New York',            desc: '1:00 – 9:00 PM UTC' },
  { key: 'overlap',  label: 'London/NY Overlap',   desc: '1:00 – 4:00 PM UTC' },
  { key: 'asia',     label: 'Asia',                desc: '12:00 – 9:00 AM UTC' },
]

function CheckToggle({ checked, onChange, label, desc }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: checked ? 'rgba(34,211,238,0.07)' : 'rgba(255,255,255,0.02)',
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
        border: `1.5px solid ${checked ? CYAN : 'rgba(255,255,255,0.18)'}`,
        background: checked ? 'rgba(34,211,238,0.2)' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
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
        <div style={{ fontSize: '13px', fontWeight: '500', color: checked ? TEXT_PRIMARY : TEXT_MUTED }}>{label}</div>
        {desc && <div style={{ fontSize: '11px', color: TEXT_DIM, marginTop: '1px' }}>{desc}</div>}
      </div>
    </button>
  )
}

// ── My Confluences Manager ──────────────────────────────────
function ConfluenceManager({ confluences, onSave }) {
  const [items, setItems] = useState(confluences || [])
  const [input, setInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const { user } = useAuth()

  useEffect(() => { setItems(confluences || []) }, [confluences])

  function addItem() {
    const trimmed = input.trim()
    if (!trimmed || items.includes(trimmed)) { setInput(''); return }
    const updated = [...items, trimmed]
    setItems(updated)
    setInput('')
    persist(updated)
  }

  function removeItem(name) {
    const updated = items.filter(i => i !== name)
    setItems(updated)
    persist(updated)
  }

  async function persist(updated) {
    if (!user) return
    setSaving(true)
    setSaved(false)
    try {
      await supabase.from('profiles').update({ confluences: updated }).eq('id', user.id)
      onSave(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error('Confluence save error:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.025)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '14px',
      padding: '20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: '700', color: TEXT_PRIMARY }}>My Confluences</div>
          <div style={{ fontSize: '11px', color: TEXT_DIM, marginTop: '2px' }}>
            Define the factors you look for in a valid setup — these appear as checkboxes in your journal
          </div>
        </div>
        {saving && (
          <span style={{ fontSize: '11px', color: CYAN, display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', border: '1.5px solid #22d3ee', borderTopColor: 'transparent', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
            Saving
          </span>
        )}
        {saved && !saving && <span style={{ fontSize: '11px', color: '#22c55e' }}>✓ Saved</span>}
      </div>

      {/* Current items */}
      {items.length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', margin: '14px 0' }}>
          {items.map(name => (
            <div key={name} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(34,211,238,0.08)',
              border: '1px solid rgba(34,211,238,0.2)',
              borderRadius: '20px',
              padding: '5px 10px 5px 12px',
              fontSize: '12px',
              fontWeight: '500',
              color: CYAN,
            }}>
              {name}
              <button
                type="button"
                onClick={() => removeItem(name)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'rgba(34,211,238,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0',
                  lineHeight: 1,
                  fontSize: '14px',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(34,211,238,0.5)'}
              >×</button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: '12px', color: TEXT_DIM, margin: '14px 0', fontStyle: 'italic' }}>
          No confluences added yet — add your first one below
        </div>
      )}

      {/* Add input */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addItem()}
          placeholder="e.g. HTF Aligned, FVG Present, Order Block, Liquidity Swept..."
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            color: TEXT_PRIMARY,
            fontSize: '13px',
            padding: '8px 12px',
            fontFamily: 'inherit',
            outline: 'none',
            caretColor: CYAN,
          }}
          onFocus={e => e.currentTarget.style.borderColor = 'rgba(34,211,238,0.3)'}
          onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
        />
        <button
          type="button"
          onClick={addItem}
          disabled={!input.trim()}
          style={{
            background: 'rgba(34,211,238,0.1)',
            border: '1px solid rgba(34,211,238,0.25)',
            color: CYAN,
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'all 0.15s',
            opacity: input.trim() ? 1 : 0.4,
          }}
        >
          Add
        </button>
      </div>
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────
export default function DailyPlan() {
  const { user, profile, refreshProfile } = useAuth()
  const [day, setDay] = useState(todayStr())
  const [plan, setPlan] = useState({
    bias: '',
    draw_on_liquidity: '',
    sessions: { london: false, new_york: false, overlap: false, asia: false },
    setup_looking_for: '',
    key_levels: '',
    mindset_intention: '',
  })
  const [confluences, setConfluences] = useState([])
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  const [loading, setLoading] = useState(false)
  const saveTimerRef = useRef(null)

  // Load confluences from profile
  useEffect(() => {
    setConfluences(profile?.confluences || [])
  }, [profile])

  const loadPlan = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data } = await supabase
        .from('daily_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', day)
        .single()

      if (data) {
        setPlan({
          bias: data.bias || '',
          draw_on_liquidity: data.draw_on_liquidity || '',
          sessions: data.sessions || { london: false, new_york: false, overlap: false, asia: false },
          setup_looking_for: data.setup_looking_for || '',
          key_levels: data.key_levels || '',
          mindset_intention: data.mindset_intention || '',
        })
      } else {
        setPlan({ bias: '', draw_on_liquidity: '', sessions: { london: false, new_york: false, overlap: false, asia: false }, setup_looking_for: '', key_levels: '', mindset_intention: '' })
      }
      setLastSaved(null)
    } catch {
      setPlan({ bias: '', draw_on_liquidity: '', sessions: { london: false, new_york: false, overlap: false, asia: false }, setup_looking_for: '', key_levels: '', mindset_intention: '' })
    } finally {
      setLoading(false)
    }
  }, [user, day])

  useEffect(() => { loadPlan() }, [loadPlan])

  async function savePlan(data) {
    if (!user) return
    setSaving(true)
    try {
      await supabase.from('daily_plans').upsert({
        user_id: user.id,
        date: day,
        bias: data.bias,
        draw_on_liquidity: data.draw_on_liquidity,
        sessions: data.sessions,
        setup_looking_for: data.setup_looking_for,
        key_levels: data.key_levels,
        mindset_intention: data.mindset_intention,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,date' })
      setLastSaved(new Date())
    } catch (err) {
      console.error('DailyPlan save error:', err)
    } finally {
      setSaving(false)
    }
  }

  function handleChange(field, value) {
    const updated = { ...plan, [field]: value }
    setPlan(updated)
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => savePlan(updated), 1000)
  }

  function changeDay(delta) {
    const d = new Date(day + 'T00:00:00')
    d.setDate(d.getDate() + delta)
    setDay(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
  }

  const selectedBias = BIAS_OPTIONS.find(b => b.value === plan.bias)

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }} className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '18px', fontWeight: '700', color: TEXT_PRIMARY, letterSpacing: '-0.4px', marginBottom: '4px' }}>
          Pre-Session Plan
        </div>
        <div style={{ fontSize: '13px', color: TEXT_DIM }}>Set your bias and game plan before the market opens</div>
      </div>

      {/* Date nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
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

        <div style={{ marginLeft: 'auto', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {saving ? (
            <span style={{ color: CYAN, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', border: '1.5px solid #22d3ee', borderTopColor: 'transparent', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
              Saving
            </span>
          ) : lastSaved ? (
            <span style={{ color: '#22c55e' }}>✓ Saved {lastSaved.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[120, 160, 140, 120].map((h, i) => (
            <div key={i} className="shimmer" style={{ borderRadius: '14px', height: `${h}px` }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* ── My Confluences ── */}
          <ConfluenceManager
            confluences={confluences}
            onSave={updated => {
              setConfluences(updated)
              refreshProfile(user.id)
            }}
          />

          {/* ── HTF Bias ── */}
          <div style={{
            background: selectedBias ? selectedBias.bg : 'rgba(255,255,255,0.025)',
            border: `1px solid ${selectedBias ? selectedBias.border : 'rgba(255,255,255,0.08)'}`,
            borderRadius: '14px',
            padding: '20px',
            transition: 'all 0.25s ease',
          }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: TEXT_DIM, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '14px' }}>
              HTF Bias
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {BIAS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleChange('bias', plan.bias === opt.value ? '' : opt.value)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '16px 12px',
                    borderRadius: '10px',
                    border: `1.5px solid ${plan.bias === opt.value ? opt.border : 'rgba(255,255,255,0.08)'}`,
                    background: plan.bias === opt.value ? opt.bg : 'rgba(255,255,255,0.02)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    fontFamily: 'inherit',
                    boxShadow: plan.bias === opt.value ? `0 0 16px ${opt.border}` : 'none',
                  }}
                  onMouseEnter={e => { if (plan.bias !== opt.value) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                  onMouseLeave={e => { if (plan.bias !== opt.value) e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
                >
                  <span style={{ fontSize: '22px', fontWeight: '700', color: plan.bias === opt.value ? opt.color : TEXT_DIM }}>
                    {opt.emoji}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: plan.bias === opt.value ? opt.color : TEXT_MUTED }}>
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Sessions & Draw ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Sessions */}
            <div style={{
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '14px',
              padding: '20px',
            }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: TEXT_DIM, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '12px' }}>
                Trading Sessions
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {SESSION_CHECKBOXES.map(s => (
                  <CheckToggle
                    key={s.key}
                    checked={plan.sessions[s.key]}
                    onChange={v => handleChange('sessions', { ...plan.sessions, [s.key]: v })}
                    label={s.label}
                    desc={s.desc}
                  />
                ))}
              </div>
            </div>

            {/* Draw + Key Levels */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '14px',
                padding: '20px',
                flex: 1,
              }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: TEXT_DIM, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>
                  Draw on Liquidity
                </label>
                <textarea
                  value={plan.draw_on_liquidity}
                  onChange={e => handleChange('draw_on_liquidity', e.target.value)}
                  placeholder="Where is price likely drawing to? HTF target, EQH/EQL, premium/discount levels..."
                  rows={3}
                  style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', resize: 'none', color: TEXT_PRIMARY, fontSize: '13px', lineHeight: '1.6', fontFamily: 'inherit', caretColor: CYAN }}
                  onFocus={e => e.currentTarget.parentElement.style.borderColor = 'rgba(34,211,238,0.25)'}
                  onBlur={e => e.currentTarget.parentElement.style.borderColor = 'rgba(255,255,255,0.08)'}
                />
              </div>

              <div style={{
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '14px',
                padding: '20px',
                flex: 1,
              }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: TEXT_DIM, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>
                  Key Levels
                </label>
                <textarea
                  value={plan.key_levels}
                  onChange={e => handleChange('key_levels', e.target.value)}
                  placeholder="Support, resistance, POIs, order blocks..."
                  rows={3}
                  style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', resize: 'none', color: TEXT_PRIMARY, fontSize: '13px', lineHeight: '1.6', fontFamily: 'inherit', caretColor: CYAN }}
                  onFocus={e => e.currentTarget.parentElement.style.borderColor = 'rgba(34,211,238,0.25)'}
                  onBlur={e => e.currentTarget.parentElement.style.borderColor = 'rgba(255,255,255,0.08)'}
                />
              </div>
            </div>
          </div>

          {/* ── Setup Looking For ── */}
          <div style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '14px',
            padding: '20px',
          }}>
            <label style={{ fontSize: '13px', fontWeight: '700', color: TEXT_PRIMARY, display: 'block', marginBottom: '12px' }}>
              Setup I'm Looking For
            </label>
            <textarea
              value={plan.setup_looking_for}
              onChange={e => handleChange('setup_looking_for', e.target.value)}
              placeholder="Describe the exact setup conditions: what structure you need, entry trigger, invalidation, target..."
              rows={4}
              style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', resize: 'vertical', color: TEXT_PRIMARY, fontSize: '14px', lineHeight: '1.7', fontFamily: 'inherit', caretColor: CYAN, minHeight: '90px' }}
              onFocus={e => e.currentTarget.parentElement.style.borderColor = 'rgba(34,211,238,0.25)'}
              onBlur={e => e.currentTarget.parentElement.style.borderColor = 'rgba(255,255,255,0.08)'}
            />
          </div>

          {/* ── Mindset Intention ── */}
          <div style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '14px',
            padding: '20px',
          }}>
            <label style={{ fontSize: '13px', fontWeight: '700', color: TEXT_PRIMARY, display: 'block', marginBottom: '4px' }}>
              Mindset & Intention
            </label>
            <div style={{ fontSize: '11px', color: TEXT_DIM, marginBottom: '12px' }}>One thing to stay focused on today</div>
            <textarea
              value={plan.mindset_intention}
              onChange={e => handleChange('mindset_intention', e.target.value)}
              placeholder="e.g. 'Wait for confirmation — no anticipation entries.' or 'If I lose 2 trades, I stop for the day.'"
              rows={3}
              style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', resize: 'vertical', color: TEXT_PRIMARY, fontSize: '14px', lineHeight: '1.7', fontFamily: 'inherit', caretColor: CYAN }}
              onFocus={e => e.currentTarget.parentElement.style.borderColor = 'rgba(34,211,238,0.25)'}
              onBlur={e => e.currentTarget.parentElement.style.borderColor = 'rgba(255,255,255,0.08)'}
            />
          </div>

        </div>
      )}
    </div>
  )
}
