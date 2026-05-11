import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/Layout'

export default function FoodRescue() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [donasi, setDonasi] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('semua')

  useEffect(() => {
    fetchDonasi()
    const channel = supabase
      .channel('donasi-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'donasi' }, fetchDonasi)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchDonasi() {
    const { data } = await supabase
      .from('donasi')
      .select(`*, donor:profiles!donasi_donor_id_fkey(nama, kota, kabupaten)`)
      .eq('status', 'tersedia')
      .order('created_at', { ascending: false })
    setDonasi(data || [])
    setLoading(false)
  }

  async function handleMulaiChat(item) {
    const { data: existingRoom } = await supabase
      .from('chat_rooms').select('id')
      .eq('donasi_id', item.id).eq('penerima_id', user.id).single()
    if (existingRoom) { navigate(`/chat/${existingRoom.id}`); return }
    const { data: newRoom } = await supabase
      .from('chat_rooms')
      .insert({ donasi_id: item.id, donor_id: item.donor_id, penerima_id: user.id })
      .select().single()
    if (newRoom) navigate(`/chat/${newRoom.id}`)
  }

  function hitungSisaWaktu(expiredAt) {
    if (!expiredAt) return null
    const diff = new Date(expiredAt) - new Date()
    if (diff <= 0) return 'Kadaluarsa'
    const jam = Math.floor(diff / 3600000)
    const menit = Math.floor((diff % 3600000) / 60000)
    return jam > 0 ? `${jam} jam lagi` : `${menit} menit lagi`
  }

  const filtered = filter === 'semua'
    ? donasi
    : donasi.filter(d => {
        if (!profile?.kabupaten) return true
        return (
          d.kabupaten?.toLowerCase() === profile.kabupaten?.toLowerCase() ||
          d.provinsi?.toLowerCase() === profile.provinsi?.toLowerCase()
        )
      })

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">

        {/* Hero Banner */}
        <div className="relative bg-[#2D6A4F] rounded-3xl p-6 mb-6 overflow-hidden">
          {/* Dekorasi lingkaran */}
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
          <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-white/5" />
          <div className="absolute top-4 right-16 w-3 h-3 rounded-full bg-[#F4A261]/60" />
          <div className="absolute bottom-8 right-8 w-2 h-2 rounded-full bg-white/40" />

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
                  Hubungkan surplus makanan dari warung & rumah tangga ke keluarga yang membutuhkan. Setiap porsi yang diselamatkan = satu keluarga terbantu.
                </p>
              </div>
            </div>

            {/* Stats mini */}
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

        {/* Cara Kerja */}
        <div className="bg-white rounded-2xl border border-[#e8e4db] p-4 mb-5">
          <p className="text-xs font-semibold text-[#4a4a3a] mb-3">💡 Cara Kerja</p>
          <div className="flex items-center gap-2">
            {[
              { icon: '📤', text: 'Donor upload makanan surplus' },
              { icon: '💬', text: 'Chat & sepakati pengambilan' },
              { icon: '✅', text: 'Konfirmasi → poin bertambah' },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-2 flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className="w-8 h-8 rounded-full bg-[#f0faf4] flex items-center justify-center text-base mb-1">
                    {step.icon}
                  </div>
                  <p className="text-center text-[10px] text-[#7a8a7a] leading-tight">{step.text}</p>
                </div>
                {i < 2 && <div className="text-[#b7e4cc] text-lg mb-4">›</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Filter & Tombol Donasi */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            {['semua', 'kotaku'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  filter === f
                    ? 'bg-[#2D6A4F] text-white shadow-md shadow-[#2D6A4F]/20'
                    : 'bg-white text-[#4a4a3a] border border-[#e8e4db] hover:bg-[#f0faf4]'
                }`}
              >
                {f === 'semua' ? '🌍 Semua Wilayah' : `📍 ${profile?.kota || 'Kotaku'}`}
              </button>
            ))}
          </div>
          <Link
            to="/donasi/buat"
            className="bg-[#F4A261] hover:bg-[#e8924f] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-[#F4A261]/30 flex items-center gap-1"
          >
            <span>+</span> Donasi
          </Link>
        </div>

        {/* Label jumlah */}
        <p className="text-xs text-[#9a9a8a] mb-4">
          Menampilkan <span className="font-semibold text-[#2D6A4F]">{filtered.length} donasi</span> tersedia
        </p>

        {/* Loading */}
        {loading && (
          <div className="text-center py-16">
            <div className="text-4xl mb-3 animate-bounce">🍱</div>
            <p className="text-sm text-[#9a9a8a]">Memuat donasi terdekat...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 bg-white rounded-3xl border border-[#e8e4db]">
            <div className="text-5xl mb-3">🌾</div>
            <p className="text-sm font-semibold text-[#4a4a3a]">
              Belum ada donasi tersedia
            </p>
            <p className="text-xs text-[#9a9a8a] mt-1 mb-4">
              {filter === 'kotaku'
                ? `Belum ada donasi di sekitar ${profile?.kota || 'wilayahmu'}`
                : 'Jadilah yang pertama berbagi!'}
            </p>
            {filter === 'kotaku' && (
              <button
                onClick={() => setFilter('semua')}
                className="text-xs text-[#2D6A4F] font-medium underline block mb-3 mx-auto"
              >
                Lihat semua wilayah →
              </button>
            )}
            <Link
              to="/donasi/buat"
              className="inline-block bg-[#2D6A4F] text-white text-sm font-semibold px-6 py-3 rounded-2xl shadow-md shadow-[#2D6A4F]/20"
            >
              📤 Mulai Donasi Sekarang
            </Link>
          </div>
        )}

        {/* List Donasi */}
        <div className="space-y-4">
          {filtered.map((item, idx) => {
            const sisaWaktu = hitungSisaWaktu(item.expired_at)
            const isExpiringSoon = item.expired_at &&
              (new Date(item.expired_at) - new Date()) < 3600000
            const isDonorku = item.donor_id === user?.id

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-[#e8e4db] overflow-hidden hover:shadow-lg hover:shadow-black/5 transition-all group"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {/* Foto */}
                {item.foto_url ? (
                  <div className="relative overflow-hidden">
                    <img
                      src={item.foto_url}
                      alt={item.nama_makanan}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Badge porsi di atas foto */}
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
                  <div className="w-full h-32 bg-gradient-to-br from-[#f0faf4] to-[#e8f7ef] flex items-center justify-center relative">
                    <span className="text-5xl">🍱</span>
                    <div className="absolute top-3 right-3 bg-white text-[#2D6A4F] text-xs font-bold px-3 py-1.5 rounded-full shadow-sm border border-[#b7e4cc]">
                      {item.jumlah_porsi} porsi
                    </div>
                  </div>
                )}

                <div className="p-4">
                  {/* Nama */}
                  <h3 className="text-base font-bold text-[#1a3a2a] mb-1">
                    {item.nama_makanan}
                  </h3>
                  {item.deskripsi && (
                    <p className="text-xs text-[#7a8a7a] mb-3 line-clamp-2 leading-relaxed">
                      {item.deskripsi}
                    </p>
                  )}

                  {/* Info chips */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="inline-flex items-center gap-1 text-xs text-[#4a4a3a] bg-[#f5f3ee] px-2.5 py-1 rounded-full">
                      👤 {item.donor?.nama}
                    </span>
                    {item.kabupaten && (
                      <span className="inline-flex items-center gap-1 text-xs text-[#4a4a3a] bg-[#f5f3ee] px-2.5 py-1 rounded-full">
                        📍 {item.kabupaten}
                      </span>
                    )}
                    {item.kecamatan && (
                      <span className="inline-flex items-center gap-1 text-xs text-[#4a4a3a] bg-[#f5f3ee] px-2.5 py-1 rounded-full">
                        🏘️ {item.kecamatan}
                      </span>
                    )}
                    {sisaWaktu && (
                      <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${
                        isExpiringSoon
                          ? 'bg-red-50 text-red-500'
                          : 'bg-[#f5f3ee] text-[#9a9a8a]'
                      }`}>
                        ⏰ {sisaWaktu}
                      </span>
                    )}
                  </div>

                  {/* Alamat jalan */}
                  {item.alamat && (
                    <p className="text-xs text-[#9a9a8a] mb-4 flex items-start gap-1">
                      <span>🏠</span>
                      <span className="line-clamp-1">{item.alamat}</span>
                    </p>
                  )}

                  {/* Tombol */}
                  {isDonorku ? (
                    <div className="w-full py-3 rounded-2xl bg-[#f5f3ee] border border-[#e8e4db] text-[#9a9a8a] text-sm font-medium text-center">
                      Ini donasimu sendiri
                    </div>
                  ) : (
                    <button
                      onClick={() => handleMulaiChat(item)}
                      className="w-full py-3.5 rounded-2xl bg-[#2D6A4F] hover:bg-[#235c43] active:scale-[0.98] text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-md shadow-[#2D6A4F]/20"
                    >
                      💬 Chat dengan Donor
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom info */}
        {filtered.length > 0 && (
          <div className="mt-6 text-center">
            <p className="text-xs text-[#9a9a8a]">
              Tidak menemukan yang kamu cari?
            </p>
            <Link to="/donasi/buat" className="text-xs text-[#2D6A4F] font-semibold">
              Donasikan makananmu sendiri →
            </Link>
          </div>
        )}

        <div className="h-6" />
      </div>
    </Layout>
  )
}