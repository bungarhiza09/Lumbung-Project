import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/Layout'

// Konfigurasi badge
const BADGES = {
  'penabur-benih': { icon: '🌱', label: 'Penabur Benih', min: 0, max: 500, color: 'bg-green-100 text-green-700' },
  'petani-aktif':  { icon: '🌾', label: 'Petani Aktif',  min: 500, max: 2000, color: 'bg-yellow-100 text-yellow-700' },
  'lumbung-master':{ icon: '🏆', label: 'Lumbung Master', min: 2000, max: null, color: 'bg-purple-100 text-purple-700' },
}

const AKSI_LABEL = {
  donasi_porsi:   { icon: '🍱', label: 'Donasi porsi makanan' },
  volunteer_relay:{ icon: '🤝', label: 'Jadi volunteer relay' },
  tracking_gizi:  { icon: '📊', label: 'Tracking gizi anak' },
  input_balita:   { icon: '👶', label: 'Input data balita' },
}

const TABS = [
  { id: 'overview',    label: '⭐ Overview' },
  { id: 'leaderboard', label: '📊 Leaderboard' },
  { id: 'misi',        label: '🎯 Misi' },
  { id: 'history',     label: '📋 Riwayat' },
  { id: 'sertifikat',  label: '📜 Sertifikat' },
]

export default function GamifikasiPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const { profile } = useAuth()

  return (
    <Layout>
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-xl font-semibold mb-1">🏆 Poin & Reward</h1>
        <p className="text-sm text-gray-500 mb-4">Kontribusimu memberi dampak nyata</p>

      {/* Tab Bar */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap border transition-all
              ${activeTab === tab.id
                ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]'
                : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview'    && <OverviewTab profile={profile} />}
      {activeTab === 'leaderboard' && <LeaderboardTab profile={profile} />}
      {activeTab === 'misi'        && <MisiTab profile={profile} />}
      {activeTab === 'history'     && <HistoryTab profile={profile} />}
      {activeTab === 'sertifikat'  && <SertifikatTab profile={profile} />}
    </div>
    </Layout>
  )
}

