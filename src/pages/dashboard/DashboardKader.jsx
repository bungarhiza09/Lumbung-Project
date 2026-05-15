// src/pages/DashboardKader.jsx
// Updated: stats & alert diambil real dari Supabase
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/Layout'
import { useBalitaList, useAlertCluster } from '../../hooks/useBalita'

const MENU_CARDS = [
  {
    icon: '👶',
    title: 'Input Data Balita',
    desc: 'Tambah atau update data tumbuh kembang balita',
    to: '/balita/input',
    color: 'bg-[#E1F5EE]',
    border: 'border-[#b7e4cc]',
  },
  {
    icon: '📋',
    title: 'Daftar Balita',
    desc: 'Lihat semua data balita di wilayahmu',
    to: '/balita',
    color: 'bg-[#FEF3E7]',
    border: 'border-[#f9d4a7]',
  },
  {
    icon: '🗺️',
    title: 'Peta Gizi',
    desc: 'Heatmap risiko stunting per wilayah',
    to: '/peta-gizi',
    color: 'bg-[#EDE9FE]',
    border: 'border-[#c4b8f9]',
  },
  {
    icon: '📈',
    title: 'Tren Gizi',
    desc: 'Grafik tren stunting bulanan',
    to: '/tren-gizi',
    color: 'bg-[#E1F5EE]',
    border: 'border-[#b7e4cc]',
  },
  {
    icon: '📄',
    title: 'Export Laporan',
    desc: 'Download laporan PDF untuk Puskesmas',
    to: '/laporan',
    color: 'bg-[#E0F2FE]',
    border: 'border-[#b0d9f5]',
  },
]

const STATUS_ALERT_COLOR = {
  merah:  'bg-red-50 border-red-200 text-red-700',
  kuning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
}

function AlertItem({ alert }) {
  const wilayah = alert.wilayah
  const tgl = new Date(alert.created_at).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
  })

  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-3">
      <div className="flex items-start gap-2">
        <span className="text-base mt-0.5">🚨</span>
        <div className="flex-1">
          <p className="text-xs font-bold text-red-700">
            Cluster Stunting — RT {alert.rt} RW {alert.rw}
          </p>
          <p className="text-xs text-red-600 mt-0.5">
            {wilayah?.kelurahan}, {wilayah?.kecamatan}
          </p>
          <p className="text-xs text-red-500 mt-0.5">
            {alert.jumlah_kasus} anak berstatus stunting baru · {tgl}
          </p>
        </div>
        <span className="text-[10px] font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full flex-shrink-0">
          Aktif
        </span>
      </div>
    </div>
  )
}

export default function DashboardKader() {
  const { profile } = useAuth()

  const { data: balitaList, fetch: fetchBalita } = useBalitaList()
  const { data: alerts, fetch: fetchAlerts }     = useAlertCluster()

  useEffect(() => {
    fetchBalita({})
    fetchAlerts()
  }, [])

  // Hitung stats real
  const stats = {
    total:    balitaList.length,
    stunting: balitaList.filter(b => ['stunting','gizi_buruk'].includes(b.status_gizi)).length,
    berisiko: balitaList.filter(b => b.status_gizi === 'berisiko').length,
  }

  const jam   = new Date().getHours()
  const salam = jam < 11 ? 'Selamat pagi' : jam < 15 ? 'Selamat siang' : jam < 19 ? 'Selamat sore' : 'Selamat malam'

  return (
    <Layout>
      {/* Greeting */}
      <div className="mb-6">
        <p className="text-sm text-[#5a7a6a]">{salam}, Kader</p>
        <h1 className="text-2xl font-bold text-[#1a3a2a]">{profile?.nama?.split(' ')[0]} 👩‍⚕️</h1>
        <p className="text-sm text-[#7a8a7a] mt-1">
          Pantau gizi balita wilayah {profile?.kota || profile?.kelurahan || 'kamu'}
        </p>
      </div>

      {/* Stats Row — real data */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Link to="/balita" className="bg-white rounded-2xl p-4 border border-[#e8e4db] text-center hover:border-[#2D6A4F] transition-all">
          <div className="text-2xl font-bold text-[#2D6A4F]">{stats.total}</div>
          <div className="text-xs text-[#9a9a8a] mt-1">Total balita</div>
        </Link>
        <Link to="/balita?filter=stunting" className="bg-white rounded-2xl p-4 border border-[#e8e4db] text-center hover:border-red-300 transition-all">
          <div className="text-2xl font-bold text-red-500">{stats.stunting}</div>
          <div className="text-xs text-[#9a9a8a] mt-1">Stunting</div>
        </Link>
        <Link to="/balita?filter=berisiko" className="bg-white rounded-2xl p-4 border border-[#e8e4db] text-center hover:border-yellow-300 transition-all">
          <div className="text-2xl font-bold text-yellow-500">{stats.berisiko}</div>
          <div className="text-xs text-[#9a9a8a] mt-1">Berisiko</div>
        </Link>
      </div>

      {/* Alert Box — real data */}
      <div className="bg-white rounded-2xl border border-[#e8e4db] p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-base">🚨</span>
            <h2 className="text-sm font-semibold text-[#1a3a2a]">Alert Terbaru</h2>
          </div>
          {alerts.length > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {alerts.length}
            </span>
          )}
        </div>

        {alerts.length === 0 ? (
          <div className="flex flex-col items-center py-4 text-center">
            <div className="text-2xl mb-2">✅</div>
            <div className="text-sm text-[#4a4a3a] font-medium">Tidak ada alert saat ini</div>
            <div className="text-xs text-[#9a9a8a] mt-1">
              Sistem akan notifikasi jika ada cluster stunting baru
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.slice(0, 3).map(a => <AlertItem key={a.id} alert={a} />)}
            {alerts.length > 3 && (
              <p className="text-xs text-center text-[#534AB7] font-semibold pt-1">
                +{alerts.length - 3} alert lainnya
              </p>
            )}
          </div>
        )}
      </div>

      {/* Quick Action */}
      <div className="bg-[#534AB7] rounded-2xl p-5 mb-6 flex items-center justify-between text-white shadow-lg shadow-[#534AB7]/20">
        <div>
          <div className="text-xs font-medium opacity-75 mb-1">Input rutin posyandu</div>
          <div className="text-lg font-bold">Tambah Data Balita</div>
          <div className="text-xs opacity-75 mt-1">Input BB & TB → status gizi otomatis</div>
        </div>
        <Link
          to="/balita/input"
          className="bg-white text-[#534AB7] font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-purple-50 transition-all flex-shrink-0 ml-4"
        >
          Input 👶
        </Link>
      </div>

      {/* Menu Cards */}
      <h2 className="text-sm font-semibold text-[#4a4a3a] mb-3">Menu Kader</h2>
      <div className="grid grid-cols-2 gap-3">
        {MENU_CARDS.map(card => (
          <Link
            key={card.to}
            to={card.to}
            className={`${card.color} border ${card.border} rounded-2xl p-4 hover:shadow-md transition-all active:scale-[0.98]`}
          >
            <div className="text-2xl mb-2">{card.icon}</div>
            <div className="text-sm font-semibold text-[#1a3a2a]">{card.title}</div>
            <div className="text-xs text-[#6a7a6a] mt-1 leading-relaxed">{card.desc}</div>
          </Link>
        ))}
      </div>
    </Layout>
  )
}