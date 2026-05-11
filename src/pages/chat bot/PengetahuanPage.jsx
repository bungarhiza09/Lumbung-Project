import { useState } from 'react'
import ChatbotPage from './ChatbotPage'
import ResepPage from './ResepPage'
import VideoPage from './VideoPage'
import KelasPage from './KelasPage'
import ForumPage from './ForumPage'
import Layout from '../../components/Layout'

const TABS = [
  { id: 'chatbot', icon: '💬', label: 'Chatbot Gizi', desc: 'Tanya AI ahli gizi' },
  { id: 'resep', icon: '📖', label: 'Resep Lokal', desc: 'Masakan bergizi murah' },
  { id: 'video', icon: '🎬', label: 'Video', desc: 'Edukasi dari ahli' },
  { id: 'kelas', icon: '🎓', label: 'Kelas Kader', desc: 'Khusus Posyandu' },
  { id: 'forum', icon: '👥', label: 'Forum', desc: 'Diskusi komunitas' },
]

export default function PengetahuanPage() {
  const [activeTab, setActiveTab] = useState('chatbot')
  const active = TABS.find(t => t.id === activeTab)

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">

        {/* Hero */}
        <div className="relative bg-gradient-to-br from-[#1a3a2a] to-[#2D6A4F] rounded-3xl p-5 mb-5 overflow-hidden">
          <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/5" />
          <div className="absolute -bottom-6 left-8 w-24 h-24 rounded-full bg-white/5" />
          <div className="relative">
            <span className="text-3xl">📚</span>
            <h1 className="text-xl font-bold text-white mt-2 mb-1">
              Lumbung Pengetahuan
            </h1>
            <p className="text-xs text-white/70 leading-relaxed">
              Pusat edukasi gizi untuk keluarga Indonesia. Dari chatbot AI, resep lokal bergizi, hingga kelas kader Posyandu — semua gratis untukmu.
            </p>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-4 scrollbar-hide">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-[#2D6A4F] text-white shadow-md shadow-[#2D6A4F]/30'
                  : 'bg-white text-[#4a4a3a] border border-[#e8e4db] hover:bg-[#f0faf4]'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Active Tab Info */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">{active?.icon}</span>
          <div>
            <p className="text-sm font-semibold text-[#1a3a2a]">{active?.label}</p>
            <p className="text-xs text-[#9a9a8a]">{active?.desc}</p>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-3xl border border-[#e8e4db] overflow-hidden">
          <div className="p-4">
            {activeTab === 'chatbot' && <ChatbotPage />}
            {activeTab === 'resep'   && <ResepPage />}
            {activeTab === 'video'   && <VideoPage />}
            {activeTab === 'kelas'   && <KelasPage />}
            {activeTab === 'forum'   && <ForumPage />}
          </div>
        </div>

        <div className="h-6" />
      </div>
    </Layout>
  )
}