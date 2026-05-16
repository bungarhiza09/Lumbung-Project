import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/Layout'

const BADGES = {
  'penabur-benih': { icon: '🌱', label: 'Penabur Benih', min: 0, max: 500, color: 'bg-green-100 text-green-700' },
  'petani-aktif':  { icon: '🌾', label: 'Petani Aktif',  min: 500, max: 2000, color: 'bg-yellow-100 text-yellow-700' },
  'lumbung-master':{ icon: '🏆', label: 'Lumbung Master', min: 2000, max: null, color: 'bg-purple-100 text-purple-700' },
}

const AKSI_LABEL = {
  donasi_porsi:    { icon: '🍱', label: 'Ambil donasi makanan' },
  volunteer_relay: { icon: '🤝', label: 'Jadi volunteer relay' },
  tracking_gizi:   { icon: '📊', label: 'Tracking gizi anak' },
  input_balita:    { icon: '👶', label: 'Input data balita' },
  upload_video:    { icon: '🎬', label: 'Upload video edukasi' },
  upload_recipe:   { icon: '📖', label: 'Upload resep' },
  upload_kelas:    { icon: '👩‍🏫', label: 'Menambahkan topik kuis'},
}

// Misi hardcoded — aktif selalu sebagai fallback & demo
const MISI_AKTIF = [
  {
    id: 'misi-selamatkan-10',
    judul: '🍱 Selamatkan 10 Porsi Minggu Ini',
    deskripsi: 'Ambil donasi makanan sebanyak 10 kali dalam 7 hari. Setiap pengambilan = 1 progress.',
    tipe: 'donasi_porsi',   // aksi yang dihitung
    target_jumlah: 10,
    bonus_poin: 200,
    badge_reward: true,
    sponsored_by: null,
    ends_at: new Date(Date.now() + 7 * 86400000).toISOString(),
  },
  {
    id: 'misi-tracking-5',
    judul: '📊 Pantau Gizi 5 Hari Berturut',
    deskripsi: 'Lakukan tracking gizi anak minimal 5 kali. Gunakan fitur Cek Gizi AI di halaman utama.',
    tipe: 'tracking_gizi',
    target_jumlah: 5,
    bonus_poin: 100,
    badge_reward: false,
    sponsored_by: 'Dinas Kesehatan',
    ends_at: new Date(Date.now() + 14 * 86400000).toISOString(),
  },
  {
    id: 'misi-zero-waste',
    judul: '🌍 Kampanye Zero Food Waste',
    deskripsi: 'Selamatkan total 20 porsi makanan bulan ini. Bergabunglah bersama komunitas LUMBUNG!',
    tipe: 'donasi_porsi',
    target_jumlah: 20,
    bonus_poin: 500,
    badge_reward: true,
    sponsored_by: 'LUMBUNG x Komunitas',
    ends_at: new Date(Date.now() + 30 * 86400000).toISOString(),
  },
]

const TABS = [
  { id: 'overview',    label: '⭐ Overview' },
  { id: 'leaderboard', label: '📊 Papan' },
  { id: 'misi',        label: '🎯 Misi' },
  { id: 'history',     label: '📋 Riwayat' },
  { id: 'sertifikat',  label: '📜 Sertifikat' },
]

