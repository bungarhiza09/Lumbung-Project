// src/pages/PetaGizi.jsx
import { useEffect, useState } from 'react'
import Layout from '../../../components/Layout'
import { useStatistikWilayah } from '../../../hooks/useBalita'

const RISIKO_CONFIG = {
  merah:  { label: 'Risiko Tinggi',   bg: 'bg-red-100',    border: 'border-red-300',    text: 'text-red-700',    dot: '🔴', bar: 'bg-red-500' },
  kuning: { label: 'Waspada',         bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-700', dot: '🟡', bar: 'bg-yellow-500' },
  hijau:  { label: 'Aman',            bg: 'bg-green-100',  border: 'border-green-300',  text: 'text-green-700',  dot: '🟢', bar: 'bg-green-500' },
  abu:    { label: 'Belum Ada Data',  bg: 'bg-gray-100',   border: 'border-gray-200',   text: 'text-gray-500',   dot: '⚪', bar: 'bg-gray-300' },
}

function getRisikoKey(persen, totalDiukur) {
  if (!totalDiukur || totalDiukur === 0) return 'abu'
  if (persen > 30) return 'merah'
  if (persen > 15) return 'kuning'
  return 'hijau'
}

function WilayahCard({ wilayah, onClick, selected }) {
  const rKey = getRisikoKey(wilayah.persen_stunting, wilayah.total_diukur)
  const cfg  = RISIKO_CONFIG[rKey]
  const pct  = Math.min(wilayah.persen_stunting || 0, 100)

  return (
    <button
      onClick={() => onClick(wilayah)}
      className={`w-full text-left rounded-2xl border p-4 transition-all ${
        selected ? 'ring-2 ring-[#534AB7] ring-offset-1' : ''
      } ${cfg.bg} ${cfg.border}`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <p className="text-sm font-bold text-[#1a3a2a]">{wilayah.kelurahan}</p>
          <p className="text-xs text-[#6a7a6a] mt-0.5">{wilayah.kecamatan} · {wilayah.kabupaten}</p>
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
          {cfg.dot} {cfg.label}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-2">
        <div className="flex justify-between text-xs mb-1">
          <span className={`font-semibold ${cfg.text}`}>Prevalensi Stunting</span>
          <span className="font-bold text-[#1a3a2a]">{pct}%</span>
        </div>
        <div className="h-2 bg-white/60 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${cfg.bar}`} style={{ width: `${pct}%` }} />
        </div>
        <div className="flex items-center gap-1 mt-1">
          <div className="w-full h-px bg-white/40 relative">
            <div className="absolute top-[-3px] h-2 w-px bg-yellow-500" style={{ left: '15%' }} />
            <div className="absolute top-[-3px] h-2 w-px bg-red-500"    style={{ left: '30%' }} />
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2 mt-2">
        {[
          { label: 'Total Balita', val: wilayah.total_balita || 0 },
          { label: 'Diukur',      val: wilayah.total_diukur || 0 },
          { label: 'Stunting',    val: (wilayah.jumlah_stunting || 0) + (wilayah.jumlah_gizi_buruk || 0) },
        ].map(({ label, val }) => (
          <div key={label} className="bg-white/60 rounded-xl p-2 text-center">
            <p className="text-base font-bold text-[#1a3a2a]">{val}</p>
            <p className="text-[10px] text-[#6a7a6a]">{label}</p>
          </div>
        ))}
      </div>
    </button>
  )
}

function DetailPanel({ wilayah, onClose }) {
  if (!wilayah) return null
  const rKey = getRisikoKey(wilayah.persen_stunting, wilayah.total_diukur)
  const cfg  = RISIKO_CONFIG[rKey]

  const items = [
    { label: 'Total Balita',   val: wilayah.total_balita || 0,    color: 'text-[#1a3a2a]' },
    { label: 'Sudah Diukur',   val: wilayah.total_diukur || 0,    color: 'text-[#2D6A4F]' },
    { label: 'Normal',         val: wilayah.jumlah_normal || 0,   color: 'text-green-600' },
    { label: 'Berisiko',       val: wilayah.jumlah_berisiko || 0, color: 'text-yellow-600' },
    { label: 'Stunting',       val: wilayah.jumlah_stunting || 0, color: 'text-red-600' },
    { label: 'Wasting',        val: wilayah.jumlah_wasting || 0,  color: 'text-red-600' },
    { label: 'Gizi Buruk',     val: wilayah.jumlah_gizi_buruk || 0, color: 'text-red-800' },
  ]

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center">
      <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-[#1a3a2a]">{wilayah.kelurahan}</h3>
            <p className="text-xs text-[#6a7a6a]">{wilayah.kecamatan} · {wilayah.kabupaten}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#f4f4f0] flex items-center justify-center text-[#4a4a3a] text-sm">✕</button>
        </div>

        {/* Status Badge */}
        <div className={`${cfg.bg} ${cfg.border} border rounded-2xl p-4 mb-4 flex items-center gap-3`}>
          <span className="text-3xl">{cfg.dot}</span>
          <div>
            <p className={`text-base font-bold ${cfg.text}`}>{cfg.label}</p>
            <p className={`text-sm ${cfg.text}`}>Prevalensi stunting: {wilayah.persen_stunting || 0}%</p>
          </div>
        </div>

        {/* Detail stats */}
        <div className="grid grid-cols-2 gap-3">
          {items.map(({ label, val, color }) => (
            <div key={label} className="bg-[#f4f4f0] rounded-xl p-3">
              <p className="text-xs text-[#9a9a8a]">{label}</p>
              <p className={`text-xl font-bold mt-0.5 ${color}`}>{val}</p>
            </div>
          ))}
        </div>

        {/* Rekomendasi */}
        {rKey === 'merah' && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-2xl p-3">
            <p className="text-xs font-bold text-red-700 mb-1">⚠️ Perlu Intervensi Segera</p>
            <p className="text-xs text-red-600">Prevalensi &gt;30% — koordinasikan dengan Puskesmas dan Dinas Kesehatan untuk intervensi gizi darurat.</p>
          </div>
        )}
        {rKey === 'kuning' && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-2xl p-3">
            <p className="text-xs font-bold text-yellow-700 mb-1">🔔 Perlu Perhatian</p>
            <p className="text-xs text-yellow-600">Prevalensi 15–30% — tingkatkan frekuensi pemantauan dan edukasi gizi untuk orang tua.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function PetaGizi() {
  const { data: wilayahData, loading, error, fetch } = useStatistikWilayah()
  const [selected, setSelected] = useState(null)
  const [filterRisiko, setFilterRisiko] = useState('semua')

  useEffect(() => { fetch() }, [fetch])

  const filtered = wilayahData.filter(w => {
    if (filterRisiko === 'semua') return true
    const rKey = getRisikoKey(w.persen_stunting, w.total_diukur)
    return rKey === filterRisiko
  })

  // Ringkasan
  const ringkasan = {
    merah:  wilayahData.filter(w => getRisikoKey(w.persen_stunting, w.total_diukur) === 'merah').length,
    kuning: wilayahData.filter(w => getRisikoKey(w.persen_stunting, w.total_diukur) === 'kuning').length,
    hijau:  wilayahData.filter(w => getRisikoKey(w.persen_stunting, w.total_diukur) === 'hijau').length,
    abu:    wilayahData.filter(w => getRisikoKey(w.persen_stunting, w.total_diukur) === 'abu').length,
  }

  return (
    <Layout>
      {/* Header */}
      <div className="mb-5">
        <button onClick={() => window.history.back()} className="text-sm text-[#534AB7] font-semibold mb-3 flex items-center gap-1">← Kembali</button>
        <h1 className="text-2xl font-bold text-[#1a3a2a]">Peta Gizi Wilayah 🗺️</h1>
        <p className="text-sm text-[#7a8a7a] mt-1">Risiko stunting per kelurahan</p>
      </div>

      {/* Legend */}
      <div className="bg-white border border-[#e8e4db] rounded-2xl p-4 mb-4">
        <p className="text-xs font-semibold text-[#4a4a3a] mb-3">Keterangan Warna:</p>
        <div className="space-y-1.5">
          {[
            { color: 'bg-red-500',    label: 'Merah — Risiko Tinggi (>30%)',  val: ringkasan.merah  },
            { color: 'bg-yellow-500', label: 'Kuning — Waspada (15–30%)',     val: ringkasan.kuning },
            { color: 'bg-green-500',  label: 'Hijau — Aman (<15%)',           val: ringkasan.hijau  },
            { color: 'bg-gray-300',   label: 'Abu — Belum Ada Data',          val: ringkasan.abu    },
          ].map(({ color, label, val }) => (
            <div key={label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${color} flex-shrink-0`} />
                <span className="text-xs text-[#4a4a3a]">{label}</span>
              </div>
              <span className="text-xs font-bold text-[#1a3a2a]">{val} kelurahan</span>
            </div>
          ))}
        </div>
      </div>

      {/* Ringkasan Stats */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { key: 'merah',  label: 'Kritis',   color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200' },
          { key: 'kuning', label: 'Waspada',  color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
          { key: 'hijau',  label: 'Aman',     color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-200' },
          { key: 'abu',    label: 'No Data',  color: 'text-gray-500',   bg: 'bg-gray-50',   border: 'border-gray-200' },
        ].map(({ key, label, color, bg, border }) => (
          <div key={key} className={`${bg} border ${border} rounded-2xl p-3 text-center`}>
            <p className={`text-xl font-bold ${color}`}>{ringkasan[key]}</p>
            <p className="text-[10px] text-[#9a9a8a] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filter Risiko */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
        {[
          { val: 'semua',  label: '🗺️ Semua' },
          { val: 'merah',  label: '🔴 Kritis' },
          { val: 'kuning', label: '🟡 Waspada' },
          { val: 'hijau',  label: '🟢 Aman' },
          { val: 'abu',    label: '⚪ No Data' },
        ].map(({ val, label }) => (
          <button
            key={val}
            onClick={() => setFilterRisiko(val)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border flex-shrink-0 transition-all ${
              filterRisiko === val
                ? 'bg-[#534AB7] text-white border-[#534AB7]'
                : 'bg-white text-[#4a4a3a] border-[#e8e4db]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Daftar Wilayah */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-36 bg-[#f4f4f0] rounded-2xl animate-pulse" />)}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
          <p className="text-sm text-red-600">⚠️ {error}</p>
          <button onClick={fetch} className="mt-2 text-xs text-red-500 underline">Coba lagi</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-4xl mb-3">🗺️</p>
          <p className="text-sm font-semibold text-[#1a3a2a]">Tidak ada wilayah</p>
          <p className="text-xs text-[#9a9a8a] mt-1">Belum ada data wilayah untuk filter ini</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(w => (
            <WilayahCard
              key={w.wilayah_id}
              wilayah={w}
              onClick={setSelected}
              selected={selected?.wilayah_id === w.wilayah_id}
            />
          ))}
        </div>
      )}

      {selected && <DetailPanel wilayah={selected} onClose={() => setSelected(null)} />}
    </Layout>
  )
}