import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/Layout'

// ─── Sub-tab: Daftar Warung (inline, tanpa navigate) ─────────────
function TabWarung() {
  const navigate = useNavigate()
  const [warung,  setWarung]  = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')

  useEffect(() => { fetchWarung() }, [])

  async function fetchWarung() {
    const { data } = await supabase
      .from('warung_profiles')
      .select('*, user:profiles!warung_profiles_user_id_fkey(nama, kota, kabupaten)')
      .order('total_donasi', { ascending: false })
    setWarung(data || [])
    setLoading(false)
  }

  const filtered = warung.filter(w =>
    !search ||
    w.nama_warung?.toLowerCase().includes(search.toLowerCase()) ||
    w.jenis_makanan?.toLowerCase().includes(search.toLowerCase()) ||
    w.user?.kota?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      {/* Search */}
      <div className="relative mb-4">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari warung atau kota..."
          className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-[#e8e4db] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 focus:border-[#2D6A4F]"
        />
        <span className="absolute left-3 top-3 text-[#9a9a8a] text-sm">🔍</span>
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="text-3xl animate-bounce mb-2">🏪</div>
          <p className="text-xs text-[#9a9a8a]">Memuat warung...</p>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-10 bg-white rounded-2xl border border-[#e8e4db]">
          <div className="text-4xl mb-2">🍽️</div>
          <p className="text-sm text-[#9a9a8a]">Warung tidak ditemukan</p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(w => (
          <button
            key={w.id}
            onClick={() => navigate(`/warung/${w.id}`)}
            className="w-full bg-white rounded-2xl border border-[#e8e4db] p-4 flex items-center gap-3 hover:shadow-md transition-all active:scale-[0.98] text-left"
          >
            {/* Avatar */}
            <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 bg-[#fef3e7] flex items-center justify-center">
              {w.foto_url
                ? <img src={w.foto_url} alt={w.nama_warung} className="w-full h-full object-cover" />
                : <span className="text-2xl">🍜</span>
              }
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <p className="text-sm font-semibold text-[#1a3a2a] truncate">{w.nama_warung}</p>
                {w.is_verified && (
                  <span className="text-[10px] bg-[#f0faf4] text-[#2D6A4F] border border-[#b7e4cc] px-1.5 py-0.5 rounded-full flex-shrink-0">
                    ✅
                  </span>
                )}
              </div>
              {w.jenis_makanan && (
                <p className="text-xs text-[#7a8a7a] truncate">{w.jenis_makanan}</p>
              )}
              <div className="flex items-center gap-2.5 mt-1">
                {w.user?.kota && (
                  <span className="text-[10px] text-[#9a9a8a]">📍 {w.user.kota}</span>
                )}
                <span className="text-[10px] text-[#9a9a8a]">📤 {w.total_donasi || 0}</span>
                {(w.rating_avg || 0) > 0 && (
                  <span className="text-[10px] text-[#9a9a8a]">⭐ {Number(w.rating_avg).toFixed(1)}</span>
                )}
              </div>
            </div>

            <span className="text-[#9a9a8a] text-lg flex-shrink-0">›</span>
          </button>
        ))}
      </div>
      <div className="h-4" />
    </div>
  )
}

// ─── Main FoodRescue ─────────────────────────────────────────────
export default function FoodRescue() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [donasi,  setDonasi]  = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('semua')

  useEffect(() => {
    if (filter === 'warung') return   // TabWarung punya fetch sendiri
    fetchDonasi()

    const channel = supabase
      .channel('donasi-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'donasi' }, fetchDonasi)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [filter])

  async function fetchDonasi() {
    if (filter === 'warung') return
    setLoading(true)

    const { data: donasiData } = await supabase
      .from('donasi')
      .select('*, donor:profiles!donasi_donor_id_fkey(id, nama, kota, kabupaten)')
      .eq('status', 'tersedia')
      .order('created_at', { ascending: false })

    // Ambil warung untuk setiap donor
    const donorIds = [...new Set((donasiData || []).map(d => d.donor_id).filter(Boolean))]
    const { data: warungData } = donorIds.length > 0
      ? await supabase
          .from('warung_profiles')
          .select('user_id, id, nama_warung, is_verified, rating_avg')
          .in('user_id', donorIds)
      : { data: [] }

    const merged = (donasiData || []).map(item => ({
      ...item,
      warung: warungData?.find(w => w.user_id === item.donor_id) || null,
    }))

    setDonasi(merged)
    setLoading(false)
  }

  async function handleMulaiChat(item) {
    const { data: existingRoom } = await supabase
      .from('chat_rooms')
      .select('id')
      .eq('donasi_id', item.id)
      .eq('penerima_id', user.id)
      .maybeSingle()

    if (existingRoom) { navigate(`/chat/${existingRoom.id}`); return }

    const { data: newRoom } = await supabase
      .from('chat_rooms')
      .insert({ donasi_id: item.id, donor_id: item.donor_id, penerima_id: user.id })
      .select()
      .single()

    if (newRoom) navigate(`/chat/${newRoom.id}`)
  }

  function hitungSisaWaktu(expiredAt) {
    if (!expiredAt) return null
    const diff = new Date(expiredAt) - new Date()
    if (diff <= 0) return 'Kadaluarsa'
    const jam   = Math.floor(diff / 3600000)
    const menit = Math.floor((diff % 3600000) / 60000)
    return jam > 0 ? `${jam} jam lagi` : `${menit} menit lagi`
  }

  const filtered = filter === 'semua' || filter === 'warung'
    ? donasi
    : donasi.filter(d => {
        if (!profile?.kabupaten) return true
        return (
          d.kabupaten?.toLowerCase() === profile.kabupaten?.toLowerCase() ||
          d.kota?.toLowerCase() === profile.kota?.toLowerCase()
        )
      })

  const FILTERS = [
    { id: 'semua',  label: '🌍 Semua' },
    { id: 'kotaku', label: `📍 ${profile?.kota || 'Kotaku'}` },
    { id: 'warung', label: '🏪 Warung' },
  ]

  return (
    <Layout>
      <div className="w-full px-4">

        {/* HERO */}
        <div className="relative bg-[#2D6A4F] rounded-3xl p-6 mb-6 overflow-hidden">
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
          <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-white/5" />
          <div className="relative">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🍱</span>
                  <span className="text-xs font-medium text-white/70 bg-white/10 px-2.5 py-1 rounded-full">
                    Food Rescue Network
                  </span>
                </div>
                <h1 className="text-xl font-bold text-white mb-2 leading-tight">
                  Selamatkan Makanan,<br />Bantu Sesama
                </h1>
                <p className="text-xs text-white/70 leading-relaxed max-w-xs">
                  Hubungkan surplus makanan dari warung & rumah tangga ke keluarga yang membutuhkan.
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <div className="bg-white/10 rounded-2xl px-3 py-2 text-center">
                <div className="text-lg font-bold text-white">{donasi.length}</div>
                <div className="text-xs text-white/60">Tersedia</div>
              </div>
              <div className="bg-white/10 rounded-2xl px-3 py-2 text-center">
                <div className="text-lg font-bold text-[#F4A261]">+50</div>
                <div className="text-xs text-white/60">Poin/donasi</div>
              </div>
              <div className="bg-white/10 rounded-2xl px-3 py-2 text-center flex-1">
                <div className="text-lg font-bold text-white">100%</div>
                <div className="text-xs text-white/60">Gratis</div>
              </div>
            </div>
          </div>
        </div>

        {/* FILTER + TOMBOL DONASI */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex gap-1.5 flex-1">
            {FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex-1 ${
                  filter === f.id
                    ? 'bg-[#2D6A4F] text-white shadow-md shadow-[#2D6A4F]/20'
                    : 'bg-white text-[#4a4a3a] border border-[#e8e4db] hover:bg-[#f0faf4]'
                }`}>
                {f.label}
              </button>
            ))}
          </div>
          <Link
            to="/donasi/buat"
            className="bg-[#F4A261] hover:bg-[#e8924f] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-[#F4A261]/30 flex items-center gap-1 flex-shrink-0">
            <span>+</span> Donasi
          </Link>
        </div>

        {/* TAB WARUNG — inline */}
        {filter === 'warung' ? (
          <TabWarung />
        ) : (
          <>
            <p className="text-xs text-[#9a9a8a] mb-4">
              Menampilkan <span className="font-semibold text-[#2D6A4F]">{filtered.length} donasi</span> tersedia
            </p>

            {loading && (
              <div className="text-center py-16">
                <div className="text-4xl mb-3 animate-bounce">🍱</div>
                <p className="text-sm text-[#9a9a8a]">Memuat donasi terdekat...</p>
              </div>
            )}

            {!loading && filtered.length === 0 && (
              <div className="text-center py-12 bg-white rounded-3xl border border-[#e8e4db]">
                <div className="text-5xl mb-3">🌾</div>
                <p className="text-sm font-semibold text-[#4a4a3a]">Belum ada donasi tersedia</p>
                <Link to="/donasi/buat"
                  className="inline-block bg-[#2D6A4F] text-white text-sm font-semibold px-6 py-3 rounded-2xl mt-4">
                  📤 Mulai Donasi
                </Link>
              </div>
            )}

            <div className="space-y-4">
              {filtered.map((item, idx) => {
                const sisaWaktu     = hitungSisaWaktu(item.expired_at)
                const isExpiringSoon = item.expired_at && (new Date(item.expired_at) - new Date()) < 3600000
                const isDonorku     = item.donor_id === user?.id

                return (
                  <div key={item.id}
                    className="bg-white rounded-3xl border border-[#e8e4db] overflow-hidden hover:shadow-lg transition-all"
                    style={{ animationDelay: `${idx * 50}ms` }}>

                    {/* Foto */}
                    {item.foto_url ? (
                      <div className="relative overflow-hidden">
                        <img src={item.foto_url} alt={item.nama_makanan} className="w-full h-48 object-cover" />
                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur text-[#2D6A4F] text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                          {item.jumlah_porsi} porsi
                        </div>
                        {isExpiringSoon && (
                          <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                            ⚡ Segera habis
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-32 bg-gradient-to-br from-[#f0faf4] to-[#e8f7ef] flex items-center justify-center">
                        <span className="text-5xl">🍱</span>
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="text-base font-bold text-[#1a3a2a] mb-1">{item.nama_makanan}</h3>
                      {item.deskripsi && (
                        <p className="text-xs text-[#7a8a7a] mb-3 line-clamp-2">{item.deskripsi}</p>
                      )}

                      {/* Chips */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="inline-flex items-center gap-1 text-xs text-[#4a4a3a] bg-[#f5f3ee] px-2.5 py-1 rounded-full">
                          👤 {item.donor?.nama}
                        </span>
                        {item.warung?.nama_warung && (
                          <button
                            onClick={() => navigate(`/warung/${item.warung.id}`)}
                            className="inline-flex items-center gap-1 text-xs text-[#d4720a] bg-[#fef3e7] border border-[#f9d4a7] px-2.5 py-1 rounded-full font-medium hover:bg-[#fde5c4] transition-colors">
                            🏪 {item.warung.nama_warung}
                            {item.warung.is_verified && <span>✅</span>}
                            {item.warung.rating_avg > 0 && (
                              <span className="text-yellow-500">⭐{Number(item.warung.rating_avg).toFixed(1)}</span>
                            )}
                          </button>
                        )}
                        {item.kabupaten && (
                          <span className="inline-flex items-center gap-1 text-xs text-[#4a4a3a] bg-[#f5f3ee] px-2.5 py-1 rounded-full">
                            📍 {item.kabupaten}
                          </span>
                        )}
                        {sisaWaktu && (
                          <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${
                            isExpiringSoon ? 'bg-red-50 text-red-500' : 'bg-[#f5f3ee] text-[#9a9a8a]'
                          }`}>
                            ⏰ {sisaWaktu}
                          </span>
                        )}
                      </div>

                      {item.alamat && (
                        <p className="text-xs text-[#9a9a8a] mb-4 flex items-start gap-1">
                          <span>🏠</span>
                          <span className="line-clamp-1">{item.alamat}</span>
                        </p>
                      )}

                      {isDonorku ? (
                        <div className="w-full py-3 rounded-2xl bg-[#f5f3ee] border border-[#e8e4db] text-[#9a9a8a] text-sm font-medium text-center">
                          Ini donasimu sendiri
                        </div>
                      ) : (
                        <button
                          onClick={() => handleMulaiChat(item)}
                          className="w-full py-3.5 rounded-2xl bg-[#2D6A4F] hover:bg-[#235c43] text-white text-sm font-semibold transition-all">
                          💬 Chat dengan Donor
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="h-6" />
          </>
        )}
      </div>
    </Layout>
  )
}
