// src/pages/DaftarBalita.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../../components/Layout'
import { useBalitaList, useWilayah } from '../../hooks/useBalita'

const STATUS_CONFIG = {
  normal:       { label: 'Normal',      bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500' },
  berisiko:     { label: 'Berisiko',    bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  stunting:     { label: 'Stunting',    bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500' },
  wasting:      { label: 'Wasting',     bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500' },
  gizi_buruk:   { label: 'Gizi Buruk',  bg: 'bg-red-200',    text: 'text-red-800',    dot: 'bg-red-700' },
  gizi_lebih:   { label: 'Gizi Lebih',  bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
  belum_diukur: { label: 'Belum Diukur',bg: 'bg-gray-100',   text: 'text-gray-500',   dot: 'bg-gray-400' },
}

const USIA_FILTER = [
  { label: 'Semua',    min: 0,  max: 60 },
  { label: '0–6 bln',  min: 0,  max: 6  },
  { label: '6–12 bln', min: 6,  max: 12 },
  { label: '1–2 thn',  min: 12, max: 24 },
  { label: '2–5 thn',  min: 24, max: 60 },
]

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.belum_diukur
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

function formatUsia(bulan) {
  if (bulan === null || bulan === undefined) return '—'
  if (bulan < 12) return `${bulan} bln`
  const th = Math.floor(bulan / 12)
  const sisa = bulan % 12
  return sisa > 0 ? `${th} thn ${sisa} bln` : `${th} thn`
}

function BalitaCard({ balita }) {
  const jkEmoji = balita.jenis_kelamin === 'L' ? '👦' : '👧'
  return (
    <Link
      to={`/balita/${balita.id}`}
      className="bg-white rounded-2xl border border-[#e8e4db] p-4 flex items-start gap-3 hover:shadow-md hover:border-[#c4b8f9] transition-all active:scale-[0.98]"
    >
      <div className="w-10 h-10 rounded-2xl bg-[#EDE9FE] flex items-center justify-center text-lg flex-shrink-0">
        {jkEmoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-bold text-[#1a3a2a] leading-tight truncate">{balita.nama}</p>
            <p className="text-xs text-[#9a9a8a] mt-0.5">
              {formatUsia(balita.usia_bulan_sekarang)} · {balita.kelurahan || '—'}
              {balita.rt && ` · RT ${balita.rt}`}
            </p>
          </div>
          <StatusBadge status={balita.status_gizi} />
        </div>
        {balita.berat_badan_kg ? (
          <div className="mt-2 flex items-center gap-3 text-xs text-[#6a7a6a]">
            <span>⚖️ {balita.berat_badan_kg} kg</span>
            <span>📏 {balita.tinggi_badan_cm} cm</span>
            {balita.tanggal_ukur && (
              <span className="text-[#9a9a8a]">
                {new Date(balita.tanggal_ukur).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
              </span>
            )}
          </div>
        ) : (
          <p className="mt-1.5 text-xs text-[#9a9a8a] italic">Belum ada pengukuran</p>
        )}
      </div>
      <span className="text-[#c4b8f9] text-lg flex-shrink-0 self-center">›</span>
    </Link>
  )
}

export default function DaftarBalita() {
  const { data: balitaList, loading, error, fetch } = useBalitaList()
  const { data: wilayahList, fetch: fetchWilayah } = useWilayah()

  const [search, setSearch]           = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterWilayah, setFilterWilayah] = useState('')
  const [filterUsia, setFilterUsia]   = useState(0)
  const [showFilter, setShowFilter]   = useState(false)

  useEffect(() => {
    fetchWilayah()
    fetch({})
  }, [])

  const applyFilter = () => {
    const usia = USIA_FILTER[filterUsia]
    fetch({
      search:      search || undefined,
      status_gizi: filterStatus  || undefined,
      wilayah_id:  filterWilayah || undefined,
      usia_min:    usia.min,
      usia_max:    usia.max,
    })
  }

  useEffect(() => { applyFilter() }, [filterStatus, filterWilayah, filterUsia])

  const stats = {
    total:      balitaList.length,
    stunting:   balitaList.filter(b => ['stunting','gizi_buruk'].includes(b.status_gizi)).length,
    berisiko:   balitaList.filter(b => b.status_gizi === 'berisiko').length,
    belumDiukur:balitaList.filter(b => !b.status_gizi).length,
  }

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-[#1a3a2a]">Daftar Balita</h1>
          <p className="text-sm text-[#7a8a7a] mt-0.5">{stats.total} balita terdaftar</p>
        </div>
        <Link
          to="/balita/input"
          className="bg-[#534AB7] text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-[#534AB7]/20"
        >
          + Tambah
        </Link>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        {[
          { label: 'Total',       val: stats.total,       color: 'text-[#1a3a2a]',  bg: 'bg-white' },
          { label: 'Stunting',    val: stats.stunting,    color: 'text-red-600',    bg: 'bg-red-50' },
          { label: 'Berisiko',    val: stats.berisiko,    color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Belum Ukur',  val: stats.belumDiukur, color: 'text-gray-500',   bg: 'bg-gray-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-3 text-center border border-[#e8e4db]`}>
            <div className={`text-xl font-bold ${s.color}`}>{s.val}</div>
            <div className="text-[10px] text-[#9a9a8a] mt-0.5 leading-tight">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="mb-4 space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && applyFilter()}
              placeholder="Cari nama balita..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#e8e4db] bg-white text-sm focus:outline-none focus:border-[#534AB7]"
            />
            <span className="absolute left-3 top-3.5 text-[#9a9a8a] text-sm">🔍</span>
          </div>
          <button
            onClick={() => setShowFilter(f => !f)}
            className={`px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${showFilter ? 'bg-[#EDE9FE] border-[#c4b8f9] text-[#534AB7]' : 'bg-white border-[#e8e4db] text-[#4a4a3a]'}`}
          >
            🔽 Filter
          </button>
        </div>

        {showFilter && (
          <div className="bg-white border border-[#e8e4db] rounded-2xl p-4 space-y-4">
            {/* Filter Status */}
            <div>
              <p className="text-xs font-semibold text-[#4a4a3a] mb-2">Status Gizi</p>
              <div className="flex flex-wrap gap-2">
                {[['','Semua'],['normal','Normal'],['berisiko','Berisiko'],['stunting','Stunting'],['wasting','Wasting'],['gizi_buruk','Gizi Buruk']].map(([val, lbl]) => (
                  <button
                    key={val}
                    onClick={() => setFilterStatus(val)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${filterStatus === val ? 'bg-[#534AB7] text-white border-[#534AB7]' : 'bg-white text-[#4a4a3a] border-[#e8e4db]'}`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Usia */}
            <div>
              <p className="text-xs font-semibold text-[#4a4a3a] mb-2">Rentang Usia</p>
              <div className="flex flex-wrap gap-2">
                {USIA_FILTER.map((u, i) => (
                  <button
                    key={i}
                    onClick={() => setFilterUsia(i)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${filterUsia === i ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]' : 'bg-white text-[#4a4a3a] border-[#e8e4db]'}`}
                  >
                    {u.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Wilayah */}
            <div>
              <p className="text-xs font-semibold text-[#4a4a3a] mb-2">Wilayah</p>
              <select
                value={filterWilayah}
                onChange={e => setFilterWilayah(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#e8e4db] bg-white text-sm focus:outline-none focus:border-[#534AB7]"
              >
                <option value="">Semua Wilayah</option>
                {wilayahList.map(w => (
                  <option key={w.id} value={w.id}>{w.kelurahan} — {w.kecamatan}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-[#e8e4db] p-4 h-20 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
          <p className="text-sm text-red-600">⚠️ {error}</p>
          <button onClick={() => fetch({})} className="mt-2 text-xs text-red-500 underline">Coba lagi</button>
        </div>
      ) : balitaList.length === 0 ? (
        <div className="flex flex-col items-center py-14 text-center">
          <div className="text-5xl mb-4">👶</div>
          <p className="text-base font-semibold text-[#1a3a2a]">Belum ada data balita</p>
          <p className="text-sm text-[#9a9a8a] mt-1 mb-5">Mulai tambah data balita di wilayahmu</p>
          <Link
            to="/balita/input"
            className="bg-[#534AB7] text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-md shadow-[#534AB7]/25"
          >
            + Tambah Balita Pertama
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {balitaList.map(b => <BalitaCard key={b.id} balita={b} />)}
        </div>
      )}
    </Layout>
  )
}