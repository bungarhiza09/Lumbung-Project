import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/Layout'
import { tambahPoin } from '../../lib/poinHelper'

// ─── Modal Rating (FIX ISSUE 2: centered popup, bukan bottom sheet) ──
function RatingModal({ donasi, warungProfile, onSelesai }) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [komentar, setKomentar] = useState('')
  const [loading, setLoading] = useState(false)
  const [errMsg, setErrMsg] = useState('')
  const { user } = useAuth()

  async function handleKirimRating() {
    if (rating === 0 || !warungProfile) { onSelesai(); return }
    setLoading(true)
    setErrMsg('')

    // FIX ISSUE 3: Simpan rating dengan error handling
    const { error: ratingError } = await supabase
    .from('warung_ratings')
    .upsert({
      warung_id: warungProfile.id,
      user_id: user.id,
      donasi_id: donasi.id,
      nilai: rating,
      komentar: komentar.trim() || null,
    }, {
      onConflict: 'warung_id,user_id,donasi_id'
    })

    if (ratingError) {
      console.error('Rating upsert error:', ratingError)
      setErrMsg('Gagal menyimpan rating: ' + ratingError.message)
      setLoading(false)
      return
    }

    // Update rata-rata di warung_profiles
    const { data: allRatings } = await supabase
      .from('warung_ratings')
      .select('rating')
      .eq('warung_id', warungProfile.id)
    if (allRatings?.length) {
      const avg = allRatings.reduce((s, r) => s + r.rating, 0) / allRatings.length
      await supabase.from('warung_profiles')
        .update({ rating_avg: parseFloat(avg.toFixed(2)) })
        .eq('id', warungProfile.id)
    }

    setLoading(false)
    onSelesai()
  }

  return (
    // FIX ISSUE 2: items-center justify-center (centered), bukan items-end (bottom sheet)
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
        <div className="text-center mb-5">
          <div className="text-4xl mb-2">🌟</div>
          <h3 className="text-base font-bold text-[#1a3a2a]">Beri Rating Warung</h3>
          <p className="text-xs text-[#9a9a8a] mt-1">{warungProfile?.nama_warung || 'Warung ini'}</p>
        </div>

        {/* Bintang interaktif */}
        <div className="flex justify-center gap-3 mb-4">
          {[1,2,3,4,5].map(s => (
            <button
              key={s}
              onClick={() => setRating(s)}
              onMouseEnter={() => setHover(s)}
              onMouseLeave={() => setHover(0)}
              className="text-4xl transition-transform hover:scale-110 active:scale-95"
            >
              <span className={(hover || rating) >= s ? 'text-yellow-400' : 'text-gray-200'}>★</span>
            </button>
          ))}
        </div>

        {rating > 0 && (
          <p className="text-center text-xs text-[#2D6A4F] font-semibold mb-4">
            {['', 'Sangat Buruk 😞', 'Buruk 😕', 'Cukup 😊', 'Baik 😄', 'Luar Biasa! 🤩'][rating]}
          </p>
        )}

        <textarea
          value={komentar}
          onChange={e => setKomentar(e.target.value)}
          placeholder="Tulis komentar (opsional)..."
          rows={2}
          className="w-full px-3 py-2.5 rounded-xl border border-[#e8e4db] text-sm resize-none mb-4 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20"
        />

        {errMsg && (
          <p className="text-xs text-red-500 text-center mb-3">{errMsg}</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onSelesai}
            className="flex-1 py-3 rounded-2xl border border-[#e8e4db] text-sm text-[#9a9a8a] font-medium"
          >
            Lewati
          </button>
          <button
            onClick={handleKirimRating}
            disabled={loading || rating === 0}
            className="flex-1 py-3 rounded-2xl bg-[#2D6A4F] text-white text-sm font-semibold disabled:opacity-50"
          >
            {loading ? 'Mengirim...' : '⭐ Kirim Rating'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal Konfirmasi Porsi (FIX ISSUE 2: centered popup) ────────
function PorsiModal({ donasi, porsiInput, setPorsiInput, onBatal, onKonfirmasi }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
        <div className="text-center mb-5">
          <div className="text-4xl mb-2">✅</div>
          <h3 className="text-base font-bold text-[#1a3a2a]">Berapa porsi yang diambil?</h3>
          <p className="text-xs text-[#9a9a8a] mt-1">Tersedia: {donasi?.jumlah_porsi} porsi</p>
        </div>
        <input
          type="number"
          value={porsiInput}
          onChange={e => setPorsiInput(e.target.value)}
          min={1} max={donasi?.jumlah_porsi}
          className="w-full px-4 py-3 rounded-2xl border border-[#e8e4db] text-center text-2xl font-bold mb-5 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20"
        />
        <div className="flex gap-3">
          <button onClick={onBatal} className="flex-1 py-3 rounded-2xl border border-[#e8e4db] text-sm text-[#9a9a8a]">
            Batal
          </button>
          <button
            onClick={onKonfirmasi}
            disabled={!porsiInput || parseInt(porsiInput) <= 0 || parseInt(porsiInput) > donasi?.jumlah_porsi}
            className="flex-1 py-3 rounded-2xl bg-[#2D6A4F] text-white text-sm font-semibold disabled:opacity-50"
          >
            ✅ Konfirmasi
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main ChatDonasi ─────────────────────────────────────────────
export default function ChatDonasi() {
  const { roomId } = useParams()
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const bottomRef = useRef(null)

  const [room, setRoom] = useState(null)
  const [donasi, setDonasi] = useState(null)
  const [warungProfile, setWarungProfile] = useState(null)
  const [messages, setMessages] = useState([])
  const [pesan, setPesan] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [showRating, setShowRating] = useState(false)
  const [porsiInput, setPorsiInput] = useState('')
  const [showPorsiModal, setShowPorsiModal] = useState(false)

  useEffect(() => {
    fetchRoom()
    fetchMessages()
    const channel = supabase
      .channel(`chat-${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public',
        table: 'chat_messages', filter: `room_id=eq.${roomId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new])
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [roomId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function fetchRoom() {
    const { data } = await supabase
      .from('chat_rooms')
      .select(`
        *,
        donasi:donasi_id(*),
        donor:profiles!chat_rooms_donor_id_fkey(nama, no_hp, avatar_url),
        penerima:profiles!chat_rooms_penerima_id_fkey(nama, avatar_url)
      `)
      .eq('id', roomId)
      .single()
    setRoom(data)
    setDonasi(data?.donasi)

    if (data?.donor_id) {
      const { data: wp } = await supabase
        .from('warung_profiles')
        .select('id, nama_warung')
        .eq('user_id', data.donor_id)
        .single()
      setWarungProfile(wp)
    }
    setLoading(false)
  }

  async function fetchMessages() {
    const { data } = await supabase
      .from('chat_messages')
      .select(`*, sender:profiles!chat_messages_sender_id_fkey(nama, avatar_url)`)
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
    await supabase.from('chat_messages').insert({
      room_id: roomId, sender_id: user.id, pesan: pesanTerkirim
    })
    setSending(false)
  }

  async function handleKonfirmasiAmbil() {
    if (!donasi || !user) return
    setPorsiInput(String(donasi.jumlah_porsi))
    setShowPorsiModal(true)
  }

  async function prosesKonfirmasi() {
    const jumlahAmbil = parseInt(porsiInput)
    if (isNaN(jumlahAmbil) || jumlahAmbil <= 0) return
    if (jumlahAmbil > donasi.jumlah_porsi) return

    setShowPorsiModal(false)
    setConfirming(true)

    const sisaPorsi = donasi.jumlah_porsi - jumlahAmbil
    const statusBaru = sisaPorsi === 0 ? 'diambil' : 'tersedia'

    await supabase.from('donasi').update({
      jumlah_porsi: sisaPorsi,
      status: statusBaru,
      penerima_id: sisaPorsi === 0 ? user.id : null,
    }).eq('id', donasi.id)

    await supabase.from('chat_rooms').update({ status: 'selesai' }).eq('id', roomId)

    await supabase.from('chat_messages').insert({
      room_id: roomId, sender_id: user.id,
      pesan: `✅ ${profile?.nama} mengkonfirmasi pengambilan ${jumlahAmbil} porsi. ${sisaPorsi > 0 ? `Sisa ${sisaPorsi} porsi masih tersedia.` : 'Donasi sudah habis.'}`
    })

    // FIX ISSUE 6b: Gunakan tambahPoin agar terekam di poin_history
    await tambahPoin(user.id, 'donasi_porsi', `Ambil donasi: ${donasi.nama_makanan} (${jumlahAmbil} porsi)`)

    // Tambah total_donasi ke warung
    if (warungProfile) {
      const { data: wp } = await supabase
        .from('warung_profiles').select('total_donasi').eq('id', warungProfile.id).single()
      const newTotal = (wp?.total_donasi || 0) + 1
      await supabase.from('warung_profiles').update({
        total_donasi: newTotal,
        is_verified: newTotal >= 20,
      }).eq('id', warungProfile.id)
    }

    setConfirming(false)
    await fetchRoom()

    if (warungProfile) {
      setShowRating(true)
    }
  }

  function formatWaktu(timestamp) {
    return new Date(timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  }

  const isDonor = room?.donor_id === user?.id
  const lawanBicara = isDonor ? room?.penerima?.nama : room?.donor?.nama
  const lawanAvatar = isDonor ? room?.penerima?.avatar_url : room?.donor?.avatar_url

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
      <div className="w-full px-4 flex flex-col h-[calc(100vh-8rem)]">

        {/* Header Chat */}
        <div className="bg-white rounded-2xl border border-[#e8e4db] p-4 mb-3 flex items-center gap-3">
          <button onClick={() => navigate('/food-rescue')} className="text-[#2D6A4F] font-bold text-lg">←</button>
          <div className="w-10 h-10 rounded-full bg-[#2D6A4F] flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden">
            {lawanAvatar
              ? <img src={lawanAvatar} alt="" className="w-full h-full object-cover" />
              : lawanBicara?.[0]?.toUpperCase()
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#1a3a2a] truncate">{lawanBicara}</p>
            <p className="text-xs text-[#9a9a8a] truncate">
              Re: {donasi?.nama_makanan} · {donasi?.jumlah_porsi} porsi
            </p>
          </div>
          {room?.status === 'selesai' && (
            <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full flex-shrink-0">✅ Selesai</span>
          )}
        </div>

        {/* Info Donasi */}
        <div className="bg-[#f0faf4] rounded-2xl border border-[#b7e4cc] p-3 mb-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🍱</span>
            <div className="flex-1">
              <p className="text-xs font-semibold text-[#2D6A4F]">{donasi?.nama_makanan}</p>
              <p className="text-xs text-[#5a7a6a]">{donasi?.alamat || 'Alamat belum diisi'}</p>
              <p className="text-xs text-[#9a9a8a] mt-0.5">
                📤 Diposting oleh <span className="font-semibold text-[#2D6A4F]">{room?.donor?.nama}</span>
                {warungProfile && <span className="text-[#F4A261]"> · {warungProfile.nama_warung}</span>}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-lg font-bold text-[#2D6A4F]">{donasi?.jumlah_porsi}</div>
              <div className="text-xs text-[#9a9a8a]">porsi tersisa</div>
            </div>
          </div>
        </div>

        {/* Area Pesan */}
        <div className="flex-1 bg-white rounded-2xl border border-[#e8e4db] overflow-y-auto p-4 space-y-3 mb-3">
          <div className="text-center">
            <span className="text-xs text-[#9a9a8a] bg-[#f5f3ee] px-3 py-1 rounded-full">
              Chat dimulai — diskusikan detail pengambilan
            </span>
          </div>
          {messages.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-[#9a9a8a]">Belum ada pesan. Mulai percakapan!</p>
            </div>
          )}
          {messages.map(msg => {
            const isSaya = msg.sender_id === user?.id
            return (
              <div key={msg.id} className={`flex items-end gap-2 ${isSaya ? 'flex-row-reverse' : 'flex-row'}`}>
                {!isSaya && (
                  <div className="w-7 h-7 rounded-full bg-[#2D6A4F] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden mb-1">
                    {msg.sender?.avatar_url
                      ? <img src={msg.sender.avatar_url} alt="" className="w-full h-full object-cover" />
                      : msg.sender?.nama?.[0]?.toUpperCase()}
                  </div>
                )}
                <div className={`max-w-[72%] flex flex-col ${isSaya ? 'items-end' : 'items-start'}`}>
                  {!isSaya && <p className="text-xs text-[#9a9a8a] mb-1 ml-1">{msg.sender?.nama}</p>}
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isSaya ? 'bg-[#2D6A4F] text-white rounded-br-sm' : 'bg-[#f5f3ee] text-[#1a3a2a] rounded-bl-sm'
                  }`}>
                    {msg.pesan}
                  </div>
                  <p className="text-xs text-[#b0b0a0] mt-1 mx-1">{formatWaktu(msg.created_at)}</p>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* Tombol Konfirmasi */}
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
              className="flex-1 px-4 py-3 rounded-2xl border border-[#e8e4db] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F]"
            />
            <button
              type="submit" disabled={!pesan.trim() || sending}
              className="w-12 h-12 rounded-2xl bg-[#2D6A4F] text-white flex items-center justify-center disabled:opacity-50 flex-shrink-0"
            >
              {sending
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <svg className="w-5 h-5 fill-white rotate-90" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
              }
            </button>
          </form>
        ) : (
          <div className="text-center py-3 bg-green-50 rounded-2xl border border-green-200">
            <p className="text-sm text-green-700 font-medium">✅ Donasi sudah selesai diambil</p>
            {!isDonor && warungProfile && (
              <button onClick={() => setShowRating(true)}
                className="text-xs text-[#2D6A4F] font-semibold underline mt-1">
                Beri rating warung →
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal Porsi (FIX ISSUE 2: centered) */}
      {showPorsiModal && (
        <PorsiModal
          donasi={donasi}
          porsiInput={porsiInput}
          setPorsiInput={setPorsiInput}
          onBatal={() => setShowPorsiModal(false)}
          onKonfirmasi={prosesKonfirmasi}
        />
      )}

      {/* Modal Rating (FIX ISSUE 2: centered) */}
      {showRating && warungProfile && (
        <RatingModal
          donasi={donasi}
          warungProfile={warungProfile}
          onSelesai={() => setShowRating(false)}
        />
      )}
    </Layout>
  )
}
