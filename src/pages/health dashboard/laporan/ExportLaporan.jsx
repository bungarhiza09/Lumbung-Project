// src/pages/ExportLaporan.jsx
import { useEffect, useState } from 'react'
import Layout from '../../../components/Layout'
import { useExportLaporan, useWilayah, useStatistikWilayah } from '../../../hooks/useBalita'

const PERIODE_PRESETS = [
  {
    label: 'Bulan Ini',
    get: () => {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      return { mulai: start.toISOString().split('T')[0], akhir: end.toISOString().split('T')[0] }
    },
  },
  {
    label: 'Bulan Lalu',
    get: () => {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const end   = new Date(now.getFullYear(), now.getMonth(), 0)
      return { mulai: start.toISOString().split('T')[0], akhir: end.toISOString().split('T')[0] }
    },
  },
  {
    label: 'Triwulan Ini',
    get: () => {
      const now     = new Date()
      const quarter = Math.floor(now.getMonth() / 3)
      const start   = new Date(now.getFullYear(), quarter * 3, 1)
      const end     = new Date(now.getFullYear(), quarter * 3 + 3, 0)
      return { mulai: start.toISOString().split('T')[0], akhir: end.toISOString().split('T')[0] }
    },
  },
  {
    label: 'Tahun Ini',
    get: () => {
      const now = new Date()
      return {
        mulai: `${now.getFullYear()}-01-01`,
        akhir: `${now.getFullYear()}-12-31`,
      }
    },
  },
]

