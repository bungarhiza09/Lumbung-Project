import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import AuthPage from './pages/auth/AuthPage'
import DashboardKeluarga from './pages/dashboard/DashboardKeluarga'
import DashboardWarung from './pages/dashboard/DashboardWarung'
import DashboardKader from './pages/dashboard/DashboardKader'
import NutrisiAI from './pages/nutrisi ai/NutrisiAI'
import FoodRescue from './pages/food rescue/FoodRescue'
import PostingDonasi from './pages/food rescue/PostingDonasi'
import ChatDonasi from './pages/chat/ChatDonasi'
import DaftarChat from './pages/chat/DaftarChat'
import PengetahuanPage from './pages/chat bot/PengetahuanPage'
import GamifikasiPage from './pages/gamifikasi/GamifikasiPage'
import RiwayatDonasi from './pages/food rescue/RiwayatDonasi'
import ImpactDashboard from './pages/food rescue/ImpactDashboard'
import JadwalDonasi from './pages/food rescue/JadwalDonasi'
import DaftarBalita   from './pages/input balita/DaftarBalita'
import DetailBalita   from './pages/input balita/DetailBalita'
import InputBalita    from './pages/input balita/InputBalita'
import PetaGizi       from './pages/gizi/PetaGizi'
import TrenGizi       from './pages/gizi/TrenGizi'
import ExportLaporan  from './pages/laporan/ExportLaporan'

// Di dalam <Routes> tambahkan:
<Route path="/pengetahuan" element={<PengetahuanPage />} />
import SmartWarung from './pages/smart warung/SmartWarung'
import ProfilPage from './pages/profil/ProfilPage'
import DaftarBalita   from './pages/health dashboard/input balita/DaftarBalita'
import DetailBalita   from './pages/health dashboard/input balita/DetailBalita'
import InputBalita    from './pages/health dashboard/input balita/InputBalita'
import PetaGizi       from './pages/health dashboard/gizi/PetaGizi'
import TrenGizi       from './pages/health dashboard/gizi/TrenGizi'
import ExportLaporan  from './pages/health dashboard/laporan/ExportLaporan'
import DaftarWarung  from './pages/food rescue/DaftarWarung'
import DetailWarung  from './pages/food rescue/DetailWarung'

function App() {
  const { user, profile, loading } = useAuth()

  if (loading) return (
    <div className="min-h-screen bg-[#f5f3ee] flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4 animate-bounce">🌾</div>
        <div className="w-8 h-8 border-3 border-[#2D6A4F]/20 border-t-[#2D6A4F] rounded-full animate-spin mx-auto mb-3" />
        <div className="text-sm font-medium text-[#2D6A4F]">Memuat LUMBUNG...</div>
      </div>
    </div>
  )

  function getDashboard() {
    if (!user || !profile) return <Navigate to="/auth" />
    if (profile.role === 'keluarga') return <DashboardKeluarga />
    if (profile.role === 'warung') return <DashboardWarung />
    if (profile.role === 'kader') return <DashboardKader />
    return <DashboardKeluarga />
  }

  return (
    <Routes>
      {/* Auth */}
      <Route path="/auth" element={!user ? <AuthPage /> : <Navigate to="/dashboard" />} />

      {/* Dashboard */}
      <Route path="/dashboard" element={getDashboard()} />
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/auth"} />} />

      {/* Nutrisi AI */}
      <Route path="/nutrisi" element={user ? <NutrisiAI /> : <Navigate to="/auth" />} />

      {/* Food Rescue */}
      <Route path="/food-rescue" element={user ? <FoodRescue /> : <Navigate to="/auth" />} />
      <Route path="/donasi/buat" element={user ? <PostingDonasi /> : <Navigate to="/auth" />} />
      <Route path="/donasi/riwayat" element={user ? <RiwayatDonasi /> : <Navigate to="/auth" />} />
      <Route path="/impact" element={user ? <ImpactDashboard /> : <Navigate to="/auth" />} />
      <Route path="/donasi/jadwal" element={user ? <JadwalDonasi /> : <Navigate to="/auth" />} />
      <Route path="/donasi" element={user ? <RiwayatDonasi /> : <Navigate to="/auth" />} />
      <Route path="/warung" element={user ? <DaftarWarung /> : <Navigate to="/auth" />} />
      <Route path="/warung/:id" element={user ? <DetailWarung /> : <Navigate to="/auth" />} />

      {/* Chat */}
      <Route path="/chat" element={user ? <DaftarChat /> : <Navigate to="/auth" />} />
      <Route path="/chat/:roomId" element={user ? <ChatDonasi /> : <Navigate to="/auth" />} />

      {/* Chatbot Pengetahuan */}
      <Route path="/pengetahuan" element={<PengetahuanPage />} />

      // Gamifikasi
      <Route path="/gamifikasi" element={<GamifikasiPage />} />
      //Balita
      {/* Gamifikasi */}
      <Route path="/gamifikasi" element={<GamifikasiPage />} />

      {/* Smart Warung */}
      <Route path="/smart-warung" element={user ? <SmartWarung /> : <Navigate to="/auth" />} />

      {/* Profil */}
      <Route path="/profil" element={<ProfilPage />} />

      {/* Balita */}
      <Route path="/balita"          element={<DaftarBalita />} />
      <Route path="/balita/input"    element={<InputBalita />} />
      <Route path="/balita/:id"      element={<DetailBalita />} />

      {/* Gizi */}
      <Route path="/peta-gizi"       element={<PetaGizi />} />
      <Route path="/tren-gizi"       element={<TrenGizi />} />

      {/* Laporan */}
      <Route path="/laporan"         element={<ExportLaporan />} />
      
    </Routes>
  )
}

export default App