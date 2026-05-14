import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const NAV_KELUARGA = [
  { path: '/dashboard', icon: '🏠', label: 'Beranda' },
  { path: '/nutrisi', icon: '🤖', label: 'AI Nutrisi' },
  { path: '/food-rescue', icon: '🍱', label: 'Food Rescue' },
  { path: '/chat', icon: '💬', label: 'Chat' },   
  { path: '/pengetahuan', icon: '📚', label: 'Pengetahuan' },
]

const NAV_WARUNG = [
  { path: '/dashboard', icon: '🏠', label: 'Beranda' },
  { path: '/donasi', icon: '🍱', label: 'Kelola Donasi' },
  { path: '/chat', icon: '💬', label: 'Chat' },  
  { path: '/impact', icon: '📊', label: 'Impact' },
  { path: '/pengetahuan', icon: '📚', label: 'Pengetahuan' },
]

const NAV_KADER = [
  { path: '/dashboard', icon: '🏠', label: 'Beranda' },
  { path: '/balita', icon: '👶', label: 'Data Balita' },
  { path: '/peta-gizi', icon: '🗺️', label: 'Peta Gizi' },
]

const NAV_MAP = {
  keluarga: NAV_KELUARGA,
  warung: NAV_WARUNG,
  kader: NAV_KADER,
}

export default function Navbar() {
  const { profile, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const navItems = NAV_MAP[profile?.role] || NAV_KELUARGA

  async function handleLogout() {
    await signOut()
    navigate('/auth')
  }

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur border-b border-[#e8e4db] h-16 items-center px-6">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2 mr-8">
          <span className="text-2xl">🌾</span>
          <span className="font-bold text-[#1a3a2a] tracking-tight">LUMBUNG</span>
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-1 flex-1">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                location.pathname === item.path
                  ? 'bg-[#2D6A4F] text-white'
                  : 'text-[#4a4a3a] hover:bg-[#f0faf4] hover:text-[#2D6A4F]'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Right: Profil & Poin */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-[#f5f3ee] px-3 py-1.5 rounded-full">
            <span className="text-sm">⭐</span>
            <span className="text-sm font-semibold text-[#2D6A4F]">{profile?.poin || 0} poin</span>
          </div>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 bg-[#f0faf4] hover:bg-[#e0f4ea] px-3 py-1.5 rounded-full transition-all"
            >
              <div className="w-7 h-7 rounded-full bg-[#2D6A4F] flex items-center justify-center text-white text-xs font-bold">
                {profile?.nama?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="text-sm font-medium text-[#1a3a2a]">{profile?.nama?.split(' ')[0]}</span>
              <span className="text-xs text-[#9a9a8a]">▾</span>
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-[#e8e4db] overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-[#f0ece4]">
                  <div className="text-sm font-medium text-[#1a3a2a]">{profile?.nama}</div>
                  <div className="text-xs text-[#9a9a8a] capitalize">{profile?.role} · {profile?.kota}</div>
                </div>
                <Link to="/profil" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-3 text-sm text-[#4a4a3a] hover:bg-[#f5f3ee]">
                  👤 Profil Saya
                </Link>
                <Link to="/gamifikasi" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-3 text-sm text-[#4a4a3a] hover:bg-[#f5f3ee]">
                  🏆 Poin & Reward
                </Link>
                <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-red-50">
                  🚪 Keluar
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#e8e4db] px-2 py-2">
        <div className="flex justify-around">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                location.pathname === item.path
                  ? 'text-[#2D6A4F]'
                  : 'text-[#9a9a8a]'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[#9a9a8a]"
          >
            <span className="text-xl">🚪</span>
            <span className="text-[10px] font-medium">Keluar</span>
          </button>
        </div>
      </nav>

      {/* Spacer agar konten tidak ketutup navbar */}
      <div className="h-16 hidden md:block" />
      <div className="h-16 md:hidden" />
    </>
  )
}