import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/Layout'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function DashboardKeluarga() {
  const { profile, user } = useAuth()
  const [stats, setStats] = useState({ tracking: 0, donasi: 0 })
  const [donasiTerbaru, setDonasiTerbaru] = useState([])
  const [loadingDonasi, setLoadingDonasi] = useState(true)

  const jam = new Date().getHours()
  const salam = jam < 11 ? 'Selamat pagi' : jam < 15 ? 'Selamat siang' : jam < 19 ? 'Selamat sore' : 'Selamat malam'

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    if (!user) return
    const [trackingRes, donasiRes] = await Promise.all([
      supabase.from('tracking_gizi').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', new Date().toISOString().split('T')[0]),
      supabase.from('donasi').select(`*, donor:profiles!donasi_donor_id_fkey(nama, kota)`).eq('status', 'tersedia').order('created_at', { ascending: false }).limit(3),
    ])
    setStats({ tracking: trackingRes.count || 0, donasi: donasiRes.data?.length || 0 })
    setDonasiTerbaru(donasiRes.data || [])
    setLoadingDonasi(false)
  }

  const badge = profile?.poin >= 2000 ? { icon: '🏆', label: 'Lumbung Master', color: 'text-purple-600 bg-purple-50' }
    : profile?.poin >= 500 ? { icon: '🌾', label: 'Petani Aktif', color: 'text-yellow-600 bg-yellow-50' }
    : { icon: '🌱', label: 'Penabur Benih', color: 'text-green-600 bg-green-50' }

  return (
    <Layout>
      <div className="w-full px-4 space-y-5">

        {/* ── GREETING HERO ── */}
        <div className="relative bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#40916C] rounded-3xl p-6 overflow-hidden shadow-xl shadow-[#2D6A4F]/20">
          {/* Decorative blobs */}
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/5" />
          <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-white/5" />
          <div className="absolute top-6 right-20 w-2 h-2 rounded-full bg-[#95d5b2]/60" />
          <div className="absolute bottom-10 right-10 w-3 h-3 rounded-full bg-[#F4A261]/50" />

          <div className="relative flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs text-white/60 mb-1">{salam} 👋</p>
              <h1 className="text-2xl font-bold text-white leading-tight">
                {profile?.nama?.split(' ')[0]}
              </h1>
              <p className="text-xs text-white/60 mt-1">{profile?.kota || 'Indonesia'}</p>

              {/* Badge */}
              <div className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/15 text-white`}>
                <span>{badge.icon}</span>
                <span>{badge.label}</span>
              </div>
            </div>

            {/* Avatar */}
            <div className="w-16 h-16 rounded-2xl bg-white/20 border-2 border-white/30 overflow-hidden flex-shrink-0 flex items-center justify-center">
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                : <span className="text-2xl font-bold text-white">{profile?.nama?.[0]?.toUpperCase() || 'U'}</span>
              }
            </div>
          </div>

          {/* Poin bar */}
          <div className="relative mt-5 bg-white/10 rounded-2xl p-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-white/60">Total Poin</p>
              <p className="text-xl font-bold text-white">⭐ {(profile?.poin || 0).toLocaleString()}</p>
            </div>
            <Link to="/gamifikasi"
              className="bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all border border-white/20">
              Lihat Reward →
            </Link>
          </div>
        </div>

        {/* ── STATS ROW ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: '📊', val: stats.tracking, label: 'Tracking hari ini', color: 'text-[#2D6A4F]' },
            { icon: '⭐', val: profile?.poin || 0, label: 'Total poin', color: 'text-[#F4A261]' },
            { icon: '🍱', val: donasiTerbaru.length, label: 'Donasi tersedia', color: 'text-blue-500' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-4 border border-[#e8e4db] text-center shadow-sm hover:shadow-md transition-shadow">
              <p className="text-lg mb-1">{s.icon}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
              <p className="text-[10px] text-[#9a9a8a] mt-0.5 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── QUICK ACTION AI NUTRISI ── */}
        <Link to="/nutrisi"
          className="block relative bg-gradient-to-r from-[#2D6A4F] to-[#40916C] rounded-2xl p-5 shadow-lg shadow-[#2D6A4F]/25 hover:shadow-xl hover:shadow-[#2D6A4F]/30 transition-all active:scale-[0.98] group overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-white/10 group-hover:scale-110 transition-transform" />
          <div className="relative flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-white/60 bg-white/15 px-2 py-0.5 rounded-full">✨ Fitur Unggulan</span>
              </div>
              <h2 className="text-lg font-bold text-white">Cek Gizi Makanan</h2>
              <p className="text-xs text-white/70 mt-1">Foto makananmu → AI analisis instan 📸</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              🤖
            </div>
          </div>
        </Link>

        {/* ── MENU GRID ── */}
        <div>
          <h2 className="text-sm font-semibold text-[#4a4a3a] mb-3">Fitur Lainnya</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: '🍱', title: 'Food Rescue', desc: 'Donasi makanan tersedia di sekitarmu', to: '/food-rescue', bg: 'from-orange-50 to-amber-50', border: 'border-orange-200', iconBg: 'bg-orange-100' },
              { icon: '📚', title: 'Pengetahuan', desc: 'Resep, video, chatbot gizi AI', to: '/pengetahuan', bg: 'from-blue-50 to-cyan-50', border: 'border-blue-200', iconBg: 'bg-blue-100' },
              { icon: '🏆', title: 'Poin & Reward', desc: 'Lihat badge dan leaderboard', to: '/gamifikasi', bg: 'from-purple-50 to-violet-50', border: 'border-purple-200', iconBg: 'bg-purple-100' },
              { icon: '💬', title: 'Chat', desc: 'Koordinasi pengambilan donasi', to: '/chat', bg: 'from-green-50 to-emerald-50', border: 'border-green-200', iconBg: 'bg-green-100' },
            ].map(card => (
              <Link key={card.to} to={card.to}
                className={`bg-gradient-to-br ${card.bg} border ${card.border} rounded-2xl p-4 hover:shadow-md transition-all active:scale-[0.98] group`}>
                <div className={`w-10 h-10 ${card.iconBg} rounded-xl flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition-transform`}>
                  {card.icon}
                </div>
                <p className="text-sm font-semibold text-[#1a3a2a]">{card.title}</p>
                <p className="text-xs text-[#6a7a6a] mt-1 leading-relaxed">{card.desc}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* ── DONASI TERDEKAT ── */}
        <div className="bg-white rounded-2xl border border-[#e8e4db] overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-[#f0ece4]">
            <h2 className="text-sm font-semibold text-[#1a3a2a]">🍱 Donasi Tersedia</h2>
            <Link to="/food-rescue" className="text-xs text-[#2D6A4F] font-semibold hover:underline">Lihat semua →</Link>
          </div>

          {loadingDonasi ? (
            <div className="p-4 space-y-3">
              {[1,2].map(i => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-12 h-12 bg-[#f0ece4] rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-[#f0ece4] rounded w-3/4" />
                    <div className="h-3 bg-[#f0ece4] rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : donasiTerbaru.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center px-4">
              <span className="text-3xl mb-2">🌾</span>
              <p className="text-sm text-[#4a4a3a] font-medium">Belum ada donasi di sekitarmu</p>
              <p className="text-xs text-[#9a9a8a] mt-1">Cek lagi nanti atau perluas jangkauan</p>
            </div>
          ) : (
            <div className="divide-y divide-[#f5f3ee]">
              {donasiTerbaru.map(item => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[#faf9f7] transition-colors">
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-[#f0faf4]">
                    {item.foto_url
                      ? <img src={item.foto_url} alt={item.nama_makanan} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-xl">🍱</div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1a3a2a] truncate">{item.nama_makanan}</p>
                    <p className="text-xs text-[#9a9a8a]">{item.jumlah_porsi} porsi · {item.donor?.nama}</p>
                  </div>
                  <Link to="/food-rescue"
                    className="text-xs bg-[#2D6A4F] text-white px-3 py-1.5 rounded-xl font-medium flex-shrink-0 hover:bg-[#235c43] transition-colors">
                    Ambil
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="h-4" />
      </div>
    </Layout>
  )
}
