import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/Layout'

const MENU_CARDS = [
  {
    icon: '📤',
    title: 'Posting Donasi',
    desc: 'Upload surplus makananmu sekarang',
    to: '/donasi/buat',
    color: 'bg-[#E1F5EE]',
    border: 'border-[#b7e4cc]',
  },
  {
    icon: '📋',
    title: 'Riwayat Donasi',
    desc: 'Lihat semua donasi yang pernah kamu buat',
    to: '/donasi/riwayat',
    color: 'bg-[#FEF3E7]',
    border: 'border-[#f9d4a7]',
  },
  {
    icon: '📊',
    title: 'Dashboard Impact',
    desc: 'Total porsi tersalurkan & keluarga terbantu',
    to: '/impact',
    color: 'bg-[#EDE9FE]',
    border: 'border-[#c4b8f9]',
  },
  {
    icon: '⏰',
    title: 'Jadwal Donasi',
    desc: 'Set donasi rutin otomatis setiap hari',
    to: '/donasi/jadwal',
    color: 'bg-[#E0F2FE]',
    border: 'border-[#b0d9f5]',
  },
]

export default function DashboardWarung() {
  const { profile } = useAuth()

  const jam = new Date().getHours()
  const salam = jam < 11 ? 'Selamat pagi' : jam < 15 ? 'Selamat siang' : jam < 19 ? 'Selamat sore' : 'Selamat malam'

  return (
    <Layout>
      {/* Greeting */}
      <div className="mb-6">
        <p className="text-sm text-[#5a7a6a]">{salam},</p>
        <h1 className="text-2xl font-bold text-[#1a3a2a]">{profile?.nama?.split(' ')[0]} 🍜</h1>
        <p className="text-sm text-[#7a8a7a] mt-1">Kelola donasi makanan warungmu hari ini</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-2xl p-4 border border-[#e8e4db] text-center">
          <div className="text-2xl font-bold text-[#2D6A4F]">0</div>
          <div className="text-xs text-[#9a9a8a] mt-1">Donasi aktif</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-[#e8e4db] text-center">
          <div className="text-2xl font-bold text-[#F4A261]">0</div>
          <div className="text-xs text-[#9a9a8a] mt-1">Total porsi</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-[#e8e4db] text-center">
          <div className="text-2xl font-bold text-[#5b21b6]">{profile?.poin || 0}</div>
          <div className="text-xs text-[#9a9a8a] mt-1">Poin earned</div>
        </div>
      </div>

      {/* Quick Action */}
      <div className="bg-[#F4A261] rounded-2xl p-5 mb-6 flex items-center justify-between text-white shadow-lg shadow-[#F4A261]/20">
        <div>
          <div className="text-xs font-medium opacity-75 mb-1">Ada sisa makanan?</div>
          <div className="text-lg font-bold">Donasikan Sekarang</div>
          <div className="text-xs opacity-75 mt-1">Posting surplus dalam 1 menit</div>
        </div>
        <Link
          to="/donasi/buat"
          className="bg-white text-[#d4720a] font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-orange-50 transition-all flex-shrink-0 ml-4"
        >
          Posting 📤
        </Link>
      </div>

      {/* Status Verified */}
      <div className="bg-white rounded-2xl border border-[#e8e4db] p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#f5f3ee] flex items-center justify-center text-xl">
            🏅
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-[#1a3a2a]">Status: Belum Verified</div>
            <div className="text-xs text-[#9a9a8a] mt-0.5">Donasi 20x untuk dapat label Lumbung Verified</div>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold text-[#2D6A4F]">0/20</div>
            <div className="w-16 h-1.5 bg-[#f0ece4] rounded-full mt-1">
              <div className="h-1.5 bg-[#2D6A4F] rounded-full" style={{ width: '0%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Menu Cards */}
      <h2 className="text-sm font-semibold text-[#4a4a3a] mb-3">Menu Warung</h2>
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