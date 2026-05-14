import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/Layout'

export default function ImpactDashboard() {
  const { user, profile } = useAuth()
  const [stats, setStats] = useState(null)
  const [riwayat, setRiwayat] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchStats() }, [])

  async function fetchStats() {
    const { data: donasi } = await supabase
      .from('donasi')
      .select('*')
      .eq('donor_id', user.id)

    const total = donasi?.length || 0
    const diambil = donasi?.filter(d => d.status === 'diambil').length || 0
    const totalPorsi = donasi?.reduce((sum, d) => sum + (d.jumlah_porsi || 0), 0) || 0
    const foodWaste = Math.round(totalPorsi * 0.3)
    const co2 = Math.round(foodWaste * 2.5)

    setStats({ total, diambil, totalPorsi, foodWaste, co2 })
    setRiwayat(donasi?.slice(0, 5) || [])
    setLoading(false)
  }

  if (loading) return (
    <Layout>
      <div className="text-center py-20">
        <div className="text-3xl animate-bounce">📊</div>
        <p className="text-sm text-[#9a9a8a] mt-2">Menghitung dampakmu...</p>
      </div>
    </Layout>
  )

  const verifiedProgress = Math.min((stats.total / 20) * 100, 100)

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#1a3a2a]">📊 Dashboard Impact</h1>
          <p className="text-sm text-[#7a8a7a] mt-1">Dampak nyata donasimu untuk komunitas</p>
        </div>

        {/* Hero Impact */}
        <div className="relative bg-gradient-to-br from-[#2D6A4F] to-[#3a8a66] rounded-3xl p-5 mb-5 text-white overflow-hidden">
          <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/5" />
          <div className="absolute -bottom-6 left-8 w-24 h-24 rounded-full bg-white/5" />
          <div className="relative">
            <p className="text-xs opacity-75 mb-1">Total dampak donasimu</p>
            <div className="text-4xl font-bold mb-1">{stats.diambil}</div>
            <p className="text-sm opacity-80">keluarga telah terbantu 🙏</p>
            <div className="flex gap-4 mt-4">
              <div className="bg-white/10 rounded-xl px-3 py-2">
                <div className="text-lg font-bold">{stats.totalPorsi}</div>
                <div className="text-xs opacity-70">total porsi</div>
              </div>
              <div className="bg-white/10 rounded-xl px-3 py-2">
                <div className="text-lg font-bold">{stats.foodWaste} kg</div>
                <div className="text-xs opacity-70">food waste diselamatkan</div>
              </div>
              <div className="bg-white/10 rounded-xl px-3 py-2">
                <div className="text-lg font-bold">{stats.co2} kg</div>
                <div className="text-xs opacity-70">CO₂ dihemat</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[
            { icon: '📤', label: 'Total Donasi Diposting', value: stats.total, unit: 'kali', color: 'text-[#F4A261]' },
            { icon: '✅', label: 'Berhasil Diambil', value: stats.diambil, unit: 'donasi', color: 'text-[#2D6A4F]' },
            { icon: '🍱', label: 'Total Porsi Tersalurkan', value: stats.totalPorsi, unit: 'porsi', color: 'text-blue-500' },
            { icon: '⭐', label: 'Lumbung Poin', value: profile?.poin || 0, unit: 'poin', color: 'text-[#F4A261]' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-[#e8e4db] p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{s.icon}</span>
                <p className="text-xs text-[#7a8a7a] leading-tight">{s.label}</p>
              </div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-[#9a9a8a]">{s.unit}</div>
            </div>
          ))}
        </div>

        {/* Lumbung Verified Progress */}
        <div className="bg-white rounded-2xl border border-[#e8e4db] p-4 mb-5">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🏅</span>
            <div>
              <p className="text-sm font-semibold text-[#1a3a2a]">Progress Lumbung Verified</p>
              <p className="text-xs text-[#9a9a8a]">Donasi 20x untuk dapat badge verified</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-sm font-bold text-[#2D6A4F]">{stats.total}/20</p>
            </div>
          </div>
          <div className="bg-[#f0ece4] rounded-full h-3 overflow-hidden">
            <div
              className="h-3 bg-gradient-to-r from-[#2D6A4F] to-[#F4A261] rounded-full transition-all duration-500"
              style={{ width: `${verifiedProgress}%` }}
            />
          </div>
          {stats.total >= 20 && (
            <div className="mt-3 bg-[#f0faf4] rounded-xl p-3 text-center border border-[#b7e4cc]">
              <p className="text-sm text-[#2D6A4F] font-semibold">
                🎉 Selamat! Kamu sudah Lumbung Verified!
              </p>
            </div>
          )}
        </div>

        {/* Sertifikat CSR */}
        <div className="bg-gradient-to-br from-[#F4A261] to-[#e8924f] rounded-2xl p-4 mb-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-80 mb-1">Laporan Dampak Sosial</p>
              <p className="text-sm font-bold">Download Sertifikat CSR</p>
              <p className="text-xs opacity-75 mt-1">Cocok untuk laporan sustainability perusahaan</p>
            </div>
            <button className="bg-white text-[#d4720a] text-xs font-bold px-3 py-2 rounded-xl flex-shrink-0 ml-3">
              📄 Download
            </button>
          </div>
        </div>

        {/* Riwayat Terbaru */}
        <div className="bg-white rounded-2xl border border-[#e8e4db] p-4">
          <p className="text-sm font-semibold text-[#1a3a2a] mb-3">📋 Donasi Terbaru</p>
          {riwayat.length === 0 ? (
            <p className="text-xs text-[#9a9a8a] text-center py-4">Belum ada donasi</p>
          ) : (
            <div className="space-y-3">
              {riwayat.map(item => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#f0faf4] flex items-center justify-center flex-shrink-0">
                    <span className="text-sm">🍱</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#1a3a2a] truncate">{item.nama_makanan}</p>
                    <p className="text-xs text-[#9a9a8a]">{item.jumlah_porsi} porsi</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    item.status === 'diambil'
                      ? 'bg-[#f0faf4] text-[#2D6A4F]'
                      : item.status === 'tersedia'
                      ? 'bg-orange-50 text-orange-500'
                      : 'bg-[#f5f3ee] text-[#9a9a8a]'
                  }`}>
                    {item.status === 'diambil' ? '✅ Diambil' : item.status === 'tersedia' ? '🟡 Aktif' : '⏰ Expired'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="h-6" />
      </div>
    </Layout>
  )
}