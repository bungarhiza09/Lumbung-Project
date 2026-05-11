import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/Layout'

export default function ChatDonasi() {
  const { roomId } = useParams()
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const bottomRef = useRef(null)

  const [room, setRoom] = useState(null)
  const [donasi, setDonasi] = useState(null)
  const [messages, setMessages] = useState([])
  const [pesan, setPesan] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    fetchRoom()
    fetchMessages()

    // Realtime listener untuk pesan baru
    const channel = supabase
      .channel(`chat-${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `room_id=eq.${roomId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new])
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [roomId])

  useEffect(() => {
    // Auto scroll ke bawah saat ada pesan baru
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function fetchRoom() {
    const { data } = await supabase
      .from('chat_rooms')
      .select(`
        *,
        donasi:donasi_id(*),
        donor:profiles!chat_rooms_donor_id_fkey(nama, no_hp),
        penerima:profiles!chat_rooms_penerima_id_fkey(nama)
      `)
      .eq('id', roomId)
      .single()

    setRoom(data)
    setDonasi(data?.donasi)  // ← update state donasi juga
    setLoading(false)
  }

  async function fetchMessages() {
    const { data } = await supabase
      .from('chat_messages')
      .select(`
        *,
        sender:profiles!chat_messages_sender_id_fkey(nama)
      `)
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })

    setMessages(data || [])
  }

  async function handleKirim(e) {
    e.preventDefault()
    if (!pesan.trim() || sending) return

    setSending(true)
    const pesanTerkirim = pesan.trim()
    setPesan('')

    await supabase
      .from('chat_messages')
      .insert({
        room_id: roomId,
        sender_id: user.id,
        pesan: pesanTerkirim
      })

    setSending(false)
  }

  async function handleKonfirmasiAmbil() {
    if (!donasi || !user) return
    setConfirming(true)

    // Tanya berapa porsi yang mau diambil
    const porsiAmbil = prompt(
      `Berapa porsi yang ingin kamu ambil? (tersedia: ${donasi.jumlah_porsi} porsi)`,
      donasi.jumlah_porsi
    )

    if (!porsiAmbil || isNaN(porsiAmbil) || parseInt(porsiAmbil) <= 0) {
      setConfirming(false)
      return
    }

    const jumlahAmbil = parseInt(porsiAmbil)

    if (jumlahAmbil > donasi.jumlah_porsi) {
      alert(`Maksimal ${donasi.jumlah_porsi} porsi`)
      setConfirming(false)
      return
    }

    const sisaPorsi = donasi.jumlah_porsi - jumlahAmbil
    const statusBaru = sisaPorsi === 0 ? 'diambil' : 'tersedia'

    // Update jumlah porsi & status di database
    const { error } = await supabase
      .from('donasi')
      .update({
        jumlah_porsi: sisaPorsi,
        status: statusBaru,
        penerima_id: sisaPorsi === 0 ? user.id : null
      })
      .eq('id', donasi.id)

    if (error) {
      console.error('Error update donasi:', error)
      alert('Gagal konfirmasi: ' + error.message)
      setConfirming(false)
      return
    }

    // Update status room chat
    await supabase
      .from('chat_rooms')
      .update({ status: 'selesai' })
      .eq('id', roomId)

    // Kirim pesan sistem ke chat
    await supabase
      .from('chat_messages')
      .insert({
        room_id: roomId,
        sender_id: user.id,
        pesan: `✅ ${user.id === donasi.donor_id ? 'Donor' : profile?.nama} mengkonfirmasi pengambilan ${jumlahAmbil} porsi. ${sisaPorsi > 0 ? `Sisa ${sisaPorsi} porsi masih tersedia.` : 'Donasi sudah habis.'}`
      })

    // Tambah poin ke penerima
    await supabase
      .from('profiles')
      .update({ poin: (profile?.poin || 0) + 20 })
      .eq('id', user.id)

    setConfirming(false)
    await fetchRoom()
    alert(`✅ Berhasil! Kamu mengambil ${jumlahAmbil} porsi. +20 poin ditambahkan!`)
  }

  function formatWaktu(timestamp) {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isDonor = room?.donor_id === user?.id
  const lawanBicara = isDonor ? room?.penerima?.nama : room?.donor?.nama

  if (loading) return (
    <Layout>
      <div className="text-center py-12">
        <div className="text-3xl animate-bounce">💬</div>
        <p className="text-sm text-[#9a9a8a] mt-2">Memuat chat...</p>
      </div>
    </Layout>
  )

  return (
    <Layout>
      <div className="max-w-lg mx-auto flex flex-col h-[calc(100vh-8rem)]">

        {/* Header Chat */}
        <div className="bg-white rounded-2xl border border-[#e8e4db] p-4 mb-3 flex items-center gap-3">
          <button
            onClick={() => navigate('/food-rescue')}
            className="text-[#2D6A4F] font-bold text-lg"
          >
            ←
          </button>
          <div className="w-10 h-10 rounded-full bg-[#2D6A4F] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {lawanBicara?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#1a3a2a] truncate">
              {lawanBicara}
            </p>
            <p className="text-xs text-[#9a9a8a] truncate">
              Re: {donasi?.nama_makanan} · {donasi?.jumlah_porsi} porsi
            </p>
          </div>
          {room?.status === 'selesai' && (
            <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full flex-shrink-0">
              ✅ Selesai
            </span>
          )}
        </div>

        {/* Info Donasi */}
        <div className="bg-[#f0faf4] rounded-2xl border border-[#b7e4cc] p-3 mb-3 flex items-center gap-3">
          <span className="text-2xl">🍱</span>
          <div className="flex-1">
            <p className="text-xs font-semibold text-[#2D6A4F]">
              {donasi?.nama_makanan}
            </p>
            <p className="text-xs text-[#5a7a6a]">
              {donasi?.alamat || 'Alamat belum diisi'}
            </p>
          </div>
          {/* Tampilkan sisa porsi */}
          <div className="text-right">
            <div className="text-lg font-bold text-[#2D6A4F]">
              {donasi?.jumlah_porsi}
            </div>
            <div className="text-xs text-[#9a9a8a]">porsi tersisa</div>
          </div>
        </div>

        {/* Area Pesan */}
        <div className="flex-1 bg-white rounded-2xl border border-[#e8e4db] overflow-y-auto p-4 space-y-3 mb-3">

          {/* Pesan sistem awal */}
          <div className="text-center">
            <span className="text-xs text-[#9a9a8a] bg-[#f5f3ee] px-3 py-1 rounded-full">
              Chat dimulai — diskusikan detail pengambilan
            </span>
          </div>

          {messages.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-[#9a9a8a]">
                Belum ada pesan. Mulai percakapan!
              </p>
            </div>
          )}

          {messages.map(msg => {
            const isSaya = msg.sender_id === user?.id
            return (
              <div
                key={msg.id}
                className={`flex ${isSaya ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[75%] ${isSaya ? 'items-end' : 'items-start'} flex flex-col`}>
                  {!isSaya && (
                    <p className="text-xs text-[#9a9a8a] mb-1 ml-1">
                      {msg.sender?.nama}
                    </p>
                  )}
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isSaya
                      ? 'bg-[#2D6A4F] text-white rounded-br-sm'
                      : 'bg-[#f5f3ee] text-[#1a3a2a] rounded-bl-sm'
                  }`}>
                    {msg.pesan}
                  </div>
                  <p className="text-xs text-[#b0b0a0] mt-1 mx-1">
                    {formatWaktu(msg.created_at)}
                  </p>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* Tombol Konfirmasi Sudah Diambil */}
        {room?.status === 'aktif' && !isDonor && (
          <button
            onClick={handleKonfirmasiAmbil}
            disabled={confirming}
            className="w-full py-3 rounded-2xl bg-[#F4A261] hover:bg-[#e8924f] text-white text-sm font-semibold mb-3 transition-all disabled:opacity-60"
          >
            {confirming ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Memproses...
              </span>
            ) : '✅ Konfirmasi Sudah Ambil Donasi'}
          </button>
        )}

        {/* Input Pesan */}
        {room?.status === 'aktif' ? (
          <form onSubmit={handleKirim} className="flex gap-2">
            <input
              value={pesan}
              onChange={e => setPesan(e.target.value)}
              placeholder="Ketik pesan..."
              className="flex-1 px-4 py-3 rounded-2xl border border-[#e8e4db] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] transition-all"
            />
            <button
              type="submit"
              disabled={!pesan.trim() || sending}
              className="w-12 h-12 rounded-2xl bg-[#2D6A4F] hover:bg-[#235c43] text-white flex items-center justify-center transition-all disabled:opacity-50 flex-shrink-0"
            >
              {sending ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5 fill-white rotate-90" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              )}
            </button>
          </form>
        ) : (
          <div className="text-center py-3 bg-green-50 rounded-2xl border border-green-200">
            <p className="text-sm text-green-700 font-medium">
              ✅ Donasi sudah selesai diambil
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}