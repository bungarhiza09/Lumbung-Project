import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/Layout'

export default function DaftarChat() {
  const { user } = useAuth()
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchRooms() }, [])

  async function fetchRooms() {
    // FIX ISSUE 4: Tambah join warung_profiles lewat donor untuk tampilkan nama warung
    const { data } = await supabase
      .from('chat_rooms')
      .select(`
        *,
        donasi:donasi_id(nama_makanan, jumlah_porsi, foto_url),
        donor:profiles!chat_rooms_donor_id_fkey(id, nama, avatar_url),
        penerima:profiles!chat_rooms_penerima_id_fkey(nama, avatar_url)
      `)
      .or(`donor_id.eq.${user.id},penerima_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    const rooms = data || []

    // Ambil warung_profiles untuk setiap donor_id unik
    const donorIds = [...new Set(rooms.map(r => r.donor_id).filter(Boolean))]
    let warungMap = {}
    if (donorIds.length > 0) {
      const { data: warungData } = await supabase
        .from('warung_profiles')
        .select('user_id, nama_warung, is_verified')
        .in('user_id', donorIds)
      warungData?.forEach(w => { warungMap[w.user_id] = w })
    }

    // Gabungkan warung info ke tiap room
    const roomsWithWarung = rooms.map(r => ({
      ...r,
      warung: warungMap[r.donor_id] || null,
    }))

    setRooms(roomsWithWarung)
    setLoading(false)
  }

  return (
    <Layout>
      <div className="w-full px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#1a3a2a]">💬 Chat</h1>
          <p className="text-sm text-[#7a8a7a] mt-1">Percakapan donasi makananmu</p>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="text-3xl animate-bounce">💬</div>
          </div>
        )}

        {!loading && rooms.length === 0 && (
          <div className="text-center py-12 bg-white rounded-3xl border border-[#e8e4db]">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-sm font-medium text-[#4a4a3a]">Belum ada chat</p>
            <p className="text-xs text-[#9a9a8a] mt-1">Chat akan muncul saat kamu menghubungi donor</p>
          </div>
        )}

        <div className="space-y-3">
          {rooms.map(room => {
            const isDonor = room.donor_id === user?.id
            const lawanBicara = isDonor ? room.penerima?.nama : room.donor?.nama
            const lawanAvatar = isDonor ? room.penerima?.avatar_url : room.donor?.avatar_url

            return (
              <Link
                key={room.id}
                to={`/chat/${room.id}`}
                className="bg-white rounded-2xl border border-[#e8e4db] p-4 flex items-center gap-3 hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-[#2D6A4F] flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden">
                  {lawanAvatar
                    ? <img src={lawanAvatar} alt="" className="w-full h-full object-cover" />
                    : lawanBicara?.[0]?.toUpperCase()
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[#1a3a2a] truncate">{lawanBicara}</p>
                    {room.status === 'selesai' && (
                      <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex-shrink-0">✅ Selesai</span>
                    )}
                  </div>
                  {/* FIX ISSUE 4: Tampilkan nama warung jika donor punya warung */}
                  {!isDonor && room.warung?.nama_warung && (
                    <p className="text-xs text-[#d4720a] font-medium truncate mt-0.5">
                      🏪 {room.warung.nama_warung}
                      {room.warung.is_verified && ' ✅'}
                    </p>
                  )}
                  <p className="text-xs text-[#9a9a8a] truncate mt-0.5">
                    🍱 {room.donasi?.nama_makanan} · {room.donasi?.jumlah_porsi} porsi
                  </p>
                </div>
                <span className="text-[#9a9a8a] text-lg flex-shrink-0">›</span>
              </Link>
            )
          })}
        </div>
      </div>
    </Layout>
  )
}