export default function GamifikasiPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const { profile } = useAuth()

  return (
    <Layout>
      <div className="w-full px-4">
        <h1 className="text-xl font-semibold mb-1">🏆 Poin & Reward</h1>
        <p className="text-sm text-gray-500 mb-4">Kontribusimu memberi dampak nyata</p>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap border transition-all
                ${activeTab === tab.id
                  ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]'
                  : 'bg-white text-gray-600 border-gray-200'}`}>
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

// ─── TAB 1: OVERVIEW ─────────────────────────────────────────────
function OverviewTab({ profile }) {
  const totalPoin = profile?.poin || 0
  let currentBadge = BADGES['penabur-benih']
  let nextBadge = BADGES['petani-aktif']
  if (totalPoin >= 2000) { currentBadge = BADGES['lumbung-master']; nextBadge = null }
  else if (totalPoin >= 500) { currentBadge = BADGES['petani-aktif']; nextBadge = BADGES['lumbung-master'] }

  const progressPct = nextBadge
    ? Math.min(100, ((totalPoin - currentBadge.min) / (nextBadge.min - currentBadge.min)) * 100)
    : 100
  const poinKeLevelBerikutnya = nextBadge ? nextBadge.min - totalPoin : 0

  return (
    <div>
      {/* Hero poin */}
      <div className="bg-gradient-to-br from-[#2D6A4F] to-[#1B4332] rounded-2xl p-5 text-white mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm opacity-80">Total Poin Kamu</p>
            <p className="text-4xl font-bold mt-1">{totalPoin.toLocaleString()}</p>
          </div>
          <div className="text-5xl">{currentBadge.icon}</div>
        </div>
        <div className="bg-white/10 rounded-xl px-3 py-2 inline-block mb-4">
          <span className="text-sm font-medium">{currentBadge.label}</span>
        </div>
        {nextBadge && (
          <div>
            <div className="flex justify-between text-xs opacity-70 mb-1">
              <span>{currentBadge.label}</span>
              <span>{nextBadge.label}</span>
            </div>
            <div className="bg-white/20 rounded-full h-2">
              <div className="bg-white rounded-full h-2 transition-all" style={{ width: `${progressPct}%` }} />
            </div>
            <p className="text-xs opacity-70 mt-2">
              {poinKeLevelBerikutnya} poin lagi untuk {nextBadge.label} {nextBadge.icon}
            </p>
          </div>
        )}
        {!nextBadge && <p className="text-xs opacity-70">🎉 Kamu sudah di level tertinggi!</p>}
      </div>

      {/* Cara dapat poin */}
      <h3 className="text-sm font-semibold mb-3">⭐ Cara Dapat Poin</h3>
      <div className="space-y-2 mb-5">
        {[
          { aksi: 'Ambil donasi makanan', poin: 50, icon: '🍱', bg: 'bg-orange-50 border-orange-100' },
          { aksi: 'Input tracking gizi anak', poin: 10, icon: '📊', bg: 'bg-blue-50 border-blue-100' },
          { aksi: 'Input data balita (kader)', poin: 20, icon: '👶', bg: 'bg-pink-50 border-pink-100' },
          { aksi: 'Jadi volunteer relay', poin: 30, icon: '🤝', bg: 'bg-green-50 border-green-100' },
          { aksi: 'Upload resep / video', poin: 10, icon: '📖', bg: 'bg-purple-50 border-purple-100' },
        ].map(item => (
          <div key={item.aksi} className={`flex items-center justify-between border rounded-xl px-4 py-3 ${item.bg}`}>
            <div className="flex items-center gap-3">
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm text-gray-700">{item.aksi}</span>
            </div>
            <span className="text-sm font-bold text-[#2D6A4F]">+{item.poin}</span>
          </div>
        ))}
      </div>

      {/* Badge levels */}
      <h3 className="text-sm font-semibold mb-3">🏅 Semua Level Badge</h3>
      <div className="space-y-2">
        {Object.entries(BADGES).map(([slug, badge]) => {
          const unlocked = totalPoin >= badge.min
          return (
            <div key={slug} className={`flex items-center gap-3 border rounded-xl px-4 py-3 transition
              ${unlocked ? 'border-green-200 bg-green-50' : 'border-gray-100 bg-gray-50 opacity-50'}`}>
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

// ─── TAB 2: LEADERBOARD ──────────────────────────────────────────
function LeaderboardTab({ profile }) {
  const [data, setData] = useState([])
  const [filterRole, setFilterRole] = useState('all')
  const [filterKota, setFilterKota] = useState('Semua')
  const [kotaList, setKotaList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchLeaderboard() }, [filterRole, filterKota])

  async function fetchLeaderboard() {
    setLoading(true)
    // FIX #1: filter 'all' tidak pakai .eq() — ambil semua role
    let query = supabase
      .from('profiles')
      .select('id, nama, kota, poin, role')
      .order('poin', { ascending: false })
      .limit(20)

    if (filterRole !== 'all') {
      query = query.eq('role', filterRole)
    }
    if (filterKota !== 'Semua') {
      query = query.eq('kota', filterKota)
    }

    const { data: rows } = await query
    setData(rows || [])

    // Ambil semua kota unik dari profiles (tanpa filter role)
    const { data: kotaRows } = await supabase
      .from('profiles')
      .select('kota')
    const unik = [...new Set(kotaRows?.map(r => r.kota).filter(Boolean))].sort()
    setKotaList(unik)
    setLoading(false)
  }

  function getBadgeByPoin(poin) {
    if (poin >= 2000) return BADGES['lumbung-master']
    if (poin >= 500)  return BADGES['petani-aktif']
    return BADGES['penabur-benih']
  }

  const ROLE_TABS = [
    { value: 'all',      label: '🌍 Semua' },
    { value: 'keluarga', label: '👩 Individu' },
    { value: 'warung',   label: '🍜 Warung' },
    { value: 'kader',    label: '👶 Kader' },
  ]

  return (
    <div>
      {/* Role filter */}
      <div className="flex gap-1.5 mb-3 overflow-x-auto scrollbar-none">
        {ROLE_TABS.map(r => (
          <button key={r.value} onClick={() => setFilterRole(r.value)}
            className={`text-xs px-3 py-1.5 rounded-full border transition flex-shrink-0
              ${filterRole === r.value
                ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]'
                : 'bg-white text-gray-600 border-gray-200'}`}>
            {r.label}
          </button>
        ))}
      </div>

      {/* Kota filter */}
      <select value={filterKota} onChange={e => setFilterKota(e.target.value)}
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-4 bg-white">
        <option value="Semua">📍 Semua Kota</option>
        {kotaList.map(k => <option key={k} value={k}>{k}</option>)}
      </select>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="flex items-center gap-3 border rounded-xl p-3 animate-pulse">
              <div className="w-8 h-8 bg-gray-100 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-gray-100 rounded w-1/2" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <p className="text-4xl mb-2">📊</p>
          <p className="text-gray-400 text-sm">Belum ada data leaderboard</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.map((u, idx) => {
            const badge = getBadgeByPoin(u.poin || 0)
            const isMe = u.id === profile?.id
            const medals = ['🥇', '🥈', '🥉']
            return (
              <div key={u.id}
                className={`flex items-center gap-3 border rounded-xl px-4 py-3 transition
                  ${isMe ? 'border-[#2D6A4F] bg-[#f0faf4]' : 'bg-white border-gray-100 hover:bg-gray-50'}`}>
                <span className="text-lg w-6 text-center flex-shrink-0">
                  {idx < 3
                    ? medals[idx]
                    : <span className="text-xs text-gray-400 font-bold">{idx + 1}</span>
                  }
                </span>
                <div className="w-9 h-9 rounded-full bg-[#2D6A4F] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {u.nama?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {u.nama} {isMe && <span className="text-xs text-[#2D6A4F]">(Kamu)</span>}
                  </p>
                  <p className="text-xs text-gray-400">{u.kota || '-'} · {badge.icon} {badge.label}</p>
                </div>
                <span className="text-sm font-bold text-[#2D6A4F] flex-shrink-0">
                  {(u.poin || 0).toLocaleString()}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── TAB 3: MISI ─────────────────────────────────────────────────
function MisiTab({ profile }) {
  const [progressMap, setProgressMap] = useState({})  // { misi_id: count }
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    if (!profile?.id) { setLoading(false); return }
    hitungProgress()
  }, [profile])

  async function hitungProgress() {
    setLoading(true)
    const map = {}

    // Untuk misi tipe donasi_porsi: hitung dari poin_history
    const { data: donasiHistory } = await supabase
      .from('poin_history')
      .select('id, aksi, created_at')
      .eq('user_id', profile.id)
      .eq('aksi', 'donasi_porsi')

    const { data: trackingHistory } = await supabase
      .from('poin_history')
      .select('id, aksi, created_at')
      .eq('user_id', profile.id)
      .eq('aksi', 'tracking_gizi')

    // Hitung progress per misi berdasarkan tipe dan periode
    for (const misi of MISI_AKTIF) {
      const mulaiPeriode = new Date(Date.now() - 30 * 86400000).toISOString()  // 30 hari lalu
      if (misi.tipe === 'donasi_porsi') {
        const count = (donasiHistory || []).filter(h =>
          new Date(h.created_at) >= new Date(mulaiPeriode)
        ).length
        map[misi.id] = count
      } else if (misi.tipe === 'tracking_gizi') {
        const count = (trackingHistory || []).filter(h =>
          new Date(h.created_at) >= new Date(mulaiPeriode)
        ).length
        map[misi.id] = count
      }
    }

    setProgressMap(map)
    setLoading(false)
  }

  function sisaHari(endsAt) {
    const diff = new Date(endsAt) - new Date()
    return Math.max(0, Math.ceil(diff / 86400000))
  }

  // Warna per misi
  const MISI_COLORS = [
    { border: 'border-orange-200', bg: 'bg-orange-50', progress: 'bg-orange-400', tag: 'bg-orange-100 text-orange-700' },
    { border: 'border-blue-200',   bg: 'bg-blue-50',   progress: 'bg-blue-400',   tag: 'bg-blue-100 text-blue-700' },
    { border: 'border-green-200',  bg: 'bg-green-50',  progress: 'bg-[#2D6A4F]',  tag: 'bg-green-100 text-green-700' },
  ]

  return (
    <div>
      <div className="bg-[#f0faf4] border border-[#b7e4cc] rounded-2xl p-3 mb-4">
        <p className="text-xs text-[#2D6A4F] font-semibold mb-0.5">💡 Cara kerja misi</p>
        <p className="text-xs text-[#5a7a6a]">
          Progress misi dihitung otomatis dari aktivitasmu — ambil donasi atau tracking gizi.
          Selesaikan misi untuk bonus poin dan badge eksklusif!
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="border rounded-2xl p-4 animate-pulse bg-gray-50">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-full mb-3" />
              <div className="h-2 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {MISI_AKTIF.map((misi, idx) => {
            const warna = MISI_COLORS[idx % MISI_COLORS.length]
            const progressVal = progressMap[misi.id] || 0
            const progressPct = Math.min(100, (progressVal / misi.target_jumlah) * 100)
            const selesai = progressVal >= misi.target_jumlah

            return (
              <div key={misi.id}
                className={`border-2 rounded-2xl p-4 ${warna.border} ${warna.bg}`}>

                {/* Status badge */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-bold text-[#1a3a2a]">{misi.judul}</p>
                  {selesai
                    ? <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full flex-shrink-0 font-semibold">✓ Selesai!</span>
                    : <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium ${warna.tag}`}>⏳ {sisaHari(misi.ends_at)} hari</span>
                  }
                </div>

                <p className="text-xs text-gray-600 mb-3 leading-relaxed">{misi.deskripsi}</p>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Progress</span>
                    <span className="font-bold text-[#1a3a2a]">{progressVal}/{misi.target_jumlah}</span>
                  </div>
                  <div className="bg-white/70 rounded-full h-3 overflow-hidden border border-white">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${selesai ? 'bg-green-500' : warna.progress}`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  {progressPct < 100 && (
                    <p className="text-[10px] text-gray-500 mt-1">
                      {misi.target_jumlah - progressVal}x lagi untuk menyelesaikan misi ini
                    </p>
                  )}
                </div>

                {/* Reward tags */}
                <div className="flex gap-2 flex-wrap">
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">
                    ⭐ +{misi.bonus_poin} bonus poin
                  </span>
                  {misi.badge_reward && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                      🏅 Badge eksklusif
                    </span>
                  )}
                  {misi.sponsored_by && (
                    <span className="text-xs bg-white/80 text-gray-600 border border-gray-200 px-2 py-1 rounded-full">
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

// ─── TAB 4: RIWAYAT ──────────────────────────────────────────────
function HistoryTab({ profile }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.id) { setLoading(false); return }
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

  // Warna per tipe aksi
  const AKSI_STYLE = {
    donasi_porsi:    { bg: 'bg-orange-50 border-orange-100', dot: 'bg-orange-400' },
    tracking_gizi:   { bg: 'bg-blue-50 border-blue-100',     dot: 'bg-blue-400' },
    input_balita:    { bg: 'bg-pink-50 border-pink-100',      dot: 'bg-pink-400' },
    volunteer_relay: { bg: 'bg-green-50 border-green-100',    dot: 'bg-green-400' },
    upload_video:    { bg: 'bg-purple-50 border-purple-100',  dot: 'bg-purple-400' },
    upload_recipe:   { bg: 'bg-violet-50 border-violet-100',  dot: 'bg-violet-400' },
    upload_kelas:    { bg: 'bg-yellow-50 border-yellow-100',  dot: 'bg-yellow-400' },
  }

  return (
    <div>
      <p className="text-xs text-gray-500 mb-4">
        {history.length > 0
          ? `${history.length} aktivitas tercatat`
          : '50 aktivitas terakhir yang menghasilkan poin'}
      </p>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4].map(i => (
            <div key={i} className="flex items-center gap-3 border rounded-xl p-3 animate-pulse">
              <div className="w-9 h-9 bg-gray-100 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-gray-100 rounded w-1/2" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-12 bg-[#f5f3ee] rounded-2xl border border-dashed border-[#d8d4cc]">
          <p className="text-3xl mb-3">📋</p>
          <p className="text-[#4a4a3a] text-sm font-semibold">Belum ada aktivitas poin</p>
          <p className="text-[#9a9a8a] text-xs mt-2 px-6 leading-relaxed">
            Mulai ambil donasi makanan atau input tracking gizi untuk mengumpulkan poin!
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {history.map(h => {
            const aksi = AKSI_LABEL[h.aksi] || { icon: '⭐', label: h.aksi }
            const style = AKSI_STYLE[h.aksi] || { bg: 'bg-gray-50 border-gray-100', dot: 'bg-gray-400' }
            return (
              <div key={h.id}
                className={`flex items-center gap-3 border rounded-xl px-4 py-3 ${style.bg}`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0 bg-white shadow-sm`}>
                  {aksi.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#1a3a2a] font-medium">{aksi.label}</p>
                  {h.keterangan && (
                    <p className="text-xs text-gray-500 truncate">{h.keterangan}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(h.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
                <span className="text-sm font-bold text-[#2D6A4F] flex-shrink-0 bg-white px-2 py-1 rounded-xl border border-green-100">
                  +{h.poin}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── TAB 5: SERTIFIKAT ───────────────────────────────────────────
function SertifikatTab({ profile }) {
  const [sertifikatList, setSertifikatList] = useState([])
  const [generating, setGenerating]         = useState(false)
  const [loading, setLoading]               = useState(true)

  const BULAN_NAMA = ['','Januari','Februari','Maret','April','Mei','Juni',
                       'Juli','Agustus','September','Oktober','November','Desember']

  useEffect(() => {
    if (!profile?.id) { setLoading(false); return }
    fetchSertifikat()
  }, [profile])

  async function fetchSertifikat() {
    const { data } = await supabase
      .from('sertifikat_csr')
      .select('*')
      .eq('user_id', profile.id)
      .order('tahun', { ascending: false })
      .order('bulan', { ascending: false })
    setSertifikatList(data || [])
    setLoading(false)
  }

  async function generateSertifikat() {
    setGenerating(true)
    const now   = new Date()
    const bulan = now.getMonth() + 1
    const tahun = now.getFullYear()
    const startOfMonth = new Date(tahun, bulan - 1, 1).toISOString()
    const endOfMonth   = new Date(tahun, bulan, 0, 23, 59, 59).toISOString()

    // Hitung dari poin_history (donasi yang sudah dikonfirmasi)
    const { data: donasiHistory } = await supabase
      .from('poin_history')
      .select('id')
      .eq('user_id', profile.id)
      .eq('aksi', 'donasi_porsi')
      .gte('created_at', startOfMonth)
      .lte('created_at', endOfMonth)

    const totalDonasi  = donasiHistory?.length || 0
    const totalPorsi   = totalDonasi * 4        // estimasi rata-rata 4 porsi per donasi
    const totalKeluarga= totalDonasi
    const totalKg      = totalPorsi * 0.3
    const totalCO2     = totalKg * 2.5

    const { error } = await supabase.from('sertifikat_csr').upsert({
      user_id: profile.id, bulan, tahun,
      total_porsi: totalPorsi,
      total_keluarga: totalKeluarga,
      total_kg_food_waste: totalKg,
      total_co2_hemat: totalCO2,
      generated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,bulan,tahun' })

    if (!error) await fetchSertifikat()
    setGenerating(false)
  }

  function downloadSertifikat(s) {
    const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Sertifikat LUMBUNG - ${BULAN_NAMA[s.bulan]} ${s.tahun}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',Arial,sans-serif;background:#f0f9f4;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px}
  .cert{background:white;border:3px solid #2D6A4F;border-radius:24px;max-width:600px;width:100%;padding:48px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.12)}
  .logo{font-size:56px;margin-bottom:8px}
  .platform{font-size:12px;color:#9a9a8a;letter-spacing:3px;text-transform:uppercase;margin-bottom:28px}
  .title{font-size:24px;font-weight:800;color:#1B4332;margin-bottom:8px}
  .subtitle{font-size:13px;color:#6b7280;margin-bottom:32px}
  .nama{font-size:32px;font-weight:800;color:#2D6A4F;margin-bottom:6px;border-bottom:2px solid #b7e4cc;padding-bottom:12px}
  .periode{font-size:14px;color:#9a9a8a;margin:12px 0 36px}
  .stats{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:36px}
  .stat{background:#f0faf4;border:1px solid #b7e4cc;border-radius:16px;padding:20px}
  .stat-icon{font-size:28px;margin-bottom:8px}
  .stat-val{font-size:24px;font-weight:800;color:#2D6A4F}
  .stat-label{font-size:11px;color:#6b7280;margin-top:4px}
  .footer{border-top:1px solid #e8e4db;padding-top:24px;display:flex;justify-content:space-between;align-items:center}
  .badge{background:#2D6A4F;color:white;padding:8px 18px;border-radius:999px;font-size:13px;font-weight:600}
  .date{font-size:11px;color:#9a9a8a}
  @media print{body{background:white}.cert{box-shadow:none}}
</style>
</head>
<body>
<div class="cert">
  <div class="logo">🌾</div>
  <div class="platform">LUMBUNG Platform</div>
  <div class="title">Sertifikat Kontribusi Sosial</div>
  <div class="subtitle">Dengan bangga diberikan kepada</div>
  <div class="nama">${profile?.nama || 'Pengguna LUMBUNG'}</div>
  <div class="periode">Atas kontribusi nyata selama <strong>${BULAN_NAMA[s.bulan]} ${s.tahun}</strong></div>
  <div class="stats">
    <div class="stat"><div class="stat-icon">🍱</div><div class="stat-val">${s.total_porsi}</div><div class="stat-label">Porsi Makanan Diselamatkan</div></div>
    <div class="stat"><div class="stat-icon">👨‍👩‍👧</div><div class="stat-val">${s.total_keluarga}</div><div class="stat-label">Keluarga Terbantu</div></div>
    <div class="stat"><div class="stat-icon">♻️</div><div class="stat-val">${parseFloat(s.total_kg_food_waste||0).toFixed(1)} kg</div><div class="stat-label">Food Waste Dicegah</div></div>
    <div class="stat"><div class="stat-icon">🌿</div><div class="stat-val">${parseFloat(s.total_co2_hemat||0).toFixed(1)} kg</div><div class="stat-label">CO₂ Dihemat</div></div>
  </div>
  <div class="footer">
    <div class="date">Diterbitkan: ${new Date(s.generated_at||Date.now()).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}</div>
    <div class="badge">✓ Verified LUMBUNG</div>
  </div>
</div>
<script>window.onload=()=>window.print()</script>
</body>
</html>`

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `Sertifikat-LUMBUNG-${BULAN_NAMA[s.bulan]}-${s.tahun}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const now            = new Date()
  const sudahAdaBulanIni = sertifikatList.some(
    s => s.bulan === now.getMonth() + 1 && s.tahun === now.getFullYear()
  )

  // Sertifikat tersedia untuk warung + keluarga yang sudah donasi
  const bolehGenerate = profile?.role === 'warung' || profile?.role === 'keluarga'

  if (!bolehGenerate) {
    return (
      <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
        <p className="text-5xl mb-3">📜</p>
        <p className="text-gray-600 text-sm font-semibold">Sertifikat kontribusi</p>
        <p className="text-gray-400 text-xs mt-1 px-6">Tersedia untuk akun Keluarga dan Warung</p>
      </div>
    )
  }

  return (
    <div>
      <div className="bg-[#f0faf4] border border-[#b7e4cc] rounded-2xl p-3 mb-4">
        <p className="text-xs text-[#2D6A4F] font-semibold mb-0.5">📜 Sertifikat Kontribusi Sosial</p>
        <p className="text-xs text-[#5a7a6a]">
          Bukti digital kontribusimu untuk laporan sosial. Generate per bulan, lalu download sebagai file HTML yang bisa di-Print/Save as PDF.
        </p>
      </div>

      {!sudahAdaBulanIni && (
        <button onClick={generateSertifikat} disabled={generating}
          className="w-full bg-[#2D6A4F] text-white py-3.5 rounded-2xl text-sm font-semibold mb-4 disabled:opacity-50 hover:bg-[#235c43] transition-all">
          {generating ? '⏳ Membuat sertifikat...' : `📜 Generate Sertifikat ${BULAN_NAMA[now.getMonth()+1]} ${now.getFullYear()}`}
        </button>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1,2].map(i => <div key={i} className="border rounded-2xl p-4 h-40 animate-pulse bg-gray-50" />)}
        </div>
      ) : sertifikatList.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <p className="text-gray-400 text-sm">Belum ada sertifikat. Klik tombol di atas untuk generate!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sertifikatList.map(s => (
            <div key={s.id} className="border-2 border-[#2D6A4F] rounded-2xl p-4 bg-gradient-to-br from-[#f0faf4] to-white">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-[#9a9a8a]">Sertifikat Kontribusi Sosial</p>
                  <p className="font-bold text-[#1B4332] text-base">{BULAN_NAMA[s.bulan]} {s.tahun}</p>
                </div>
                <span className="text-3xl">🌾</span>
              </div>
              <p className="text-sm font-semibold text-[#1B4332] mb-3">{profile?.nama}</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { icon: '🍱', label: 'Total Porsi',       val: `${s.total_porsi} porsi` },
                  { icon: '👨‍👩‍👧', label: 'Keluarga Terbantu', val: `${s.total_keluarga} keluarga` },
                  { icon: '♻️', label: 'Food Waste',        val: `${parseFloat(s.total_kg_food_waste||0).toFixed(1)} kg` },
                  { icon: '🌿', label: 'CO₂ Hemat',         val: `${parseFloat(s.total_co2_hemat||0).toFixed(1)} kg` },
                ].map(item => (
                  <div key={item.label} className="bg-white rounded-xl p-2.5 border border-green-100">
                    <p className="text-xs text-gray-500">{item.icon} {item.label}</p>
                    <p className="text-sm font-bold text-[#2D6A4F]">{item.val}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-green-100">
                <p className="text-xs text-gray-400">Diterbitkan oleh LUMBUNG Platform</p>
                <button
                  onClick={() => downloadSertifikat(s)}
                  className="flex items-center gap-1.5 bg-[#2D6A4F] text-white text-xs px-3 py-2 rounded-xl font-semibold hover:bg-[#235c43] transition-all">
                  ⬇️ Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
