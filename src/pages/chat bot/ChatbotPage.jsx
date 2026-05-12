import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'

const QUICK_QUESTIONS = [
  { icon: '👶', text: 'Anak 2 tahun susah makan, gimana?' },
  { icon: '🍼', text: 'Menu MPASI bayi 6 bulan yang murah' },
  { icon: '🥩', text: 'Pengganti daging sapi yang murah' },
  { icon: '⚠️', text: 'Tanda anak kekurangan zat besi' },
]

export default function ChatbotPage() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => { initSession() }, [])
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function initSession() {
    setLoadingHistory(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoadingHistory(false); return }

    // Cek apakah sudah ada session hari ini
    const today = new Date().toISOString().split('T')[0]
    const { data: existingSession } = await supabase
      .from('ai_chat_sessions')
      .select('id')
      .eq('user_id', user.id)
      .gte('created_at', today)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    let sid
    if (existingSession) {
      // Pakai session lama
      sid = existingSession.id
    } else {
      // Buat session baru
      const { data: newSession } = await supabase
        .from('ai_chat_sessions')
        .insert({ user_id: user.id })
        .select()
        .single()
      sid = newSession?.id
    }

    setSessionId(sid)

    // Load history pesan dari session ini
    if (sid) {
      const { data: history } = await supabase
        .from('ai_chat_messages')
        .select('role, content')
        .eq('session_id', sid)
        .order('created_at', { ascending: true })

      if (history && history.length > 0) {
        setMessages(history)
      } else {
        // Pesan sambutan hanya kalau belum ada history
        setMessages([{
          role: 'assistant',
          content: 'Halo! Saya asisten gizi LUMBUNG 🌾\n\nSilakan tanya apa saja soal gizi anak dan keluarga. Saya siap bantu dengan saran berbasis bahan lokal Indonesia yang terjangkau!'
        }])
      }
    }
    setLoadingHistory(false)
  }

  async function sendMessage(text) {
    const msgText = text || input
    if (!msgText.trim() || loading) return

    const userMsg = { role: 'user', content: msgText }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const { data, error } = await supabase.functions.invoke('chat-nutrisi', {
        body: {
          messages: newMessages.filter(m => m.role !== 'system'),
          session_id: sessionId
        }
      })
      if (error) throw error
      setMessages([...newMessages, { role: 'assistant', content: data.reply }])
    } catch (err) {
      console.error('Chat error:', err)
      setMessages([...newMessages, {
        role: 'assistant',
        content: 'Maaf, terjadi kesalahan. Coba lagi ya! 🙏'
      }])
    }
    setLoading(false)
  }

  const showQuickQuestions = messages.length <= 1 && 
    messages[0]?.role === 'assistant'

  if (loadingHistory) return (
    <div className="flex items-center justify-center py-12">
      <div className="flex gap-1">
        {[0,150,300].map(d => (
          <span key={d} className="w-2 h-2 bg-[#2D6A4F] rounded-full animate-bounce"
            style={{ animationDelay: `${d}ms` }} />
        ))}
      </div>
    </div>
  )

  return (
    <div>
      <div className="bg-[#f0faf4] rounded-2xl p-3 mb-4 flex items-start gap-3 border border-[#b7e4cc]">
        <span className="text-xl">🤖</span>
        <div>
          <p className="text-xs font-semibold text-[#2D6A4F]">AI Ahli Gizi Indonesia</p>
          <p className="text-xs text-[#5a7a6a] mt-0.5 leading-relaxed">
            Riwayat chat tersimpan otomatis setiap hari.
          </p>
        </div>
      </div>

      <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-[#2D6A4F] flex items-center justify-center text-sm mr-2 flex-shrink-0 mt-1">
                🌾
              </div>
            )}
            <div className={`max-w-xs rounded-2xl px-4 py-3 text-sm whitespace-pre-line leading-relaxed ${
              msg.role === 'user'
                ? 'bg-[#2D6A4F] text-white rounded-br-sm'
                : 'bg-[#f5f3ee] text-[#1a3a2a] rounded-bl-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-[#2D6A4F] flex items-center justify-center text-sm mr-2">🌾</div>
            <div className="bg-[#f5f3ee] rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                {[0,150,300].map(d => (
                  <span key={d} className="w-2 h-2 bg-[#2D6A4F] rounded-full animate-bounce"
                    style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {showQuickQuestions && (
        <div className="mb-4">
          <p className="text-xs font-medium text-[#9a9a8a] mb-2">Pertanyaan populer:</p>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_QUESTIONS.map(q => (
              <button key={q.text} onClick={() => sendMessage(q.text)}
                className="flex items-start gap-2 text-left text-xs border border-[#e8e4db] bg-[#faf9f7] text-[#4a4a3a] rounded-xl px-3 py-2.5 hover:bg-[#f0faf4] hover:border-[#b7e4cc] transition-all">
                <span>{q.icon}</span><span>{q.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-3 border-t border-[#f0ece4]">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Tanya soal gizi anak..."
          disabled={loading}
          className="flex-1 border border-[#e8e4db] rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] disabled:bg-[#f5f3ee] transition-all"
        />
        <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
          className="bg-[#2D6A4F] hover:bg-[#235c43] text-white px-4 py-2.5 rounded-2xl text-sm font-semibold disabled:opacity-40 transition-all">
          <svg className="w-4 h-4 fill-white rotate-90" viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    </div>
  )
}