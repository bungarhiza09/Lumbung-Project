// src/pages/DetailBalita.jsx
import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../../../components/Layout'
import { useBalitaDetail, useInputPengukuran } from '../../../hooks/useBalita'

const STATUS_CONFIG = {
  normal:         { label: 'Normal',         bg: 'bg-green-100',  text: 'text-green-700',  border: 'border-green-200',  emoji: '✅' },
  berisiko:       { label: 'Berisiko',       bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200', emoji: '⚠️' },
  gizi_kurang:    { label: 'Gizi Kurang',    bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200', emoji: '⚠️' },
  stunting:       { label: 'Stunting',       bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-200',    emoji: '🚨' },
  stunting_berat: { label: 'Stunting Berat', bg: 'bg-red-200',    text: 'text-red-800',    border: 'border-red-300',    emoji: '🚨' },
  wasting:        { label: 'Wasting',        bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-200',    emoji: '🚨' },
  wasting_berat:  { label: 'Wasting Berat',  bg: 'bg-red-200',    text: 'text-red-800',    border: 'border-red-300',    emoji: '🔴' },
  gizi_buruk:     { label: 'Gizi Buruk',     bg: 'bg-red-200',    text: 'text-red-800',    border: 'border-red-300',    emoji: '🔴' },
  gizi_lebih:     { label: 'Gizi Lebih',     bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', emoji: '📈' },
  overweight:     { label: 'Overweight',     bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', emoji: '📈' },
  obesitas:       { label: 'Obesitas',       bg: 'bg-purple-200', text: 'text-purple-800', border: 'border-purple-300', emoji: '📈' },
  belum_diukur:   { label: 'Belum Diukur',   bg: 'bg-gray-100',   text: 'text-gray-500',   border: 'border-gray-200',   emoji: '⏳' },
}

function formatUsia(bulan) {
  if (!bulan && bulan !== 0) return '—'
  if (bulan < 12) return `${bulan} bulan`
  const th = Math.floor(bulan / 12)
  const sisa = bulan % 12
  return sisa > 0 ? `${th} tahun ${sisa} bulan` : `${th} tahun`
}

function ZScoreBar({ label, value }) {
  if (value === null || value === undefined) return null
  const pct = Math.min(Math.max(((value + 4) / 8) * 100, 0), 100)
  const color = value < -2 ? '#dc2626' : value < -1 ? '#d97706' : value > 2 ? '#7c3aed' : '#16a34a'
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-[#4a4a3a] font-medium">{label}</span>
        <span className="font-bold" style={{ color }}>{value > 0 ? `+${value}` : value} SD</span>
      </div>
      <div className="h-2 bg-[#f4f4f0] rounded-full overflow-hidden relative">
        <div className="absolute left-1/2 top-0 h-full w-px bg-[#d1d5db]" />
        <div className="absolute top-0 h-full w-px bg-[#fca5a5]" style={{ left: '25%' }} />
        <div className="absolute top-0 h-full w-px bg-[#fca5a5]" style={{ left: '75%' }} />
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <div className="flex justify-between text-[10px] text-[#9a9a8a] mt-0.5">
        <span>-4</span><span>-2</span><span>0</span><span>+2</span><span>+4</span>
      </div>
    </div>
  )
}

function TambahUkurModal({ balitaId, onClose, onSaved }) {
  const { simpan, loading, result } = useInputPengukuran()
  const [form, setForm] = useState({
    berat_badan_kg: '', tinggi_badan_cm: '',
    lingkar_kepala_cm: '', lingkar_lengan_cm: '',
    tanggal_ukur: new Date().toISOString().split('T')[0],
    catatan: '',
  })
  const [err, setErr] = useState('')

  const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSimpan = async () => {
    if (!form.berat_badan_kg || !form.tinggi_badan_cm) {
      setErr('BB dan TB wajib diisi'); return
    }
    setErr('')
    await simpan({
      balita_id: balitaId,
      tanggal_ukur: form.tanggal_ukur,
      berat_badan_kg: parseFloat(form.berat_badan_kg),
      tinggi_badan_cm: parseFloat(form.tinggi_badan_cm),
      lingkar_kepala_cm: form.lingkar_kepala_cm ? parseFloat(form.lingkar_kepala_cm) : undefined,
      lingkar_lengan_cm: form.lingkar_lengan_cm ? parseFloat(form.lingkar_lengan_cm) : undefined,
      catatan: form.catatan,
    })
  }

  const handleTutup = () => {
    onSaved()
    onClose()
  }

  if (result) {
    const cfg = STATUS_CONFIG[result.status_gizi] || STATUS_CONFIG.belum_diukur
    return (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center p-0">
        <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
          <div className="text-center py-4">
            <div className="text-5xl mb-3">{cfg.emoji}</div>
            <p className="font-bold text-xl text-[#1a3a2a]">Pengukuran Tersimpan!</p>
            <p className="text-sm text-[#6a7a6a] mt-1">
              Status: <span className={`font-bold ${cfg.text}`}>{cfg.label}</span>
            </p>
            <p className="text-sm text-[#6a7a6a] mt-0.5">Usia {result.usia_bulan} bulan saat diukur</p>

            <div className={`mt-4 p-4 rounded-2xl border ${cfg.bg} ${cfg.border}`}>
              <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                {[
                  { label: 'BB/Umur', val: result.zscore?.bb_u },
                  { label: 'TB/Umur', val: result.zscore?.tb_u },
                  { label: 'BB/TB',   val: result.zscore?.bb_tb },
                ].map(({ label, val }) => (
                  <div key={label} className="bg-white/70 rounded-xl p-2 text-center">
                    <div className="text-[#6a7a6a]">{label}</div>
                    <div className={`font-bold text-sm mt-0.5 ${
                      val < -2 ? 'text-red-600' : val < -1 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {val !== null && val !== undefined ? (val > 0 ? `+${val}` : val) : '—'}
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <ZScoreBar label="BB/Umur (Weight-for-Age)"  value={result.zscore?.bb_u} />
                <ZScoreBar label="TB/Umur (Height-for-Age)"  value={result.zscore?.tb_u} />
                <ZScoreBar label="BB/TB (Weight-for-Height)" value={result.zscore?.bb_tb} />
              </div>
            </div>

            <button onClick={handleTutup} className="mt-5 w-full py-3 rounded-2xl bg-[#534AB7] text-white font-bold text-sm">
              Tutup
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center p-0">
      <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-[#1a3a2a]">Input Pengukuran Baru</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#f4f4f0] flex items-center justify-center text-[#4a4a3a]">✕</button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#4a4a3a] mb-1.5">Tanggal Ukur</label>
            <input type="date" value={form.tanggal_ukur} onChange={set('tanggal_ukur')}
              className="w-full px-4 py-3 rounded-xl border border-[#e8e4db] bg-white text-sm focus:outline-none focus:border-[#534AB7]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Berat Badan (kg) *',  field: 'berat_badan_kg',   placeholder: '7.5',  step: '0.1', min: '0.5', max: '40',  unit: 'kg' },
              { label: 'Tinggi Badan (cm) *', field: 'tinggi_badan_cm',  placeholder: '75.0', step: '0.1', min: '30',  max: '130', unit: 'cm' },
              { label: 'Lingkar Kepala (cm)', field: 'lingkar_kepala_cm', placeholder: '42.0', step: '0.1', min: '20',  max: '60',  unit: 'cm' },
              { label: 'Lingkar Lengan (cm)', field: 'lingkar_lengan_cm', placeholder: '13.0', step: '0.1', min: '5',   max: '30',  unit: 'cm' },
            ].map(({ label, field, placeholder, step, min, max, unit }) => (
              <div key={field}>
                <label className="block text-xs font-semibold text-[#4a4a3a] mb-1.5">{label}</label>
                <div className="relative">
                  <input type="number" step={step} min={min} max={max}
                    value={form[field]} onChange={set(field)} placeholder={placeholder}
                    className="w-full px-4 py-3 pr-10 rounded-xl border border-[#e8e4db] bg-white text-sm focus:outline-none focus:border-[#534AB7]" />
                  <span className="absolute right-3 top-3.5 text-xs text-[#9a9a8a]">{unit}</span>
                </div>
              </div>
            ))}
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#4a4a3a] mb-1.5">Catatan</label>
            <textarea value={form.catatan} onChange={set('catatan')} rows={2} placeholder="Kondisi saat diukur..."
              className="w-full px-4 py-3 rounded-xl border border-[#e8e4db] bg-white text-sm focus:outline-none focus:border-[#534AB7] resize-none" />
          </div>
          {err && <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-xl p-3">{err}</p>}
          <button onClick={handleSimpan} disabled={loading}
            className="w-full py-4 rounded-2xl bg-[#2D6A4F] text-white font-bold text-sm disabled:opacity-50">
            {loading ? '⏳ Menghitung Z-Score...' : '💾 Simpan & Hitung Z-Score'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DetailBalita() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: balita, riwayat, loading, error, fetch } = useBalitaDetail(id)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => { fetch() }, [fetch])

  const handleSaved = useCallback(() => { fetch() }, [fetch])
  const handleClose = useCallback(() => { setShowModal(false) }, [])

  if (loading) return (
    <Layout>
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-[#f4f4f0] rounded-xl w-48" />
        <div className="h-32 bg-[#f4f4f0] rounded-2xl" />
        <div className="h-24 bg-[#f4f4f0] rounded-2xl" />
      </div>
    </Layout>
  )

  if (error || !balita) return (
    <Layout>
      <div className="text-center py-10">
        <p className="text-sm text-red-500">{error || 'Data tidak ditemukan'}</p>
        <button onClick={() => navigate('/balita')} className="mt-4 text-sm text-[#534AB7] font-semibold">← Kembali</button>
      </div>
    </Layout>
  )

  const statusCfg = STATUS_CONFIG[balita.status_gizi] || STATUS_CONFIG.belum_diukur

  return (
    <Layout>
      <button onClick={() => navigate('/balita')} className="text-sm text-[#534AB7] font-semibold mb-4 flex items-center gap-1">
        ← Daftar Balita
      </button>

      {/* Hero Card */}
      <div className={`rounded-3xl border ${statusCfg.border} ${statusCfg.bg} p-5 mb-4`}>
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/80 flex items-center justify-center text-3xl flex-shrink-0">
            {balita.jenis_kelamin === 'L' ? '👦' : '👧'}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-[#1a3a2a]">{balita.nama}</h1>
            <p className="text-sm text-[#4a4a3a] mt-0.5">
              {balita.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'} · {formatUsia(balita.usia_bulan_sekarang)}
            </p>
            <div className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-sm font-bold ${statusCfg.bg} ${statusCfg.text} border ${statusCfg.border}`}>
              <span>{statusCfg.emoji}</span>
              <span>{statusCfg.label}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="bg-white rounded-2xl border border-[#e8e4db] p-4 mb-4 grid grid-cols-2 gap-3">
        {[
          { label: 'Tanggal Lahir', val: balita.tanggal_lahir ? new Date(balita.tanggal_lahir).toLocaleDateString('id-ID', { day:'2-digit', month:'long', year:'numeric' }) : '—' },
          { label: 'NIK',       val: balita.nik_orang_tua || '—' },
          { label: 'Orang Tua', val: balita.nama_orang_tua || '—' },
          { label: 'No. HP',    val: balita.no_hp_orang_tua || '—' },
          { label: 'Kelurahan', val: balita.kelurahan || '—' },
          { label: 'RT/RW',     val: balita.rt ? `RT ${balita.rt} / RW ${balita.rw}` : '—' },
        ].map(({ label, val }) => (
          <div key={label}>
            <p className="text-xs text-[#9a9a8a] font-medium">{label}</p>
            <p className="text-sm font-semibold text-[#1a3a2a] mt-0.5">{val}</p>
          </div>
        ))}
      </div>

      {/* Pengukuran Terakhir */}
      {balita.berat_badan_kg && (
        <div className="bg-white rounded-2xl border border-[#e8e4db] p-4 mb-4">
          <h3 className="text-sm font-bold text-[#1a3a2a] mb-3">📏 Pengukuran Terakhir</h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: 'Berat Badan',   val: `${balita.berat_badan_kg} kg`, emoji: '⚖️' },
              { label: 'Tinggi Badan',  val: `${balita.tinggi_badan_cm} cm`, emoji: '📏' },
              { label: 'Usia Saat Ukur',val: formatUsia(balita.usia_bulan), emoji: '🎂' },
              { label: 'Tanggal Ukur',  val: balita.tanggal_ukur ? new Date(balita.tanggal_ukur).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' }) : '—', emoji: '📅' },
            ].map(({ label, val, emoji }) => (
              <div key={label} className="bg-[#f4f4f0] rounded-xl p-3">
                <p className="text-xs text-[#9a9a8a]">{emoji} {label}</p>
                <p className="text-base font-bold text-[#1a3a2a] mt-0.5">{val}</p>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <ZScoreBar label="BB/Umur (Weight-for-Age)"  value={balita.zscore_bb_u} />
            <ZScoreBar label="TB/Umur (Height-for-Age)"  value={balita.zscore_tb_u} />
            <ZScoreBar label="BB/TB (Weight-for-Height)" value={balita.zscore_bb_tb} />
          </div>
        </div>
      )}

      {/* Riwayat Pengukuran */}
      <div className="bg-white rounded-2xl border border-[#e8e4db] p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-[#1a3a2a]">📈 Riwayat Pengukuran</h3>
          <span className="text-xs text-[#9a9a8a]">{riwayat.length} kunjungan</span>
        </div>
        {riwayat.length === 0 ? (
          <p className="text-xs text-[#9a9a8a] text-center py-4">Belum ada riwayat pengukuran</p>
        ) : (
          <div className="space-y-2">
            {riwayat.map((r, i) => {
              const cfg = STATUS_CONFIG[r.status_gizi] || STATUS_CONFIG.belum_diukur
              return (
                <div key={r.id} className="flex items-center gap-3 py-2 border-b border-[#f4f4f0] last:border-0">
                  <div className="w-8 h-8 rounded-full bg-[#EDE9FE] flex items-center justify-center text-xs font-bold text-[#534AB7] flex-shrink-0">
                    {riwayat.length - i}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-[#1a3a2a]">
                      {new Date(r.tanggal_ukur).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' })}
                      <span className="text-[#9a9a8a] font-normal ml-2">· {r.usia_bulan} bln</span>
                    </p>
                    <p className="text-xs text-[#6a7a6a] mt-0.5">
                      {r.berat_badan_kg} kg · {r.tinggi_badan_cm} cm
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                    {cfg.emoji} {cfg.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <button
        onClick={() => setShowModal(true)}
        className="w-full py-4 rounded-2xl bg-[#534AB7] text-white font-bold text-base shadow-lg shadow-[#534AB7]/25 mb-6"
      >
        + Input Pengukuran Baru
      </button>

      {showModal && (
        <TambahUkurModal balitaId={id} onClose={handleClose} onSaved={handleSaved} />
      )}
    </Layout>
  )
}