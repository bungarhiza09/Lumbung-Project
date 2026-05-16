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
  { path: '/smart-warung', icon: '⚙️', label: 'Smart Warung' },
  { path: '/pengetahuan', icon: '📚', label: 'Pengetahuan' },
]

const NAV_KADER = [
  { path: '/dashboard', icon: '🏠', label: 'Beranda' },
  { path: '/balita', icon: '👶', label: 'Data Balita' },
  { path: '/peta-gizi', icon: '🗺️', label: 'Peta Gizi' },
  { path: '/pengetahuan', icon: '📚', label: 'Pengetahuan' },
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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)

  const navItems = NAV_MAP[profile?.role] || NAV_KELUARGA

  async function handleLogout() {
    await signOut()
    navigate('/auth')
  }

  const roleColor = profile?.role === 'warung' ? 'bg-[#F4A261]'
    : profile?.role === 'kader' ? 'bg-[#6B46C1]'
    : 'bg-[#2D6A4F]'

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#e8e4db] h-16 items-center px-6 shadow-sm">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2 mr-8 group">
          <div className="w-8 h-8 rounded-xl bg-[#2D6A4F] flex items-center justify-center text-sm group-hover:scale-110 transition-transform">🌾</div>
          <span className="font-bold text-[#1a3a2a] tracking-tight">LUMBUNG</span>
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-1 flex-1">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                location.pathname === item.path
                  ? `${roleColor} text-white shadow-sm`
                  : 'text-[#4a4a3a] hover:bg-[#f0faf4] hover:text-[#2D6A4F]'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Right: Poin & Profil */}
        <div className="flex items-center gap-3">
          {/* Poin chip */}
          <Link to="/gamifikasi"
            className="flex items-center gap-1.5 bg-[#f5f3ee] hover:bg-[#edeae4] px-3 py-1.5 rounded-full transition-all">
            <span className="text-sm">⭐</span>
            <span className="text-sm font-semibold text-[#2D6A4F]">{(profile?.poin || 0).toLocaleString()}</span>
          </Link>

          {/* Profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 bg-[#f0faf4] hover:bg-[#e0f4ea] px-2.5 py-1.5 rounded-full transition-all"
            >
              {/* Avatar */}
              <div className={`w-7 h-7 rounded-full ${roleColor} flex items-center justify-center text-white text-xs font-bold overflow-hidden`}>
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt={profile.nama} className="w-full h-full object-cover" />
                  : profile?.nama?.[0]?.toUpperCase() || 'U'
                }
              </div>
              <span className="text-sm font-medium text-[#1a3a2a]">{profile?.nama?.split(' ')[0]}</span>
              <span className={`text-xs text-[#9a9a8a] transition-transform ${menuOpen ? 'rotate-180' : ''}`}>▾</span>
            </button>

            {menuOpen && (
              <>
                {/* Overlay */}
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                {/* Dropdown */}
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl shadow-black/10 border border-[#e8e4db] overflow-hidden z-50">
                  {/* Profile info */}
                  <div className="px-4 py-3 border-b border-[#f0ece4] flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl ${roleColor} flex items-center justify-center text-white text-sm font-bold overflow-hidden flex-shrink-0`}>
                      {profile?.avatar_url
                        ? <img src={profile.avatar_url} alt={profile.nama} className="w-full h-full object-cover" />
                        : profile?.nama?.[0]?.toUpperCase() || 'U'
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#1a3a2a] truncate">{profile?.nama}</p>
                      <p className="text-xs text-[#9a9a8a] capitalize">{profile?.role} · {profile?.kota}</p>
                    </div>
                  </div>

                  <Link to="/profil" onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-3 text-sm text-[#4a4a3a] hover:bg-[#f5f3ee] transition-colors">
                    <span className="w-7 h-7 rounded-lg bg-[#f0faf4] flex items-center justify-center">👤</span>
                    Profil Saya
                  </Link>
                  <Link to="/gamifikasi" onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-3 text-sm text-[#4a4a3a] hover:bg-[#f5f3ee] transition-colors">
                    <span className="w-7 h-7 rounded-lg bg-yellow-50 flex items-center justify-center">🏆</span>
                    Poin & Reward
                    <span className="ml-auto text-xs font-bold text-[#2D6A4F]">⭐ {profile?.poin || 0}</span>
                  </Link>
                  <div className="border-t border-[#f0ece4]">
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors">
                      <span className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">🚪</span>
                      Keluar
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* MOBILE TOPBAR */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#e8e4db] shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">

          {/* Logo / Title */}
          <div>
            <h1 className="text-sm font-bold text-[#2D6A4F]">
              🌾 Lumbung
            </h1>
            <p className="text-[10px] text-[#9a9a8a]">
              Food Rescue Platform
            </p>
          </div>

          {/* Right Menu */}
          <div className="flex items-center gap-3">

            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className={`w-9 h-9 rounded-full ${roleColor} flex items-center justify-center text-white text-sm font-bold overflow-hidden shadow-sm`}
              >
                {profile?.avatar_url
                  ? (
                    <img
                      src={profile.avatar_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )
                  : profile?.nama?.[0]?.toUpperCase() || 'U'
                }
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-xl border border-[#e8e4db] overflow-hidden z-50">

                  <Link
                    to="/profil"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-[#f5f5f5]"
                  >
                    👤 Profil
                  </Link>

                  <Link
                    to="/gamifikasi"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-[#f5f5f5]"
                  >
                    🏆 Gamifikasi
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50"
                  >
                    🚪 Keluar
                  </button>
                </div>
              )}
            </div>

            {/* Hamburger */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-9 h-9 rounded-xl border border-[#e8e4db] flex items-center justify-center bg-white"
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE SIDEBAR */}
      {sidebarOpen && (
        <>
          {/* Overlay */}
          <div
            className="md:hidden fixed inset-0 bg-black/40 z-50"
            onClick={() => setSidebarOpen(false)}
          />

          {/* Sidebar */}
          <div className="md:hidden fixed top-0 right-0 h-full w-72 bg-white z-50 shadow-2xl p-5 overflow-y-auto">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-bold text-[#1a3a2a]">
                  Menu
                </h2>
                <p className="text-xs text-[#9a9a8a]">
                  Navigasi aplikasi
                </p>
              </div>

              <button
                onClick={() => setSidebarOpen(false)}
                className="text-xl text-[#7a8a7a]"
              >
                ✕
              </button>
            </div>

            {/* User */}
            <div className="flex items-center gap-3 bg-[#f8faf8] rounded-2xl p-3 mb-5 border border-[#e8e4db]">
              <div className={`w-12 h-12 rounded-full ${roleColor} flex items-center justify-center text-white font-bold overflow-hidden`}>
                {profile?.avatar_url
                  ? (
                    <img
                      src={profile.avatar_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )
                  : profile?.nama?.[0]?.toUpperCase() || 'U'
                }
              </div>

              <div>
                <p className="text-sm font-semibold text-[#1a3a2a]">
                  {profile?.nama}
                </p>
                <p className="text-xs text-[#7a8a7a] capitalize">
                  {profile?.role}
                </p>
              </div>
            </div>

            {/* Menu Items */}
            <div className="space-y-2">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                    location.pathname === item.path
                      ? 'bg-[#2D6A4F] text-white'
                      : 'text-[#4a4a3a] hover:bg-[#f5f5f5]'
                  }`}
                >
                  <span className="text-xl">
                    {item.icon}
                  </span>

                  <span className="text-sm font-medium">
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Spacer */}
      <div className="h-16 hidden md:block" />
      <div className="h-16 md:hidden" />
    </>
  )
}
