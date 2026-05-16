import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/Layout'
import OnboardingWarung from './OnboardingWarung'
import ProfilWarung from './ProfilWarung'
import PrediksiSisa from './PrediksiSisa'
import CSRDashboard from './CSRDashboard'

const TABS = [
  { id: 'profil',   icon: '🏪', label: 'Profil Warung' },
  { id: 'prediksi', icon: '🤖', label: 'Prediksi Sisa' },
  { id: 'csr',      icon: '📊', label: 'Dashboard CSR' },
]

export default function SmartWarung() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('profil')
  const [warungProfile, setWarungProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchWarungProfile() }, [])

  async function fetchWarungProfile() {
    const { data } = await supabase
      .from('warung_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()
    setWarungProfile(data)
    setLoading(false)
  }

  if (loading) return (
    <Layout>
      <div className="text-center py-20">
        <div className="text-3xl animate-bounce">🍜</div>
        <p className="text-sm text-[#9a9a8a] mt-2">Memuat data warung...</p>
      </div>
    </Layout>
  )

  // Belum onboarding
  if (!warungProfile?.onboarding_done) {
    return <OnboardingWarung onSelesai={fetchWarungProfile} />
  }

  return (
    <Layout>
      <div className="w-full px-4">

        {/* Header */}
        <div className="relative bg-gradient-to-br from-[#d4720a] to-[#F4A261] rounded-3xl p-5 mb-5 overflow-hidden">
          <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/10" />
          <div className="absolute -bottom-6 left-8 w-24 h-24 rounded-full bg-white/10" />
          <div className="relative flex items-center gap-4">
            {warungProfile.foto_url ? (
              <img src={warungProfile.foto_url} alt="Warung"
                className="w-16 h-16 rounded-2xl object-cover border-2 border-white/50 flex-shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-3xl flex-shrink-0">
                🍜
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white truncate">
                  {warungProfile.nama_warung}
                </h1>
                {warungProfile.is_verified && (
                  <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full flex-shrink-0">
                    ✅ Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-white/75 mt-0.5">{warungProfile.jenis_makanan}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-white/80">
                  ⭐ {warungProfile.rating_avg?.toFixed(1) || '0.0'}
                </span>
                <span className="text-xs text-white/80">
                  📤 {warungProfile.total_donasi} donasi
                </span>
                <span className="text-xs text-white/80">
                  🕐 {warungProfile.jam_buka} - {warungProfile.jam_tutup}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-[#F4A261] text-white shadow-md shadow-[#F4A261]/30'
                  : 'bg-white text-[#4a4a3a] border border-[#e8e4db] hover:bg-[#fef3e7]'
              }`}>
              <span>{tab.icon}</span>
              <span className="hidden sm:block">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'profil' && (
          <ProfilWarung
            profile={warungProfile}
            onUpdate={fetchWarungProfile}
          />
        )}
        {activeTab === 'prediksi' && <PrediksiSisa userId={user.id} />}
        {activeTab === 'csr' && <CSRDashboard userId={user.id} />}

        <div className="h-6" />
      </div>
    </Layout>
  )
}