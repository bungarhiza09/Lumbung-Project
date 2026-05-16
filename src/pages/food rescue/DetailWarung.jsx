import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/Layout'

export default function DetailWarung() {
  const { warungId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [warung, setWarung] = useState(null)
  const [donasi, setDonasi] = useState([])
  const [ulasan, setUlasan] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWarung()
    fetchDonasi()
    fetchUlasan()
  }, [warungId])

  async function fetchWarung() {
    const { data } = await supabase
      .from('warung_profiles')
      .select('*, user:profiles!warung_profiles_user_id_fkey(nama, kota, kabupaten, avatar_url)')
      .eq('id', warungId)
      .single()
    setWarung(data)
    setLoading(false)
  }

  async function fetchDonasi() {
    if (!warung?.user_id) {
      // Ambil user_id dari warung dulu
      const { data: wp } = await supabase
        .from('warung_profiles').select('user_id').eq('id', warungId).single()
      if (!wp) return
      const { data } = await supabase
        .from('donasi')
        .select('*')
        .eq('donor_id', wp.user_id)
        .eq('status', 'tersedia')
        .order('created_at', { ascending: false })
      setDonasi(data || [])
    }
  }

  async function fetchUlasan() {
    const { data } = await supabase
      .from('warung_ratings')
      .select('*, user:profiles!warung_ratings_user_id_fkey(nama, avatar_url)')
      .eq('warung_id', warungId)
      .order('created_at', { ascending: false })
      .limit(5)
    setUlasan(data || [])
  }

  async function handleChat(item) {
    const { data: existing } = await supabase
      .from('chat_rooms').select('id')
      .eq('donasi_id', item.id).eq('penerima_id', user.id).single()
    if (existing) { navigate(`/chat/${existing.id}`); return }
    const { data: newRoom } = await supabase
      .from('chat_rooms')
      .insert({ donasi_id: item.id, donor_id: item.donor_id, penerima_id: user.id })
      .select().single()
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
        <div className="text-4xl mb-3">😕</div>
        <p className="text-sm font-semibold text-[#4a4a3a]">Warung tidak ditemukan</p>
        <Link to="/warung" className="text-xs text-[#2D6A4F] font-medium underline mt-2 block">← Kembali</Link>
      </div>
    </Layout>
  )

  const verifiedProgress = Math.min(((warung.total_donasi || 0) / 20) * 100, 100)

  return (
    <Layout>
      <div className="w-full px-4">
        {/* Back */}
        <button onClick={() => navigate(-1)} className="text-sm text-[#2D6A4F] font-medium flex items-center gap-1 mb-4 mt-1">
          ← Kembali
        </button>

        {/* Header Warung */}
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
                {warung.is_verified && (
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">✅ Verified</span>
                )}
              </div>
              {warung.jenis_makanan && (
                <p className="text-xs text-white/80">{warung.jenis_makanan}</p>
              )}
              {warung.user?.kota && (
                <p className="text-xs text-white/70 mt-0.5">📍 {warung.user.kota}</p>
              )}
            </div>
          </div>

          {/* Stats strip */}
          <div className="relative flex gap-3 mt-4">
            {[
              { icon: '📤', val: warung.total_donasi || 0, label: 'Donasi' },
              { icon: '⭐', val: warung.rating_avg > 0 ? warung.rating_avg.toFixed(1) : '-', label: 'Rating' },
              { icon: '🕒', val: warung.jam_buka ? `${warung.jam_buka}–${warung.jam_tutup}` : '-', label: 'Jam Buka' },
            ].map(s => (
              <div key={s.label} className="bg-white/15 rounded-2xl px-3 py-2 text-center flex-1">
                <div className="text-sm font-bold">{s.icon} {s.val}</div>
                <div className="text-[10px] text-white/70">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Deskripsi */}
        {warung.deskripsi && (
          <div className="bg-white rounded-2xl border border-[#e8e4db] p-4 mb-4">
            <p className="text-xs font-semibold text-[#4a4a3a] mb-2">Tentang Warung</p>
            <p className="text-sm text-[#6a7a6a] leading-relaxed">{warung.deskripsi}</p>
          </div>
        )}

        {/* Progress Verified */}
        {!warung.is_verified && (
          <div className="bg-white rounded-2xl border border-[#e8e4db] p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-[#4a4a3a]">🏅 Menuju Lumbung Verified</p>
              <span className="text-xs text-[#2D6A4F] font-bold">{warung.total_donasi || 0}/20</span>
            </div>
            <div className="bg-[#f0ece4] rounded-full h-2">
              <div className="h-2 bg-gradient-to-r from-[#F4A261] to-[#2D6A4F] rounded-full" style={{ width: `${verifiedProgress}%` }} />
            </div>
          </div>
        )}

        {/* Donasi Tersedia */}
        <div className="mb-5">
          <h2 className="text-sm font-semibold text-[#1a3a2a] mb-3">🍱 Makanan Tersedia ({donasi.length})</h2>
          {donasi.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#e8e4db] p-8 text-center">
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
                      <div>
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
                        className="w-full py-3 rounded-2xl bg-[#2D6A4F] text-white text-sm font-semibold"
                      >
                        💬 Chat & Ambil Donasi
                      </button>
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
                          <span key={s} className={`text-xs ${s <= u.rating ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                        ))}
                      </div>
                    </div>
                    {u.komentar && <p className="text-xs text-[#7a8a7a] mt-0.5">{u.komentar}</p>}
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
