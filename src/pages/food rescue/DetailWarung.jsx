import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/Layout'

export default function DetailWarung() {
  const { warungId } = useParams()
  const { user }     = useAuth()
  const navigate     = useNavigate()

  const [warung,  setWarung]  = useState(null)
  const [donasi,  setDonasi]  = useState([])
  const [ulasan,  setUlasan]  = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // FIX #3: ambil semua data sekaligus dalam satu flow, tanpa bergantung state
    loadAll()
  }, [warungId])

  async function loadAll() {
    setLoading(true)

    // 1. Fetch profil warung
    const { data: warungData } = await supabase
      .from('warung_profiles')
      .select('*, user:profiles!warung_profiles_user_id_fkey(nama, kota, kabupaten, avatar_url)')
      .eq('id', warungId)
      .single()

    setWarung(warungData)

    // 2. Fetch donasi langsung pakai warungData.user_id (tidak tunggu state)
    if (warungData?.user_id) {
      const { data: donasiData } = await supabase
        .from('donasi')
        .select('*')
        .eq('donor_id', warungData.user_id)
        .eq('status', 'tersedia')
        .order('created_at', { ascending: false })
      setDonasi(donasiData || [])
    }

    // 3. Fetch ulasan
    const { data: ulasanData } = await supabase
      .from('warung_ratings')
      .select('*, user:profiles!warung_ratings_user_id_fkey(nama, avatar_url)')
      .eq('warung_id', warungId)
      .order('created_at', { ascending: false })
      .limit(10)
    setUlasan(ulasanData || [])

    setLoading(false)
  }

  async function handleChat(item) {
    const { data: existing } = await supabase
      .from('chat_rooms')
      .select('id')
      .eq('donasi_id', item.id)
      .eq('penerima_id', user.id)
      .maybeSingle()

    if (existing) { navigate(`/chat/${existing.id}`); return }

    const { data: newRoom } = await supabase
      .from('chat_rooms')
      .insert({ donasi_id: item.id, donor_id: item.donor_id, penerima_id: user.id })
      .select()
      .single()

    if (newRoom) navigate(`/chat/${newRoom.id}`)
  }

  if (loading) return (
    <Layout>
      <div className="text-center py-16">
        <div className="text-4xl animate-bounce mb-3">🏪</div>
        <p className="text-sm text-[#9a9a8a]">Memuat profil warung...</p>
      </div>
    </Layout>
  )

  if (!warung) return (
    <Layout>
      <div className="text-center py-16 px-4">
        <div className="text-5xl mb-4">😕</div>
        <p className="text-sm font-semibold text-[#4a4a3a]">Warung tidak ditemukan</p>
        <p className="text-xs text-[#9a9a8a] mt-2 mb-4">Data warung mungkin belum tersedia</p>
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-white bg-[#2D6A4F] px-4 py-2 rounded-xl font-medium">
          ← Kembali
        </button>
      </div>
    </Layout>
  )

  const verifiedProgress = Math.min(((warung.total_donasi || 0) / 20) * 100, 100)
  const isVerified = warung.is_verified || (warung.total_donasi || 0) >= 20

  return (
    <Layout>
      <div className="w-full px-4">
        {/* Back */}
        <button onClick={() => navigate(-1)}
          className="text-sm text-[#2D6A4F] font-medium flex items-center gap-1 mb-4 mt-1">
          ← Kembali
        </button>

        {/* Header */}
        <div className="bg-gradient-to-br from-[#d4720a] to-[#F4A261] rounded-3xl p-5 mb-5 text-white relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/10" />
          <div className="absolute -bottom-6 left-8 w-24 h-24 rounded-full bg-white/10" />
          <div className="relative flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white/20 border-2 border-white/40 flex-shrink-0 flex items-center justify-center">
              {warung.foto_url
                ? <img src={warung.foto_url} alt="" className="w-full h-full object-cover" />
                : <span className="text-3xl">🍜</span>
              }
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="text-lg font-bold">{warung.nama_warung}</h1>
                {isVerified && <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">✅ Verified</span>}
              </div>
              {warung.jenis_makanan && <p className="text-xs text-white/80">{warung.jenis_makanan}</p>}
              {warung.user?.kota && <p className="text-xs text-white/70 mt-0.5">📍 {warung.user.kota}</p>}
            </div>
          </div>
          <div className="relative flex gap-2 mt-4">
            {[
              { icon: '📤', val: warung.total_donasi || 0, label: 'Donasi' },
              { icon: '⭐', val: (warung.rating_avg || 0) > 0 ? Number(warung.rating_avg).toFixed(1) : '-', label: 'Rating' },
              { icon: '🍱', val: donasi.length, label: 'Tersedia' },
              { icon: '🕒', val: warung.jam_buka ? `${warung.jam_buka}–${warung.jam_tutup}` : '-', label: 'Jam Buka' },
            ].map(s => (
              <div key={s.label} className="bg-white/15 rounded-2xl px-2 py-2 text-center flex-1">
                <div className="text-xs font-bold">{s.icon} {s.val}</div>
                <div className="text-[9px] text-white/70 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Deskripsi */}
        {warung.deskripsi && (
          <div className="bg-white rounded-2xl border border-[#e8e4db] p-4 mb-4">
            <p className="text-xs font-semibold text-[#4a4a3a] mb-1.5">Tentang Warung</p>
            <p className="text-sm text-[#6a7a6a] leading-relaxed">{warung.deskripsi}</p>
          </div>
        )}

        {/* Progress Verified */}
        {!isVerified && (
          <div className="bg-white rounded-2xl border border-[#e8e4db] p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-[#4a4a3a]">🏅 Menuju Lumbung Verified</p>
              <span className="text-xs text-[#2D6A4F] font-bold">{warung.total_donasi || 0}/20</span>
            </div>
            <div className="bg-[#f0ece4] rounded-full h-2">
              <div className="h-2 bg-gradient-to-r from-[#F4A261] to-[#2D6A4F] rounded-full transition-all"
                style={{ width: `${verifiedProgress}%` }} />
            </div>
          </div>
        )}

        {/* Donasi Tersedia */}
        <div className="mb-5">
          <h2 className="text-sm font-semibold text-[#1a3a2a] mb-3">
            🍱 Makanan Tersedia
            <span className="ml-1.5 text-xs bg-[#f0faf4] text-[#2D6A4F] border border-[#b7e4cc] px-2 py-0.5 rounded-full">
              {donasi.length}
            </span>
          </h2>
          {donasi.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#e8e4db] p-8 text-center">
              <div className="text-3xl mb-2">🍽️</div>
              <p className="text-sm text-[#9a9a8a]">Belum ada donasi tersedia saat ini</p>
            </div>
          ) : (
            <div className="space-y-3">
              {donasi.map(item => (
                <div key={item.id} className="bg-white rounded-2xl border border-[#e8e4db] overflow-hidden">
                  {item.foto_url && (
                    <img src={item.foto_url} alt={item.nama_makanan} className="w-full h-36 object-cover" />
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-[#1a3a2a]">{item.nama_makanan}</h3>
                        {item.deskripsi && (
                          <p className="text-xs text-[#7a8a7a] mt-0.5 line-clamp-2">{item.deskripsi}</p>
                        )}
                      </div>
                      <span className="text-xs bg-[#f0faf4] text-[#2D6A4F] border border-[#b7e4cc] px-2 py-1 rounded-full font-semibold ml-2 flex-shrink-0">
                        {item.jumlah_porsi} porsi
                      </span>
                    </div>
                    {item.donor_id !== user?.id && (
                      <button
                        onClick={() => handleChat(item)}
                        className="w-full py-3 rounded-2xl bg-[#2D6A4F] text-white text-sm font-semibold hover:bg-[#235c43] transition-all">
                        💬 Chat & Ambil Donasi
                      </button>
                    )}
                    {item.donor_id === user?.id && (
                      <div className="w-full py-3 rounded-2xl bg-gray-50 text-gray-400 text-sm text-center">
                        Ini donasimu sendiri
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ulasan */}
        {ulasan.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#e8e4db] p-4 mb-5">
            <h2 className="text-sm font-semibold text-[#1a3a2a] mb-3">⭐ Ulasan ({ulasan.length})</h2>
            <div className="space-y-3">
              {ulasan.map(u => (
                <div key={u.id} className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-[#2D6A4F] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
                    {u.user?.avatar_url
                      ? <img src={u.user.avatar_url} alt="" className="w-full h-full object-cover" />
                      : u.user?.nama?.[0]?.toUpperCase()
                    }
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-[#1a3a2a]">{u.user?.nama || 'Anonim'}</p>
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(s => (
                          <span key={s} className={`text-xs ${s <= u.nilai ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                        ))}
                      </div>
                    </div>
                    {u.komentar && <p className="text-xs text-[#7a8a7a] mt-0.5">{u.komentar}</p>}
                    <p className="text-[10px] text-[#b0b0a0] mt-0.5">
                      {new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="h-6" />
      </div>
    </Layout>
  )
}