function WilayahPreview({ wilayah }) {
  if (!wilayah) return null
  const pct = wilayah.persen_stunting || 0
  const risikoColor = pct > 30 ? 'text-red-600' : pct > 15 ? 'text-yellow-600' : 'text-green-600'
  const risikoBg    = pct > 30 ? 'bg-red-50 border-red-200' : pct > 15 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'

  return (
    <div className={`border rounded-2xl p-4 ${risikoBg}`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-bold text-[#1a3a2a]">{wilayah.kelurahan}</p>
          <p className="text-xs text-[#6a7a6a]">{wilayah.kecamatan} · {wilayah.kabupaten}</p>
        </div>
        <span className={`text-lg font-bold ${risikoColor}`}>{pct}%</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: 'Total', val: wilayah.total_balita || 0 },
          { label: 'Stunting', val: (wilayah.jumlah_stunting || 0) + (wilayah.jumlah_gizi_buruk || 0) },
          { label: 'Berisiko', val: wilayah.jumlah_berisiko || 0 },
        ].map(({ label, val }) => (
          <div key={label} className="bg-white/70 rounded-xl p-2">
            <p className="text-base font-bold text-[#1a3a2a]">{val}</p>
            <p className="text-[10px] text-[#9a9a8a]">{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ExportLaporan() {
  const { exportPDF, loading, error } = useExportLaporan()
  const { data: wilayahList, fetch: fetchWilayah }       = useWilayah()
  const { data: statWilayah, fetch: fetchStat }          = useStatistikWilayah()

  const [wilayahId, setWilayahId]     = useState('')
  const [periodeMulai, setPeriodeMulai] = useState('')
  const [periodeAkhir, setPeriodeAkhir] = useState('')
  const [periodePreset, setPeriodePreset] = useState(null)
  const [successMsg, setSuccessMsg]   = useState('')
  const [formError, setFormError]     = useState('')

  useEffect(() => {
    fetchWilayah()
    fetchStat()
  }, [])

  // Auto-set periode dari preset
  const handlePreset = (idx) => {
    const { mulai, akhir } = PERIODE_PRESETS[idx].get()
    setPeriodeMulai(mulai)
    setPeriodeAkhir(akhir)
    setPeriodePreset(idx)
  }

  const selectedWilayahStat = statWilayah.find(w => w.wilayah_id === wilayahId)

  const handleExport = async () => {
    setFormError('')
    setSuccessMsg('')
    if (!wilayahId)     { setFormError('Pilih wilayah terlebih dahulu'); return }
    if (!periodeMulai)  { setFormError('Tentukan periode mulai'); return }
    if (!periodeAkhir)  { setFormError('Tentukan periode akhir'); return }
    if (periodeMulai > periodeAkhir) { setFormError('Periode mulai harus sebelum periode akhir'); return }

    const res = await exportPDF({ wilayah_id: wilayahId, periode_mulai: periodeMulai, periode_akhir: periodeAkhir })
    if (res.success) {
      setSuccessMsg('Laporan berhasil dibuat! Jendela cetak akan terbuka secara otomatis.')
    } else {
      setFormError(res.error || 'Gagal generate laporan')
    }
  }

  return (
    <Layout>
      {/* Header */}
      <div className="mb-5">
        <button onClick={() => window.history.back()} className="text-sm text-[#534AB7] font-semibold mb-3 flex items-center gap-1">← Kembali</button>
        <h1 className="text-2xl font-bold text-[#1a3a2a]">Export Laporan PDF 📄</h1>
        <p className="text-sm text-[#7a8a7a] mt-1">Generate laporan resmi format Posyandu Kemenkes</p>
      </div>

      {/* Info Box */}
      <div className="bg-[#E0F2FE] border border-[#b0d9f5] rounded-2xl p-4 mb-5">
        <p className="text-sm font-semibold text-[#0369a1] mb-1">📋 Isi Laporan PDF</p>
        <ul className="text-xs text-[#0369a1]/80 space-y-1 list-disc list-inside">
          <li>Rekap statistik gizi wilayah</li>
          <li>Tren stunting bulanan (grafik)</li>
          <li>Tabel data balita individual + status gizi</li>
          <li>Rekomendasi intervensi otomatis</li>
          <li>Format siap tanda tangan kader</li>
        </ul>
      </div>

      {/* Form */}
      <div className="space-y-5">

        {/* Pilih Wilayah */}
        <div>
          <label className="block text-xs font-semibold text-[#4a4a3a] mb-1.5">1. Pilih Wilayah / Kelurahan</label>
          <select
            value={wilayahId}
            onChange={e => { setWilayahId(e.target.value); setSuccessMsg('') }}
            className="w-full px-4 py-3 rounded-xl border border-[#e8e4db] bg-white text-sm focus:outline-none focus:border-[#534AB7]"
          >
            <option value="">Pilih Kelurahan...</option>
            {wilayahList.map(w => (
              <option key={w.id} value={w.id}>{w.kelurahan} — {w.kecamatan}</option>
            ))}
          </select>

          {/* Preview statistik wilayah terpilih */}
          {wilayahId && selectedWilayahStat && (
            <div className="mt-3">
              <WilayahPreview wilayah={selectedWilayahStat} />
            </div>
          )}
        </div>

        {/* Pilih Periode */}
        <div>
          <label className="block text-xs font-semibold text-[#4a4a3a] mb-2">2. Pilih Periode Laporan</label>

          {/* Preset Buttons */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {PERIODE_PRESETS.map((p, i) => (
              <button
                key={i}
                onClick={() => handlePreset(i)}
                className={`py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                  periodePreset === i
                    ? 'bg-[#534AB7] text-white border-[#534AB7]'
                    : 'bg-white text-[#4a4a3a] border-[#e8e4db] hover:border-[#534AB7]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Manual Date Range */}
          <div className="bg-[#f4f4f0] rounded-2xl p-3">
            <p className="text-xs text-[#6a7a6a] font-medium mb-2">Atau pilih tanggal manual:</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-[#9a9a8a] mb-1">Dari</label>
                <input
                  type="date" value={periodeMulai}
                  onChange={e => { setPeriodeMulai(e.target.value); setPeriodePreset(null); setSuccessMsg('') }}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#e8e4db] bg-white text-sm focus:outline-none focus:border-[#534AB7]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#9a9a8a] mb-1">Sampai</label>
                <input
                  type="date" value={periodeAkhir}
                  onChange={e => { setPeriodeAkhir(e.target.value); setPeriodePreset(null); setSuccessMsg('') }}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#e8e4db] bg-white text-sm focus:outline-none focus:border-[#534AB7]"
                />
              </div>
            </div>
          </div>

          {/* Periode summary */}
          {periodeMulai && periodeAkhir && (
            <div className="mt-2 bg-[#EDE9FE] border border-[#c4b8f9] rounded-xl px-3 py-2">
              <p className="text-xs font-semibold text-[#534AB7]">
                📅 Periode:{' '}
                {new Date(periodeMulai).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                {' '}–{' '}
                {new Date(periodeAkhir).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
          )}
        </div>

        {/* Error / Success */}
        {formError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-sm text-red-600">⚠️ {formError}</p>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-sm text-red-600">❌ {error}</p>
          </div>
        )}
        {successMsg && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
            <p className="text-sm font-semibold text-green-700">✅ {successMsg}</p>
            <p className="text-xs text-green-600 mt-1">
              Di jendela cetak: pilih "Save as PDF" sebagai printer untuk menyimpan file.
            </p>
          </div>
        )}

        {/* Tombol Export */}
        <button
          onClick={handleExport}
          disabled={loading}
          className="w-full py-4 rounded-2xl bg-[#534AB7] text-white font-bold text-base shadow-lg shadow-[#534AB7]/25 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Membuat Laporan...
            </>
          ) : (
            <>📄 Generate & Buka PDF</>
          )}
        </button>

        <p className="text-xs text-[#9a9a8a] text-center">
          Laporan akan dibuka di tab baru. Gunakan Ctrl+P / Cmd+P atau tombol print untuk menyimpan sebagai PDF.
        </p>
      </div>
    </Layout>
  )
}