// ─── TAB 1: OVERVIEW ────────────────────────────────────────────
function OverviewTab({ profile }) {
  const totalPoin = profile?.poin || 0

  // Tentukan level saat ini dan berikutnya
  let currentBadge = BADGES['penabur-benih']
  let nextBadge = BADGES['petani-aktif']
  let progressTarget = 500

  if (totalPoin >= 2000) {
    currentBadge = BADGES['lumbung-master']
    nextBadge = null
    progressTarget = 2000
  } else if (totalPoin >= 500) {
    currentBadge = BADGES['petani-aktif']
    nextBadge = BADGES['lumbung-master']
    progressTarget = 2000
  }

  const progressPct = nextBadge
    ? Math.min(100, ((totalPoin - (currentBadge.min)) / (nextBadge.min - currentBadge.min)) * 100)
    : 100

  const poinKeLevelBerikutnya = nextBadge ? nextBadge.min - totalPoin : 0

  return (
    <div>
      {/* Hero Card Poin */}
      <div className="bg-gradient-to-br from-[#2D6A4F] to-[#1B4332] rounded-2xl p-5 text-white mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm opacity-80">Total Poin Kamu</p>
            <p className="text-4xl font-bold mt-1">{totalPoin.toLocaleString()}</p>
          </div>
          <div className={`text-5xl`}>{currentBadge.icon}</div>
        </div>

        <div className="bg-white/10 rounded-xl px-3 py-2 inline-block mb-4">
          <span className="text-sm font-medium">{currentBadge.label}</span>
        </div>

        {/* Progress Bar */}
        {nextBadge && (
          <div>
            <div className="flex justify-between text-xs opacity-70 mb-1">
              <span>{currentBadge.label}</span>
              <span>{nextBadge.label}</span>
            </div>
            <div className="bg-white/20 rounded-full h-2">
              <div
                className="bg-white rounded-full h-2 transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-xs opacity-70 mt-2">
              {poinKeLevelBerikutnya} poin lagi untuk naik ke {nextBadge.label} {nextBadge.icon}
            </p>
          </div>
        )}
        {!nextBadge && (
          <p className="text-xs opacity-70">🎉 Kamu sudah di level tertinggi!</p>
        )}
      </div>

      {/* Cara Dapat Poin */}
      <h3 className="text-sm font-semibold mb-3">⭐ Cara Dapat Poin</h3>
      <div className="space-y-2 mb-4">
        {[
          { aksi: 'Donasi 1 porsi makanan', poin: 50, icon: '🍱' },
          { aksi: 'Jadi volunteer relay', poin: 30, icon: '🤝' },
          { aksi: 'Input tracking gizi anak', poin: 10, icon: '📊' },
          { aksi: 'Input data balita (kader)', poin: 20, icon: '👶' },
        ].map(item => (
          <div key={item.aksi} className="flex items-center justify-between border rounded-xl px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm text-gray-700">{item.aksi}</span>
            </div>
            <span className="text-sm font-bold text-[#2D6A4F]">+{item.poin} poin</span>
          </div>
        ))}
      </div>

      {/* Semua Badge */}
      <h3 className="text-sm font-semibold mb-3">🏅 Semua Level Badge</h3>
      <div className="space-y-2">
        {Object.entries(BADGES).map(([slug, badge]) => {
          const unlocked = totalPoin >= badge.min
          return (
            <div key={slug} className={`flex items-center gap-3 border rounded-xl px-4 py-3 transition
              ${unlocked ? 'border-green-200 bg-green-50' : 'opacity-50'}`}>
              <span className="text-2xl">{badge.icon}</span>
              <div className="flex-1">
                <p className="text-sm font-medium">{badge.label}</p>
                <p className="text-xs text-gray-500">
                  {badge.max ? `${badge.min.toLocaleString()} – ${badge.max.toLocaleString()} poin` : `${badge.min.toLocaleString()}+ poin`}
                </p>
              </div>
              {unlocked
                ? <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">Unlocked ✓</span>
                : <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">Terkunci 🔒</span>
              }
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── TAB 2: LEADERBOARD ─────────────────────────────────────────
function LeaderboardTab({ profile }) {
  const [data, setData] = useState([])
  const [filterRole, setFilterRole] = useState('keluarga')
  const [filterKota, setFilterKota] = useState('Semua')
  const [kotaList, setKotaList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchLeaderboard() }, [filterRole, filterKota])

  async function fetchLeaderboard() {
    setLoading(true)
    let query = supabase
      .from('profiles')
      .select('id, nama, kota, poin, role')
      .eq('role', filterRole)
      .order('poin', { ascending: false })
      .limit(20)

    if (filterKota !== 'Semua') query = query.eq('kota', filterKota)

    const { data: rows } = await query
    setData(rows || [])

    // Ambil list kota unik
    const { data: kotaRows } = await supabase
      .from('profiles')
      .select('kota')
      .eq('role', filterRole)
    const unik = [...new Set(kotaRows?.map(r => r.kota).filter(Boolean))]
    setKotaList(unik)
    setLoading(false)
  }

  function getBadgeByPoin(poin) {
    if (poin >= 2000) return BADGES['lumbung-master']
    if (poin >= 500) return BADGES['petani-aktif']
    return BADGES['penabur-benih']
  }

  const ROLE_TABS = [
    { value: 'keluarga', label: '👩 Individu' },
    { value: 'warung',   label: '🍜 Warung' },
    { value: 'kader',    label: '👶 Kader' },
  ]

  return (
    <div>
      {/* Filter Role */}
      <div className="flex gap-2 mb-3">
        {ROLE_TABS.map(r => (
          <button key={r.value} onClick={() => setFilterRole(r.value)}
            className={`text-xs px-3 py-1.5 rounded-full border transition flex-1
              ${filterRole === r.value ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
            {r.label}
          </button>
        ))}
      </div>

      {/* Filter Kota */}
      <select
        value={filterKota}
        onChange={e => setFilterKota(e.target.value)}
        className="w-full border rounded-xl px-3 py-2 text-sm mb-4 bg-white"
      >
        <option value="Semua">📍 Semua Kota</option>
        {kotaList.map(k => <option key={k} value={k}>{k}</option>)}
      </select>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="flex items-center gap-3 border rounded-xl p-3 animate-pulse">
              <div className="w-8 h-8 bg-gray-200 rounded-full" />
              <div className="flex-1 space-y-1">
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-2">📊</p>
          <p className="text-gray-400 text-sm">Belum ada data leaderboard</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.map((user, idx) => {
            const badge = getBadgeByPoin(user.poin || 0)
            const isMe = user.id === profile?.id
            const medals = ['🥇', '🥈', '🥉']

            return (
              <div key={user.id}
                className={`flex items-center gap-3 border rounded-xl px-4 py-3 transition
                  ${isMe ? 'border-[#2D6A4F] bg-green-50' : 'hover:bg-gray-50'}`}>
                <span className="text-lg w-6 text-center">
                  {idx < 3 ? medals[idx] : <span className="text-xs text-gray-400 font-bold">{idx + 1}</span>}
                </span>
                <div className="w-9 h-9 rounded-full bg-[#2D6A4F] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {user.nama?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user.nama} {isMe && <span className="text-xs text-[#2D6A4F]">(Kamu)</span>}
                  </p>
                  <p className="text-xs text-gray-400">{user.kota} · {badge.icon} {badge.label}</p>
                </div>
                <span className="text-sm font-bold text-[#2D6A4F]">{(user.poin || 0).toLocaleString()}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── TAB 3: MISI ────────────────────────────────────────────────
function MisiTab({ profile }) {
  const [misiList, setMisiList] = useState([])
  const [progressMap, setProgressMap] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchMisi() }, [])

  async function fetchMisi() {
    setLoading(true)
    const now = new Date().toISOString()
    const { data: misi } = await supabase
      .from('misi')
      .select('*')
      .eq('is_active', true)
      .gte('ends_at', now)
      .order('ends_at')

    if (profile?.id) {
      const { data: prog } = await supabase
        .from('misi_progress')
        .select('*')
        .eq('user_id', profile.id)

      const map = {}
      prog?.forEach(p => { map[p.misi_id] = p })
      setProgressMap(map)
    }

    setMisiList(misi || [])
    setLoading(false)
  }

  function sisaHari(endsAt) {
    const diff = new Date(endsAt) - new Date()
    const hari = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return hari > 0 ? hari : 0
  }

  return (
    <div>
      <p className="text-xs text-gray-500 mb-4">Selesaikan misi untuk dapat bonus poin dan badge eksklusif!</p>

      {loading ? (
        <div className="space-y-3">
          {[1,2].map(i => (
            <div key={i} className="border rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-full mb-3" />
              <div className="h-2 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      ) : misiList.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-2">🎯</p>
          <p className="text-gray-400 text-sm">Tidak ada misi aktif saat ini</p>
          <p className="text-gray-400 text-xs mt-1">Cek lagi besok!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {misiList.map(misi => {
            const prog = progressMap[misi.id]
            const progressPct = prog ? Math.min(100, (prog.progress / misi.target_jumlah) * 100) : 0
            const sisa = sisaHari(misi.ends_at)

            return (
              <div key={misi.id} className={`border rounded-xl p-4 ${prog?.completed ? 'border-green-300 bg-green-50' : ''}`}>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-semibold">{misi.judul}</p>
                  {prog?.completed
                    ? <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full flex-shrink-0">✓ Selesai</span>
                    : <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full flex-shrink-0">⏳ {sisa} hari</span>
                  }
                </div>

                <p className="text-xs text-gray-500 mb-3">{misi.deskripsi}</p>

                {/* Progress */}
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress komunitas</span>
                    <span>{prog?.progress || 0}/{misi.target_jumlah}</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-[#2D6A4F] rounded-full h-2 transition-all"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                {/* Rewards */}
                <div className="flex gap-2 mt-3 flex-wrap">
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                    ⭐ {misi.bonus_multiplier}x poin
                  </span>
                  {misi.badge_reward && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                      🏅 Badge eksklusif
                    </span>
                  )}
                  {misi.sponsored_by && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      🏢 {misi.sponsored_by}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── TAB 4: HISTORY POIN ────────────────────────────────────────
function HistoryTab({ profile }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.id) return
    supabase
      .from('poin_history')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setHistory(data || [])
        setLoading(false)
      })
  }, [profile])

  return (
    <div>
      <p className="text-xs text-gray-500 mb-4">50 aktivitas terakhir</p>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4].map(i => (
            <div key={i} className="flex items-center gap-3 border rounded-xl p-3 animate-pulse">
              <div className="w-8 h-8 bg-gray-200 rounded-full" />
              <div className="flex-1 space-y-1">
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-2">📋</p>
          <p className="text-gray-400 text-sm">Belum ada aktivitas poin</p>
          <p className="text-gray-400 text-xs mt-1">Mulai berdonasi atau input data untuk dapat poin!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {history.map(h => {
            const aksi = AKSI_LABEL[h.aksi] || { icon: '⭐', label: h.aksi }
            return (
              <div key={h.id} className="flex items-center gap-3 border rounded-xl px-4 py-3">
                <span className="text-xl">{aksi.icon}</span>
                <div className="flex-1">
                  <p className="text-sm text-gray-700">{aksi.label}</p>
                  {h.keterangan && <p className="text-xs text-gray-400">{h.keterangan}</p>}
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(h.created_at).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' })}
                  </p>
                </div>
                <span className="text-sm font-bold text-[#2D6A4F]">+{h.poin}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── TAB 5: SERTIFIKAT CSR ──────────────────────────────────────
function SertifikatTab({ profile }) {
  const [sertifikatList, setSertifikatList] = useState([])
  const [generating, setGenerating] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.id) return
    supabase
      .from('sertifikat_csr')
      .select('*')
      .eq('user_id', profile.id)
      .order('tahun', { ascending: false })
      .order('bulan', { ascending: false })
      .then(({ data }) => {
        setSertifikatList(data || [])
        setLoading(false)
      })
  }, [profile])

  async function generateSertifikat() {
    setGenerating(true)
    const now = new Date()
    const bulan = now.getMonth() + 1
    const tahun = now.getFullYear()

    // Hitung data dari donasi bulan ini
    const startOfMonth = new Date(tahun, bulan - 1, 1).toISOString()
    const endOfMonth = new Date(tahun, bulan, 0, 23, 59, 59).toISOString()

    const { data: donations } = await supabase
      .from('donasi')
      .select('jumlah_porsi')
      .eq('donor_id', profile.id)
      .gte('created_at', startOfMonth)
      .lte('created_at', endOfMonth)

    const totalPorsi = donations?.reduce((sum, d) => sum + (d.jumlah_porsi || 0), 0) || 0
    const totalKeluarga = Math.floor(totalPorsi / 4)
    const totalKg = totalPorsi * 0.3
    const totalCO2 = totalKg * 2.5

    const { error } = await supabase.from('sertifikat_csr').upsert({
      user_id: profile.id,
      bulan,
      tahun,
      total_porsi: totalPorsi,
      total_keluarga: totalKeluarga,
      total_kg_food_waste: totalKg,
      total_co2_hemat: totalCO2,
      generated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,bulan,tahun' })

    if (!error) {
      const { data } = await supabase
        .from('sertifikat_csr')
        .select('*')
        .eq('user_id', profile.id)
        .order('tahun', { ascending: false })
        .order('bulan', { ascending: false })
      setSertifikatList(data || [])
    }
    setGenerating(false)
  }

  const BULAN_NAMA = ['','Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']

  // Cek apakah sertifikat bulan ini sudah ada
  const now = new Date()
  const sudahAdaBulanIni = sertifikatList.some(
    s => s.bulan === now.getMonth() + 1 && s.tahun === now.getFullYear()
  )

  if (profile?.role !== 'warung') {
    return (
      <div className="text-center py-12">
        <p className="text-4xl mb-2">📜</p>
        <p className="text-gray-500 text-sm">Sertifikat CSR tersedia untuk akun Warung/Korporat</p>
        <p className="text-gray-400 text-xs mt-1">Daftarkan warung atau perusahaanmu untuk fitur ini</p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-xs text-gray-500 mb-4">Sertifikat digital untuk laporan sustainability/ESG perusahaan</p>

      {!sudahAdaBulanIni && (
        <button
          onClick={generateSertifikat}
          disabled={generating}
          className="w-full bg-[#2D6A4F] text-white py-3 rounded-xl text-sm font-medium mb-4 disabled:opacity-50"
        >
          {generating ? '⏳ Membuat sertifikat...' : '📜 Generate Sertifikat Bulan Ini'}
        </button>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1,2].map(i => <div key={i} className="border rounded-xl p-4 h-32 animate-pulse bg-gray-100" />)}
        </div>
      ) : sertifikatList.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400 text-sm">Belum ada sertifikat. Generate sekarang!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sertifikatList.map(s => (
            <div key={s.id} className="border-2 border-[#2D6A4F] rounded-2xl p-4 bg-gradient-to-br from-green-50 to-white">
              {/* Header Sertifikat */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-gray-500">Sertifikat Kontribusi</p>
                  <p className="font-bold text-[#1B4332]">{BULAN_NAMA[s.bulan]} {s.tahun}</p>
                </div>
                <span className="text-3xl">🌾</span>
              </div>

              <p className="text-sm font-semibold text-[#1B4332] mb-3">{profile?.nama}</p>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: '🍱', label: 'Total Porsi', val: `${s.total_porsi} porsi` },
                  { icon: '👨‍👩‍👧', label: 'Keluarga Terbantu', val: `${s.total_keluarga} keluarga` },
                  { icon: '♻️', label: 'Food Waste', val: `${s.total_kg_food_waste.toFixed(1)} kg` },
                  { icon: '🌿', label: 'CO₂ Hemat', val: `${s.total_co2_hemat.toFixed(1)} kg` },
                ].map(item => (
                  <div key={item.label} className="bg-white rounded-xl p-2.5 border border-green-100">
                    <p className="text-xs text-gray-500">{item.icon} {item.label}</p>
                    <p className="text-sm font-bold text-[#2D6A4F]">{item.val}</p>
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t border-green-100 flex items-center justify-between">
                <p className="text-xs text-gray-400">Diterbitkan oleh LUMBUNG Platform</p>
                <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">✓ Verified</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}