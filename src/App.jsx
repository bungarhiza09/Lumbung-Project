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

function App() {
  const { user, profile, loading } = useAuth()

  if (loading) return (
    <div className="min-h-screen bg-[#f5f3ee] flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-3">🌾</div>
        <div className="text-sm text-[#5a7a6a]">Memuat LUMBUNG...</div>
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
      //Auth
      <Route path="/auth" element={!user ? <AuthPage /> : <Navigate to="/dashboard" />} />
      
      //Dashboard
      <Route path="/dashboard" element={getDashboard()} />
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/auth"} />} />

      //Nutrisi AI
      <Route path="/nutrisi" element={user ? <NutrisiAI /> : <Navigate to="/auth" />} />

      //Food Rescue
      <Route path="/food-rescue" element={user ? <FoodRescue /> : <Navigate to="/auth" />} />
      <Route path="/donasi/buat" element={user ? <PostingDonasi /> : <Navigate to="/auth" />} />
      <Route path="/donasi/riwayat" element={user ? <RiwayatDonasi /> : <Navigate to="/auth" />} />
      <Route path="/impact" element={user ? <ImpactDashboard /> : <Navigate to="/auth" />} />
      <Route path="/donasi/jadwal" element={user ? <JadwalDonasi /> : <Navigate to="/auth" />} />

      //Chat
      <Route path="/chat" element={user ? <DaftarChat /> : <Navigate to="/auth" />} />
      <Route path="/chat/:roomId" element={user ? <ChatDonasi /> : <Navigate to="/auth" />} />

      //Chatbot Pengetahuan
      <Route path="/pengetahuan" element={<PengetahuanPage />} />

      // Gamifikasi
      <Route path="/gamifikasi" element={<GamifikasiPage />} />
    </Routes>
  )
}

export default App