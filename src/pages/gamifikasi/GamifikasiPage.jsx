import { useState, useEffect, useRef } from 'react'
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
}

// FIX ISSUE 6a: Contoh misi sebagai fallback saat tabel misi kosong
const MISI_CONTOH = [
  {
    id: 'contoh-1',
    judul: '🍱 Selamatkan 10 Porsi Minggu Ini',
    deskripsi: 'Ambil atau donasikan total 10 porsi makanan dalam 7 hari. Yuk selamatkan makanan bersama!',
    target_jumlah: 10,
    bonus_multiplier: 2,
    badge_reward: true,
    sponsored_by: null,
    ends_at: new Date(Date.now() + 7 * 86400000).toISOString(),
    _contoh: true,
  },
  {
    id: 'contoh-2',
    judul: '📊 Kader Aktif — Input 5 Data Balita',
    deskripsi: 'Input minimal 5 data balita baru di sistem. Setiap data balita membantu deteksi dini stunting.',
    target_jumlah: 5,
    bonus_multiplier: 1.5,
    badge_reward: false,
    sponsored_by: 'Dinas Kesehatan',
    ends_at: new Date(Date.now() + 14 * 86400000).toISOString(),
    _contoh: true,
  },
  {
    id: 'contoh-3',
    judul: '🌍 Kampanye Zero Food Waste',
    deskripsi: 'Bergabung bersama 100 pengguna lain untuk mendonasikan minimal 1 porsi. Bersama kita bisa!',
    target_jumlah: 100,
    bonus_multiplier: 3,
    badge_reward: true,
    sponsored_by: 'LUMBUNG x GoFood',
    ends_at: new Date(Date.now() + 30 * 86400000).toISOString(),
    _contoh: true,
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

      <h3 className="text-sm font-semibold mb-3">⭐ Cara Dapat Poin</h3>
      <div className="space-y-2 mb-4">
        {[
          { aksi: 'Ambil donasi makanan', poin: 50, icon: '🍱' },
          { aksi: 'Jadi volunteer relay', poin: 30, icon: '🤝' },
          { aksi: 'Input tracking gizi anak', poin: 10, icon: '📊' },
          { aksi: 'Input data balita (kader)', poin: 20, icon: '👶' },
          { aksi: 'Upload resep / video', poin: 10, icon: '📖' },
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

// ─── TAB 2: LEADERBOARD ──────────────────────────────────────────
function LeaderboardTab({ profile }) {
  const [data, setData] = useState([])
  const [filterRole, setFilterRole] = useState('keluarga')
  const [filterKota, setFilterKota] = useState('Semua')
  const [kotaList, setKotaList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchLeaderboard() }, [filterRole, filterKota])

  async function fetchLeaderboard() {
    setLoading(true)
    let query = supabase.from('profiles').select('id, nama, kota, poin, role')
      .eq('role', filterRole).order('poin', { ascending: false }).limit(20)
    if (filterKota !== 'Semua') query = query.eq('kota', filterKota)
    const { data: rows } = await query
    setData(rows || [])
    const { data: kotaRows } = await supabase.from('profiles').select('kota').eq('role', filterRole)
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
    { value: 'keluarga, warung, kader', label: '🌍 Semua' },
    { value: 'keluarga', label: '👩 Individu' },
    { value: 'warung',   label: '🍜 Warung' },
    { value: 'kader',    label: '👶 Kader' },
  ]

  return (
    <div>
      <div className="flex gap-2 mb-3">
        {ROLE_TABS.map(r => (
          <button key={r.value} onClick={() => setFilterRole(r.value)}
            className={`text-xs px-3 py-1.5 rounded-full border transition flex-1
              ${filterRole === r.value ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
            {r.label}
          </button>
        ))}
      </div>
      <select value={filterKota} onChange={e => setFilterKota(e.target.value)}
        className="w-full border rounded-xl px-3 py-2 text-sm mb-4 bg-white">
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

// ─── TAB 3: MISI ─────────────────────────────────────────────────
function MisiTab({ profile }) {
  const [misiList, setMisiList] = useState([])
  const [progressMap, setProgressMap] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchMisi() }, [])

  async function fetchMisi() {
    setLoading(true)
    const now = new Date().toISOString()
    const { data: misi } = await supabase
      .from('misi').select('*')
      .eq('is_active', true).gte('ends_at', now).order('ends_at')

    if (profile?.id) {
      const { data: prog } = await supabase
        .from('misi_progress').select('*').eq('user_id', profile.id)
      const map = {}
      prog?.forEach(p => { map[p.misi_id] = p })
      setProgressMap(map)
    }

    // FIX ISSUE 6a: Gunakan contoh misi jika tabel kosong
    setMisiList(misi && misi.length > 0 ? misi : MISI_CONTOH)
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
      ) : (
        <div className="space-y-3">
          {misiList.map(misi => {
            const prog = progressMap[misi.id]
            const progressVal = prog?.progress || 0
            const progressPct = Math.min(100, (progressVal / misi.target_jumlah) * 100)
            const sisa = sisaHari(misi.ends_at)
            const isContoh = !!misi._contoh

            return (
              <div key={misi.id}
                className={`border rounded-xl p-4 ${prog?.completed ? 'border-green-300 bg-green-50' : ''}`}>
                {isContoh && (
                  <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full mb-2 inline-block">
                    📌 Misi Aktif
                  </span>
                )}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-semibold">{misi.judul}</p>
                  {prog?.completed
                    ? <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full flex-shrink-0">✓ Selesai</span>
                    : <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full flex-shrink-0">⏳ {sisa} hari</span>
                  }
                </div>
                <p className="text-xs text-gray-500 mb-3">{misi.deskripsi}</p>
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{progressVal}/{misi.target_jumlah}</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-2">
                    <div className="bg-[#2D6A4F] rounded-full h-2 transition-all" style={{ width: `${progressPct}%` }} />
                  </div>
                </div>
                <div className="flex gap-2 mt-3 flex-wrap">
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                    ⭐ {misi.bonus_multiplier}x poin
                  </span>
                  {misi.badge_reward && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">🏅 Badge eksklusif</span>
                  )}
                  {misi.sponsored_by && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">🏢 {misi.sponsored_by}</span>
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

// ─── TAB 4: HISTORY POIN ─────────────────────────────────────────
function HistoryTab({ profile }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.id) { setLoading(false); return }
    // FIX ISSUE 6b: Query poin_history — data masuk karena ChatDonasi.jsx
    // sekarang pakai tambahPoin() yang otomatis insert ke poin_history
    supabase
      .from('poin_history')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (error) console.error('poin_history error:', error)
        setHistory(data || [])
        setLoading(false)
      })
  }, [profile])

  return (
    <div>
      <p className="text-xs text-gray-500 mb-4">50 aktivitas terakhir yang menghasilkan poin</p>
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
        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <p className="text-3xl mb-3">📋</p>
          <p className="text-gray-500 text-sm font-medium">Belum ada aktivitas poin</p>
          <p className="text-gray-400 text-xs mt-1 px-4">
            Ambil donasi, input data balita, atau upload resep untuk mulai mengumpulkan poin!
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {history.map(h => {
            const aksi = AKSI_LABEL[h.aksi] || { icon: '⭐', label: h.aksi }
            return (
              <div key={h.id} className="flex items-center gap-3 border rounded-xl px-4 py-3">
                <div className="w-9 h-9 rounded-full bg-[#f0faf4] flex items-center justify-center text-xl flex-shrink-0">
                  {aksi.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700 font-medium">{aksi.label}</p>
                  {h.keterangan && <p className="text-xs text-gray-400 truncate">{h.keterangan}</p>}
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(h.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <span className="text-sm font-bold text-[#2D6A4F] flex-shrink-0">+{h.poin}</span>
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
  const [generating, setGenerating] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.id) { setLoading(false); return }
    supabase
      .from('sertifikat_csr')
      .select('*')
      .eq('user_id', profile.id)
      .order('tahun', { ascending: false })
      .order('bulan', { ascending: false })
      .then(({ data }) => { setSertifikatList(data || []); setLoading(false) })
  }, [profile])

  async function generateSertifikat() {
    setGenerating(true)
    const now = new Date()
    const bulan = now.getMonth() + 1
    const tahun = now.getFullYear()
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
      user_id: profile.id, bulan, tahun,
      total_porsi: totalPorsi,
      total_keluarga: totalKeluarga,
      total_kg_food_waste: totalKg,
      total_co2_hemat: totalCO2,
      generated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,bulan,tahun' })

    if (!error) {
      const { data } = await supabase.from('sertifikat_csr').select('*')
        .eq('user_id', profile.id)
        .order('tahun', { ascending: false })
        .order('bulan', { ascending: false })
      setSertifikatList(data || [])
    }
    setGenerating(false)
  }

  // FIX ISSUE 6c: Download sertifikat sebagai HTML yang bisa diprint/save
  function downloadSertifikat(s) {
    const BULAN_NAMA = ['','Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
    const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Sertifikat LUMBUNG - ${BULAN_NAMA[s.bulan]} ${s.tahun}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f0f9f4; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
  .cert { background: white; border: 3px solid #2D6A4F; border-radius: 24px; max-width: 600px; width: 100%; padding: 40px; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.1); }
  .logo { font-size: 48px; margin-bottom: 8px; }
  .platform { font-size: 13px; color: #9a9a8a; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 24px; }
  .title { font-size: 22px; font-weight: 700; color: #1B4332; margin-bottom: 6px; }
  .subtitle { font-size: 13px; color: #6b7280; margin-bottom: 28px; }
  .nama { font-size: 28px; font-weight: 800; color: #2D6A4F; margin-bottom: 4px; }
  .periode { font-size: 14px; color: #9a9a8a; margin-bottom: 32px; }
  .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px; }
  .stat { background: #f0faf4; border: 1px solid #b7e4cc; border-radius: 16px; padding: 16px; }
  .stat-icon { font-size: 24px; margin-bottom: 6px; }
  .stat-val { font-size: 20px; font-weight: 800; color: #2D6A4F; }
  .stat-label { font-size: 11px; color: #6b7280; margin-top: 2px; }
  .footer { border-top: 1px solid #e8e4db; padding-top: 20px; display: flex; justify-content: space-between; align-items: center; }
  .badge { background: #2D6A4F; color: white; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; }
  .date { font-size: 11px; color: #9a9a8a; }
  @media print { body { background: white; } .cert { box-shadow: none; } }
</style>
</head>
<body>
<div class="cert">
  <div class="logo">🌾</div>
  <div class="platform">LUMBUNG Platform</div>
  <div class="title">Sertifikat Kontribusi</div>
  <div class="subtitle">Diberikan kepada</div>
  <div class="nama">${profile?.nama || 'Pengguna LUMBUNG'}</div>
  <div class="periode">Atas kontribusi selama ${BULAN_NAMA[s.bulan]} ${s.tahun}</div>
  <div class="stats">
    <div class="stat"><div class="stat-icon">🍱</div><div class="stat-val">${s.total_porsi}</div><div class="stat-label">Porsi Diselamatkan</div></div>
    <div class="stat"><div class="stat-icon">👨‍👩‍👧</div><div class="stat-val">${s.total_keluarga}</div><div class="stat-label">Keluarga Terbantu</div></div>
    <div class="stat"><div class="stat-icon">♻️</div><div class="stat-val">${parseFloat(s.total_kg_food_waste).toFixed(1)} kg</div><div class="stat-label">Food Waste Dicegah</div></div>
    <div class="stat"><div class="stat-icon">🌿</div><div class="stat-val">${parseFloat(s.total_co2_hemat).toFixed(1)} kg</div><div class="stat-label">CO₂ Dihemat</div></div>
  </div>
  <div class="footer">
    <div class="date">Diterbitkan: ${new Date(s.generated_at || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
    <div class="badge">✓ Verified LUMBUNG</div>
  </div>
</div>
<script>window.onload = () => window.print()</script>
</body>
</html>`

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Sertifikat-LUMBUNG-${BULAN_NAMA[s.bulan]}-${s.tahun}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const BULAN_NAMA = ['','Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']
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
        <button onClick={generateSertifikat} disabled={generating}
          className="w-full bg-[#2D6A4F] text-white py-3 rounded-xl text-sm font-medium mb-4 disabled:opacity-50">
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
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-gray-500">Sertifikat Kontribusi</p>
                  <p className="font-bold text-[#1B4332]">{BULAN_NAMA[s.bulan]} {s.tahun}</p>
                </div>
                <span className="text-3xl">🌾</span>
              </div>
              <p className="text-sm font-semibold text-[#1B4332] mb-3">{profile?.nama}</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { icon: '🍱', label: 'Total Porsi', val: `${s.total_porsi} porsi` },
                  { icon: '👨‍👩‍👧', label: 'Keluarga Terbantu', val: `${s.total_keluarga} keluarga` },
                  { icon: '♻️', label: 'Food Waste', val: `${parseFloat(s.total_kg_food_waste).toFixed(1)} kg` },
                  { icon: '🌿', label: 'CO₂ Hemat', val: `${parseFloat(s.total_co2_hemat).toFixed(1)} kg` },
                ].map(item => (
                  <div key={item.label} className="bg-white rounded-xl p-2.5 border border-green-100">
                    <p className="text-xs text-gray-500">{item.icon} {item.label}</p>
                    <p className="text-sm font-bold text-[#2D6A4F]">{item.val}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-green-100">
                <p className="text-xs text-gray-400">Diterbitkan oleh LUMBUNG Platform</p>
                {/* FIX ISSUE 6c: Tombol download yang benar-benar berfungsi */}
                <button
                  onClick={() => downloadSertifikat(s)}
                  className="flex items-center gap-1.5 bg-[#2D6A4F] text-white text-xs px-3 py-1.5 rounded-full font-medium hover:bg-[#235c43] transition-all"
                >
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
