import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/Layout'

export default function DashboardWarung() {
  const { user, profile } = useAuth()
  const [stats, setStats] = useState({ aktif: 0, totalPorsi: 0, diambil: 0 })
  const [donasiTerbaru, setDonasiTerbaru] = useState([])
  const [verifiedCount, setVerifiedCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchStats() }, [])

  async function fetchStats() {
    const { data } = await supabase.from('donasi').select('*').eq('donor_id', user.id)
    const aktif = data?.filter(d => d.status === 'tersedia').length || 0
    const diambil = data?.filter(d => d.status === 'diambil').length || 0
    const totalPorsi = data?.reduce((sum, d) => sum + (d.jumlah_porsi || 0), 0) || 0
    setStats({ aktif, totalPorsi, diambil })
    setVerifiedCount(data?.length || 0)
    setDonasiTerbaru(data?.slice(0, 3) || [])
    setLoading(false)
  }

  const jam = new Date().getHours()
  const salam = jam < 11 ? 'Selamat pagi' : jam < 15 ? 'Selamat siang' : jam < 19 ? 'Selamat sore' : 'Selamat malam'
  const verifiedProgress = Math.min((verifiedCount / 20) * 100, 100)
  const isVerified = verifiedCount >= 20

  return (
    <Layout>
      <div className="w-full px-4 space-y-5">

        {/* ── GREETING HERO ── */}
        <div className="relative bg-gradient-to-br from-[#7C3A00] via-[#c05e1a] to-[#F4A261] rounded-3xl p-6 overflow-hidden shadow-xl shadow-[#F4A261]/20">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/5" />
          <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-white/5" />
          <div className="absolute top-6 right-20 w-2 h-2 rounded-full bg-white/40" />

          <div className="relative flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs text-white/60 mb-1">{salam} 🍜</p>
              <h1 className="text-2xl font-bold text-white">{profile?.nama?.split(' ')[0]}</h1>
              <p className="text-xs text-white/60 mt-1">Warung · {profile?.kota || 'Indonesia'}</p>
              {isVerified && (
                <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/20 text-white">
                  ✅ Lumbung Verified
                </div>
              )}
            </div>
            <div className="w-16 h-16 rounded-2xl bg-white/20 border-2 border-white/30 overflow-hidden flex-shrink-0 flex items-center justify-center">
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                : <span className="text-2xl font-bold text-white">{profile?.nama?.[0]?.toUpperCase() || 'W'}</span>
              }
            </div>
          </div>

          <div className="relative mt-5 bg-white/10 rounded-2xl p-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-white/60">Lumbung Poin</p>
              <p className="text-xl font-bold text-white">⭐ {(profile?.poin || 0).toLocaleString()}</p>
            </div>
            <Link to="/gamifikasi"
              className="bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all border border-white/20">
              Lihat Reward →
            </Link>
          </div>
        </div>

        {/* ── STATS ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: '🟡', val: loading ? '...' : stats.aktif, label: 'Donasi aktif', color: 'text-orange-500' },
            { icon: '🥘', val: loading ? '...' : stats.totalPorsi, label: 'Total porsi', color: 'text-[#F4A261]' },
            { icon: '✅', val: loading ? '...' : stats.diambil, label: 'Sudah diambil', color: 'text-[#2D6A4F]' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-4 border border-[#e8e4db] text-center shadow-sm">
              <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
              <p className="text-[10px] text-[#9a9a8a] mt-1 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── QUICK ACTION ── */}
        <Link to="/donasi/buat"
          className="block relative bg-gradient-to-r from-[#F4A261] to-[#e07b3a] rounded-2xl p-5 shadow-lg shadow-[#F4A261]/25 hover:shadow-xl transition-all active:scale-[0.98] group overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-white/10 group-hover:scale-110 transition-transform" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-xs text-white/70 mb-1">Ada sisa makanan?</p>
              <h2 className="text-lg font-bold text-white">Donasikan Sekarang</h2>
              <p className="text-xs text-white/70 mt-1">Posting surplus dalam 1 menit 📤</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              📤
            </div>
          </div>
        </Link>

        {/* ── STATUS VERIFIED ── */}
        <div className={`rounded-2xl border p-4 ${isVerified ? 'bg-[#f0faf4] border-[#b7e4cc]' : 'bg-white border-[#e8e4db]'}`}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#f5f3ee] flex items-center justify-center text-2xl flex-shrink-0">
              {isVerified ? '✅' : '🏅'}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#1a3a2a]">
                {isVerified ? 'Lumbung Verified! 🎉' : 'Menuju Status Verified'}
              </p>
              <p className="text-xs text-[#9a9a8a] mt-0.5">
                {isVerified
                  ? 'Warungmu sudah donasi 20+ kali. Terima kasih!'
                  : `${20 - verifiedCount} donasi lagi untuk dapat label Verified`}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-[#f0ece4] rounded-full">
                  <div className="h-1.5 bg-[#2D6A4F] rounded-full transition-all" style={{ width: `${verifiedProgress}%` }} />
                </div>
                <span className="text-xs font-bold text-[#2D6A4F]">{verifiedCount}/20</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── DONASI TERBARU ── */}
        {donasiTerbaru.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#e8e4db] overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-[#f0ece4]">
              <h2 className="text-sm font-semibold text-[#1a3a2a]">📋 Donasi Terbaru</h2>
              <Link to="/donasi/riwayat" className="text-xs text-[#2D6A4F] font-semibold hover:underline">Lihat semua →</Link>
            </div>
            <div className="divide-y divide-[#f5f3ee]">
              {donasiTerbaru.map(item => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-10 h-10 rounded-xl bg-[#f0faf4] flex items-center justify-center flex-shrink-0 text-lg">
                    🍱
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#1a3a2a] truncate">{item.nama_makanan}</p>
                    <p className="text-xs text-[#9a9a8a]">{item.jumlah_porsi} porsi</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${
                    item.status === 'diambil' ? 'bg-[#f0faf4] text-[#2D6A4F]'
                    : item.status === 'tersedia' ? 'bg-orange-50 text-orange-500'
                    : 'bg-[#f5f3ee] text-[#9a9a8a]'
                  }`}>
                    {item.status === 'diambil' ? '✅ Diambil' : item.status === 'tersedia' ? '🟡 Aktif' : '⏰ Expired'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── MENU CARDS ── */}
        <div>
          <h2 className="text-sm font-semibold text-[#4a4a3a] mb-3">Menu Warung</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: '📤', title: 'Posting Donasi', desc: 'Upload surplus makananmu sekarang', to: '/donasi/buat', bg: 'from-green-50 to-emerald-50', border: 'border-green-200', iconBg: 'bg-green-100' },
              { icon: '📋', title: 'Riwayat Donasi', desc: 'Semua donasi yang pernah kamu buat', to: '/donasi/riwayat', bg: 'from-orange-50 to-amber-50', border: 'border-orange-200', iconBg: 'bg-orange-100' },
              { icon: '📊', title: 'Dashboard Impact', desc: 'Total porsi tersalurkan & dampakmu', to: '/impact', bg: 'from-purple-50 to-violet-50', border: 'border-purple-200', iconBg: 'bg-purple-100' },
              { icon: '⚙️', title: 'Smart Warung', desc: 'AI prediksi & kelola warungmu', to: '/smart-warung', bg: 'from-blue-50 to-cyan-50', border: 'border-blue-200', iconBg: 'bg-blue-100' },
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

        <div className="h-4" />
      </div>
    </Layout>
  )
}
