import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import AuthPage from './pages/AuthPage'
import DashboardKeluarga from './pages/DashboardKeluarga'
import DashboardWarung from './pages/DashboardWarung'
import DashboardKader from './pages/DashboardKader'
import NutrisiAI from './pages/NutrisiAI'

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
      <Route path="/auth" element={!user ? <AuthPage /> : <Navigate to="/dashboard" />} />
      <Route path="/dashboard" element={getDashboard()} />
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/auth"} />} />
      <Route path="/nutrisi" element={user ? <NutrisiAI /> : <Navigate to="/auth" />} />
    </Routes>
  )
}

export default App