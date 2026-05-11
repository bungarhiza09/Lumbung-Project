import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/Layout'
import { Link } from 'react-router-dom'

const MENU_CARDS = [
  {
    icon: '📸',
    title: 'Cek Gizi Makanan',
    desc: 'Foto makanan kamu, AI langsung analisis kandungan gizinya',
    to: '/nutrisi',
    color: 'bg-[#E1F5EE]',
    border: 'border-[#b7e4cc]',
    accent: '#2D6A4F',
  },
  {
    icon: '🍱',
    title: 'Food Rescue',
    desc: 'Lihat donasi makanan tersedia di sekitar kamu',
    to: '/food-rescue',
    color: 'bg-[#FEF3E7]',
    border: 'border-[#f9d4a7]',
    accent: '#d4720a',
  },
  {
    icon: '🗓️',
    title: 'Meal Planner',
    desc: 'Rencanakan menu harian sesuai budget & kebutuhan gizi',
    to: '/nutrisi/planner',
    color: 'bg-[#EDE9FE]',
    border: 'border-[#c4b8f9]',
    accent: '#5b21b6',
  },
  {
    icon: '📚',
    title: 'Pengetahuan',
    desc: 'Resep lokal bergizi, video edukasi, & chatbot nutrisi AI',
    to: '/pengetahuan',
    color: 'bg-[#E0F2FE]',
    border: 'border-[#b0d9f5]',
    accent: '#0369a1',
  },
]

export default function DashboardKeluarga() {
  const { profile } = useAuth()

  const jam = new Date().getHours()
  const salam = jam < 11 ? 'Selamat pagi' : jam < 15 ? 'Selamat siang' : jam < 19 ? 'Selamat sore' : 'Selamat malam'

  return (
    <Layout>
      {/* Greeting */}
      <div className="mb-6">
        <p className="text-sm text-[#5a7a6a]">{salam},</p>
        <h1 className="text-2xl font-bold text-[#1a3a2a]">{profile?.nama?.split(' ')[0]} 👋</h1>
        <p className="text-sm text-[#7a8a7a] mt-1">Yuk pantau gizi keluargamu hari ini</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-2xl p-4 border border-[#e8e4db] text-center">
          <div className="text-2xl font-bold text-[#2D6A4F]">0</div>
          <div className="text-xs text-[#9a9a8a] mt-1">Tracking hari ini</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-[#e8e4db] text-center">
          <div className="text-2xl font-bold text-[#F4A261]">{profile?.poin || 0}</div>
          <div className="text-xs text-[#9a9a8a] mt-1">Total poin</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-[#e8e4db] text-center">
          <div className="text-2xl font-bold text-[#5b21b6]">0</div>
          <div className="text-xs text-[#9a9a8a] mt-1">Donasi diterima</div>
        </div>
      </div>

      {/* Quick Action — AI Nutrisi */}
      <div className="bg-[#2D6A4F] rounded-2xl p-5 mb-6 flex items-center justify-between text-white shadow-lg shadow-[#2D6A4F]/20">
        <div>
          <div className="text-xs font-medium opacity-75 mb-1">Fitur Utama</div>
          <div className="text-lg font-bold">Cek Gizi Sekarang</div>
          <div className="text-xs opacity-75 mt-1">Foto makananmu → AI analisis instan</div>
        </div>
        <Link
          to="/nutrisi"
          className="bg-white text-[#2D6A4F] font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-[#f0faf4] transition-all flex-shrink-0 ml-4"
        >
          Mulai 📸
        </Link>
      </div>

      {/* Menu Cards */}
      <h2 className="text-sm font-semibold text-[#4a4a3a] mb-3">Fitur Lainnya</h2>
      <div className="grid grid-cols-2 gap-3 mb-6">
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

      {/* Donasi Terdekat Preview */}
      <div className="bg-white rounded-2xl border border-[#e8e4db] p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[#1a3a2a]">🍱 Donasi Terdekat</h2>
          <Link to="/food-rescue" className="text-xs text-[#2D6A4F] font-medium">Lihat semua →</Link>
        </div>
        <div className="flex flex-col items-center py-6 text-center">
          <div className="text-3xl mb-2">🌾</div>
          <div className="text-sm text-[#4a4a3a] font-medium">Belum ada donasi di sekitarmu</div>
          <div className="text-xs text-[#9a9a8a] mt-1">Cek lagi nanti atau perluas jangkauan</div>
        </div>
      </div>
    </Layout>
  )
}