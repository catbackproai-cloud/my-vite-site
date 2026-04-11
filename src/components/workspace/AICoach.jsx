import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

const CYAN = '#22d3ee'
const BG_MID = '#030817'
const BG_TOP = '#07101f'
const TEXT_PRIMARY = '#f1f5f9'
const TEXT_MUTED = '#94a3b8'

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function renderContent(text) {
  if (!text) return null
  const lines = text.split('\n')
  return lines.map((line, i) => {
    const bold = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    return (
      <span key={i}>
        <span dangerouslySetInnerHTML={{ __html: bold }} />
        {i < lines.length - 1 && <br />}
      </span>
    )
  })
}

export default function AICoach() {
  const { user, profile } = useAuth()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [imageFiles, setImageFiles] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [sending, setSending] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [tradingPlan, setTradingPlan] = useState('')
  const [editingPlan, setEditingPlan] = useState('')
  const [savingPlan, setSavingPlan] = useState(false)

  const [recentJournal, setRecentJournal] = useState([])
  const [recapLoading, setRecapLoading] = useState(false)

  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const textareaRef = useRef(null)

  // Load conversation history + trading plan + journal entries
  useEffect(() => {
    if (!user) return
    loadHistory()
    loadJournal()
    setTradingPlan(profile?.trading_plan || '')
  }, [user, profile])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  async function loadJournal() {
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
    const { data } = await supabase
      .from('journal_entries')
      .select('date, notes, learned, improve')
      .eq('user_id', user.id)
      .gte('date', fourteenDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: false })
      .limit(14)
    if (data) setRecentJournal(data)
  }

  async function loadHistory() {
    setLoadingHistory(true)
    try {
      const { data } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(100)

      if (data) setMessages(data.map(m => ({ ...m, fromDb: true })))
    } finally {
      setLoadingHistory(false)
    }
  }

  async function saveMessage(role, content, hasImage = false) {
    if (!user) return
    const { data } = await supabase.from('ai_messages').insert({
      user_id: user.id,
      role,
      content,
      has_image: hasImage,
    }).select().single()
    return data
  }

  async function handleSend() {
    const text = input.trim()
    if (!text && imageFiles.length === 0) return
    if (sending) return

    setSending(true)

    const hasImage = imageFiles.length > 0
    const localPreviews = [...imagePreviews]

    const images = await Promise.all(
      imageFiles.map(async f => ({ base64: await fileToBase64(f), mimeType: f.type }))
    )

    // Add user message to UI immediately
    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: text || '',
      has_image: hasImage,
      localPreviews,
      pending: false,
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setImageFiles([])
    setImagePreviews([])

    // Save user message to DB
    await saveMessage('user', text || '', hasImage)

    // Build history for Claude (text only, last 30 messages)
    const history = [...messages, userMsg]
      .filter(m => !m.pending)
      .slice(-30)
      .map(m => ({ role: m.role, content: m.content || '' }))

    // Add typing indicator
    const typingId = Date.now() + 1
    setMessages(prev => [...prev, { id: typingId, role: 'assistant', pending: true }])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          tradingPlan,
          recentJournal,
          images,
          currentText: text,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to get response')

      const aiContent = data.content

      // Replace typing indicator with real response
      setMessages(prev => prev.filter(m => m.id !== typingId).concat({
        id: Date.now() + 2,
        role: 'assistant',
        content: aiContent,
        pending: false,
      }))

      // Save AI response to DB
      await saveMessage('assistant', aiContent)

    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== typingId).concat({
        id: Date.now() + 2,
        role: 'assistant',
        content: `Sorry, something went wrong: ${err.message}`,
        pending: false,
        isError: true,
      }))
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

  function addFiles(files) {
    const imgs = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (!imgs.length) return
    const tooBig = imgs.filter(f => f.size > MAX_FILE_SIZE)
    if (tooBig.length) {
      alert(`${tooBig.map(f => f.name).join(', ')} ${tooBig.length > 1 ? 'are' : 'is'} over 5MB. Please use a smaller image.`)
    }
    const valid = imgs.filter(f => f.size <= MAX_FILE_SIZE)
    if (!valid.length) return
    setImageFiles(prev => [...prev, ...valid])
    setImagePreviews(prev => [...prev, ...valid.map(f => URL.createObjectURL(f))])
  }

  function handleFileChange(e) {
    addFiles(e.target.files)
    e.target.value = ''
  }

  function handleDrop(e) {
    e.preventDefault()
    addFiles(e.dataTransfer.files)
  }

  function handlePaste(e) {
    const items = Array.from(e.clipboardData?.items || [])
    const imageItems = items.filter(i => i.type.startsWith('image/'))
    if (!imageItems.length) return
    addFiles(imageItems.map(i => i.getAsFile()))
  }

  function removeImage(index) {
    setImageFiles(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  async function savePlan() {
    setSavingPlan(true)
    try {
      await supabase.from('profiles').update({ trading_plan: editingPlan }).eq('id', user.id)
      setTradingPlan(editingPlan)
      setShowPlanModal(false)
    } finally {
      setSavingPlan(false)
    }
  }

  function openPlanModal() {
    setEditingPlan(tradingPlan)
    setShowPlanModal(true)
  }

  async function handleWeeklyRecap() {
    if (recapLoading || sending) return
    setRecapLoading(true)
    const typingId = Date.now()
    setMessages(prev => [...prev, { id: typingId, role: 'assistant', pending: true }])
    try {
      const res = await fetch('/api/weekly-recap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, tradingPlan }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate recap')
      const content = data.recap
      setMessages(prev => prev.filter(m => m.id !== typingId).concat({
        id: Date.now() + 1,
        role: 'assistant',
        content,
        pending: false,
      }))
      await saveMessage('assistant', content)
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== typingId).concat({
        id: Date.now() + 1,
        role: 'assistant',
        content: `Sorry, couldn't generate recap: ${err.message}`,
        pending: false,
        isError: true,
      }))
    } finally {
      setRecapLoading(false)
    }
  }

  const canSend = (input.trim() || imageFiles.length > 0) && !sending

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>

      {/* Header bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 0 16px 0',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        marginBottom: '0',
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: '13px', color: TEXT_MUTED, marginTop: '2px' }}>
            {tradingPlan
              ? 'Your trading plan is active — AI is adapting to your style'
              : 'Set your trading plan so the AI can adapt to your style'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleWeeklyRecap}
            disabled={recapLoading || sending}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: recapLoading ? '#64748b' : '#94a3b8',
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: recapLoading ? 'default' : 'pointer',
              fontFamily: 'inherit',
              whiteSpace: 'nowrap',
            }}
          >
            {recapLoading ? 'Generating...' : '📊 Weekly Recap'}
          </button>
          <button
            onClick={openPlanModal}
            style={{
              background: tradingPlan ? 'rgba(34,211,238,0.08)' : 'rgba(34,211,238,0.15)',
              border: `1px solid ${tradingPlan ? 'rgba(34,211,238,0.2)' : 'rgba(34,211,238,0.4)'}`,
              color: CYAN,
              padding: '7px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              fontFamily: 'inherit',
              whiteSpace: 'nowrap',
            }}
          >
            {tradingPlan ? 'Edit Trading Plan' : '+ Set Trading Plan'}
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {loadingHistory ? (
          <div style={{ textAlign: 'center', color: TEXT_MUTED, fontSize: '13px', paddingTop: '40px' }}>
            Loading conversation...
          </div>
        ) : messages.length === 0 ? (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            paddingTop: '60px',
          }}>
            <div style={{ fontSize: '36px' }}>📈</div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: TEXT_PRIMARY }}>
              Your AI Trading Coach
            </div>
            <div style={{ fontSize: '13px', color: TEXT_MUTED, textAlign: 'center', maxWidth: '380px', lineHeight: '1.6' }}>
              Ask anything, share your chart screenshots for analysis, or describe a trade.
              {!tradingPlan && (
                <span style={{ color: CYAN }}> Set your trading plan above so the AI learns your style.</span>
              )}
            </div>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              justifyContent: 'center',
              marginTop: '8px',
            }}>
              {[
                'Review my trading plan',
                'Why do I keep breaking my rules?',
                'How do I manage FOMO better?',
              ].map(prompt => (
                <button
                  key={prompt}
                  onClick={() => { setInput(prompt); textareaRef.current?.focus() }}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: TEXT_MUTED,
                    padding: '7px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                alignItems: 'flex-end',
                gap: '10px',
                padding: '0 4px',
              }}
            >
              {/* Avatar */}
              {msg.role === 'assistant' && (
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #22d3ee, #3b82f6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  flexShrink: 0,
                }}>
                  📈
                </div>
              )}

              {/* Bubble */}
              <div style={{
                maxWidth: '72%',
                background: msg.role === 'user'
                  ? 'rgba(34,211,238,0.12)'
                  : 'rgba(255,255,255,0.04)',
                border: msg.role === 'user'
                  ? '1px solid rgba(34,211,238,0.25)'
                  : '1px solid rgba(255,255,255,0.08)',
                borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                padding: msg.pending ? '12px 18px' : '12px 16px',
                color: msg.isError ? '#fca5a5' : TEXT_PRIMARY,
              }}>
                {msg.pending ? (
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center', height: '16px' }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: CYAN,
                        opacity: 0.6,
                        animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                      }} />
                    ))}
                  </div>
                ) : (
                  <>
                    {msg.localPreviews?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                        {msg.localPreviews.map((src, i) => (
                          <img key={i} src={src} alt="chart"
                            style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', display: 'block' }}
                          />
                        ))}
                      </div>
                    )}
                    {msg.has_image && !msg.localPreviews?.length && !msg.content && (
                      <div style={{ fontSize: '12px', color: TEXT_MUTED, fontStyle: 'italic', marginBottom: '4px' }}>
                        📎 Chart image
                      </div>
                    )}
                    {msg.has_image && !msg.localPreviews?.length && msg.content && (
                      <div style={{ fontSize: '12px', color: TEXT_MUTED, marginBottom: '6px' }}>📎 Chart attached</div>
                    )}
                    <div style={{ fontSize: '14px', lineHeight: '1.65', whiteSpace: 'pre-wrap' }}>
                      {renderContent(msg.content)}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Image previews */}
      {imagePreviews.length > 0 && (
        <div style={{
          padding: '8px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexShrink: 0,
          flexWrap: 'wrap',
        }}>
          {imagePreviews.map((src, i) => (
            <div key={i} style={{ position: 'relative', display: 'inline-block' }}>
              <img
                src={src}
                alt="preview"
                style={{ height: '60px', borderRadius: '8px', border: '1px solid rgba(34,211,238,0.3)' }}
              />
              <button
                onClick={() => removeImage(i)}
                style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-6px',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: '#ef4444',
                  border: 'none',
                  color: '#fff',
                  fontSize: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'inherit',
                }}
              >✕</button>
            </div>
          ))}
          <span style={{ fontSize: '12px', color: TEXT_MUTED }}>
            {imagePreviews.length} chart{imagePreviews.length > 1 ? 's' : ''} ready to send
          </span>
        </div>
      )}

      {/* Input area */}
      <div style={{
        flexShrink: 0,
        borderTop: '1px solid rgba(255,255,255,0.06)',
        paddingTop: '12px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '8px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '14px',
          padding: '8px 8px 8px 14px',
          transition: 'border-color 0.2s',
        }}
          onFocus={() => {}}
        >
          {/* Attach image button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Attach chart screenshot"
            style={{
              background: 'none',
              border: 'none',
              color: imageFiles.length > 0 ? CYAN : TEXT_MUTED,
              cursor: 'pointer',
              padding: '4px',
              fontSize: '18px',
              lineHeight: 1,
              flexShrink: 0,
              marginBottom: '2px',
            }}
          >
            📎
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          {/* Text input */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => {
              setInput(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px'
            }}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="Ask your coach anything, or drop a chart screenshot..."
            rows={1}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: TEXT_PRIMARY,
              fontSize: '14px',
              lineHeight: '1.5',
              resize: 'none',
              fontFamily: 'inherit',
              caretColor: CYAN,
              overflowY: 'auto',
              maxHeight: '140px',
            }}
          />

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!canSend}
            style={{
              background: canSend ? CYAN : 'rgba(255,255,255,0.06)',
              border: 'none',
              color: canSend ? '#020617' : '#475569',
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              cursor: canSend ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              flexShrink: 0,
              transition: 'all 0.15s',
              fontFamily: 'inherit',
            }}
          >
            ↑
          </button>
        </div>
        <div style={{ fontSize: '11px', color: '#334155', textAlign: 'center', marginTop: '6px' }}>
          Enter to send · Shift+Enter for new line · Drag & drop charts
        </div>
      </div>

      {/* Trading Plan Modal */}
      {showPlanModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '24px',
        }}
          onClick={e => { if (e.target === e.currentTarget) setShowPlanModal(false) }}
        >
          <div style={{
            background: '#0f172a',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '20px',
            padding: '32px',
            width: '100%',
            maxWidth: '560px',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: TEXT_PRIMARY, margin: 0 }}>
                Your Trading Plan
              </h2>
              <p style={{ fontSize: '13px', color: TEXT_MUTED, marginTop: '6px' }}>
                Write your strategy, entry rules, risk management, and any rules you want the AI to hold you accountable to.
              </p>
            </div>

            <textarea
              value={editingPlan}
              onChange={e => setEditingPlan(e.target.value)}
              placeholder={`Example:\n- I trade NQ and ES futures only\n- Entry only at key S/R levels with confluence\n- Max 2 trades per day\n- Stop loss always set before entry\n- No trading after 11am EST\n- Risk max 1% per trade\n- No revenge trading after a loss`}
              style={{
                flex: 1,
                minHeight: '240px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: '14px',
                color: TEXT_PRIMARY,
                fontSize: '14px',
                lineHeight: '1.7',
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'inherit',
                caretColor: CYAN,
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(34,211,238,0.3)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowPlanModal(false)}
                style={{
                  background: 'none',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: TEXT_MUTED,
                  padding: '10px 20px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '14px',
                }}
              >
                Cancel
              </button>
              <button
                onClick={savePlan}
                disabled={savingPlan}
                style={{
                  background: CYAN,
                  border: 'none',
                  color: '#020617',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  cursor: savingPlan ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '14px',
                  fontWeight: '700',
                  opacity: savingPlan ? 0.7 : 1,
                }}
              >
                {savingPlan ? 'Saving...' : 'Save Plan'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
    </div>
  )
}
