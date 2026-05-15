// src/pages/InputBalita.jsx — UPDATED: pakai LocationPicker untuk wilayah Indonesia
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx'
import Layout from '../../components/Layout'
import LocationPicker from '../../components/LocationPicker'
import { useTambahBalita, useInputPengukuran, useImportBalita } from '../../hooks/useBalita'
import { supabase } from '../../lib/supabase'

// ─── Konstanta ────────────────────────────────────────────────
const STATUS_CONFIG = {
  normal:        { label: 'Normal',      bg: 'bg-green-100',  text: 'text-green-700',  emoji: '✅' },
  gizi_kurang:   { label: 'Gizi Kurang', bg: 'bg-yellow-100', text: 'text-yellow-700', emoji: '⚠️' },
  stunting:      { label: 'Stunting',    bg: 'bg-red-100',    text: 'text-red-700',    emoji: '🚨' },
  stunting_berat:{ label: 'Stunting Berat', bg: 'bg-red-200', text: 'text-red-800',    emoji: '🚨' },
  wasting:       { label: 'Wasting',     bg: 'bg-red-100',    text: 'text-red-700',    emoji: '🚨' },
  wasting_berat: { label: 'Wasting Berat', bg: 'bg-red-200',  text: 'text-red-800',    emoji: '🔴' },
  gizi_buruk:    { label: 'Gizi Buruk',  bg: 'bg-red-200',    text: 'text-red-800',    emoji: '🔴' },
  gizi_lebih:    { label: 'Gizi Lebih',  bg: 'bg-purple-100', text: 'text-purple-700', emoji: '📈' },
  overweight:    { label: 'Overweight',  bg: 'bg-purple-100', text: 'text-purple-700', emoji: '📈' },
  obesitas:      { label: 'Obesitas',    bg: 'bg-purple-200', text: 'text-purple-800', emoji: '📈' },
}

const TEMPLATE_HEADERS = [
  'nama',
  'nik',
  'tanggal_lahir',
  'jenis_kelamin',
  'nama_orang_tua',
  'no_hp_orang_tua',
  'provinsi',
  'kabupaten',
  'kecamatan',
  'kelurahan',
  'alamat_jalan',
  'rt',
  'rw',
  'berat_badan_kg',
  'tinggi_badan_cm',
  'tanggal_ukur',
]

const TEMPLATE_CONTOH = [
  [
    'Andi Kurniawan',
    '1275012203220001',
    '22/03/2022',
    'L',
    'Budi Kurniawan',
    '08123456789',
    'SUMATERA UTARA',
    'KABUPATEN TOBA',
    'BALIGE',
    'BALIGE I',
    'Jl. Sisingamangaraja No. 10',
    '05',
    '03',
    7.5,
    78.0,
    '10/05/2025',
  ],
  [
    'Siti Rahayu',
    '',
    '20/07/2023',
    'P',
    'Ani Rahayu',
    '08234567890',
    'SUMATERA UTARA',
    'KABUPATEN TOBA',
    'BALIGE',
    'BALIGE II',
    'Jl. Diponegoro No. 5',
    '02',
    '01',
    5.2,
    60.0,
    '10/05/2025',
  ],
]

// ─── Komponen Tab ─────────────────────────────────────────────
function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all ${
        active
          ? 'bg-[#534AB7] text-white shadow-md shadow-[#534AB7]/25'
          : 'bg-white text-[#6a7a6a] border border-[#e8e4db]'
      }`}
    >
      {children}
    </button>
  )
}

// ─── Hasil Z-Score ────────────────────────────────────────────
function HasilZScore({ result }) {
  if (!result) return null
  const s = STATUS_CONFIG[result.status_gizi] || { label: result.status_gizi, bg: 'bg-gray-100', text: 'text-gray-700', emoji: '📊' }
  return (
    <div className={`mt-4 p-4 rounded-2xl border ${s.bg}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{s.emoji}</span>
        <span className={`font-bold text-base ${s.text}`}>Status: {s.label}</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        {[
          { label: 'BB/Umur',  val: result.zscore?.bb_u  },
          { label: 'TB/Umur',  val: result.zscore?.tb_u  },
          { label: 'BB/TB',    val: result.zscore?.bb_tb },
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
      <p className="text-xs mt-2 text-[#4a4a3a]">Usia saat ukur: {result.usia_bulan} bulan</p>
    </div>
  )
}

// ─── Helper field ─────────────────────────────────────────────
function InputField({ label, value, onChange, error, type = 'text', placeholder, suffix }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#4a4a3a] mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={type} value={value} onChange={onChange} placeholder={placeholder}
          className={`w-full px-4 py-3 ${suffix ? 'pr-12' : ''} rounded-xl border bg-white text-sm text-[#1a3a2a] focus:outline-none focus:border-[#534AB7] transition-all ${
            error ? 'border-red-400 bg-red-50' : 'border-[#e8e4db]'
          }`}
        />
        {suffix && <span className="absolute right-3 top-3.5 text-xs text-[#9a9a8a]">{suffix}</span>}
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

// ─── Fungsi: cari atau buat wilayah di Supabase ───────────────
// ✅ SESUDAH — pakai RPC upsert_wilayah (bypass RLS via SECURITY DEFINER)
async function resolveWilayahId({ provinsi, kabupaten, kecamatan, kelurahan }) {
  if (!kelurahan || !kecamatan) return null

  const { data, error } = await supabase.rpc('upsert_wilayah', {
    p_kelurahan: kelurahan.trim(),
    p_kecamatan: kecamatan.trim(),
    p_kabupaten: kabupaten?.trim() || null,
    p_provinsi:  provinsi?.trim()  || null,
  })

  if (error) {
    console.error('resolveWilayahId error:', error)
    return null
  }

  return data  // langsung uuid string
}

// ═══════════════════════════════════════════════════════════════
// TAB 1 — Form Input Manual
// ═══════════════════════════════════════════════════════════════
function FormInputManual() {
  const navigate = useNavigate()
  const { tambah, loading: loadingTambah } = useTambahBalita()
  const { simpan, loading: loadingUkur, result: hasilUkur } = useInputPengukuran()

  const [step, setStep]         = useState(1) // 1=data balita, 2=pengukuran
  const [balitaId, setBalitaId] = useState(null)
  const [saved, setSaved]       = useState(false)

  // Form balita
  const [form, setForm] = useState({
    nama: '', nik: '', tanggal_lahir: '', jenis_kelamin: 'L',
    nama_orang_tua: '', no_hp_orang_tua: '', rt: '', rw: '',
  })
  // Lokasi dari LocationPicker
  const [lokasi, setLokasi] = useState({
    provinsi: '', kabupaten: '', kecamatan: '', kelurahan: '',
    jalan: '', alamat: '',
  })

  // Form pengukuran
  const [ukur, setUkur] = useState({
    berat_badan_kg: '', tinggi_badan_cm: '',
    lingkar_kepala_cm: '', lingkar_lengan_cm: '',
    tanggal_ukur: new Date().toISOString().split('T')[0],
    catatan: '',
  })

  const [errors, setErrors] = useState({})

  const set  = field => e => setForm(f => ({ ...f, [field]: e.target.value }))
  const setU = field => e => setUkur(u => ({ ...u, [field]: e.target.value }))

  const validasiStep1 = () => {
    const e = {}
    if (!form.nama.trim())      e.nama          = 'Nama wajib diisi'
    if (!form.tanggal_lahir)    e.tanggal_lahir = 'Tanggal lahir wajib diisi'
    if (!form.jenis_kelamin)    e.jenis_kelamin = 'Jenis kelamin wajib dipilih'
    if (!lokasi.kelurahan)      e.lokasi        = 'Kelurahan wajib dipilih'
    if (!lokasi.kecamatan)      e.lokasi        = 'Kecamatan wajib dipilih'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSimpanBalita = async () => {
    if (!validasiStep1()) return

    // Resolve wilayah_id dari lokasi yang dipilih
    const wilayah_id = await resolveWilayahId(lokasi)
    if (!wilayah_id) {
      setErrors(e => ({ ...e, lokasi: 'Gagal menyimpan wilayah. Coba lagi.' }))
      return
    }

    const alamatLengkap = [form.rt ? `RT ${form.rt}` : '', form.rw ? `RW ${form.rw}` : '', lokasi.jalan, lokasi.kelurahan, lokasi.kecamatan, lokasi.kabupaten, lokasi.provinsi]
      .filter(Boolean).join(', ')

    const res = await tambah({
      nama:           form.nama.trim(),
      nik:            form.nik.trim() || null,
      tanggal_lahir:  form.tanggal_lahir,
      jenis_kelamin:  form.jenis_kelamin,
      nama_orang_tua: form.nama_orang_tua.trim() || null,
      no_hp_orang_tua:form.no_hp_orang_tua.trim() || null,
      alamat:         alamatLengkap,
      rt:             form.rt.trim() || null,
      rw:             form.rw.trim() || null,
      wilayah_id,
    })

    if (res.success) { setBalitaId(res.data.id); setStep(2) }
    else setErrors({ submit: res.error })
  }

  const handleSimpanUkur = async () => {
    if (!ukur.berat_badan_kg || !ukur.tinggi_badan_cm) {
      setErrors({ ukur: 'Berat badan dan tinggi badan wajib diisi' }); return
    }
    const res = await simpan({
      balita_id:        balitaId,
      tanggal_ukur:     ukur.tanggal_ukur,
      berat_badan_kg:   parseFloat(ukur.berat_badan_kg),
      tinggi_badan_cm:  parseFloat(ukur.tinggi_badan_cm),
      lingkar_kepala_cm:ukur.lingkar_kepala_cm ? parseFloat(ukur.lingkar_kepala_cm) : undefined,
      catatan:          ukur.catatan,
    })
    if (res.success) setSaved(true)
    else setErrors({ ukur: res.error })
  }

  // ── Selesai ──
  if (saved) return (
    <div className="flex flex-col items-center py-10 text-center">
      <div className="text-5xl mb-4">🎉</div>
      <h2 className="text-xl font-bold text-[#1a3a2a]">Data Tersimpan!</h2>
      <HasilZScore result={hasilUkur} />
      <div className="mt-6 flex gap-3 w-full">
        <button onClick={() => navigate('/balita')}
          className="flex-1 py-3 rounded-xl bg-white border border-[#e8e4db] text-[#4a4a3a] font-semibold text-sm">
          Daftar Balita
        </button>
        <button onClick={() => {
          setStep(1); setBalitaId(null); setSaved(false)
          setForm({ nama:'',nik:'',tanggal_lahir:'',jenis_kelamin:'L',nama_orang_tua:'',no_hp_orang_tua:'',rt:'',rw:'' })
          setLokasi({ provinsi:'',kabupaten:'',kecamatan:'',kelurahan:'',jalan:'',alamat:'' })
        }} className="flex-1 py-3 rounded-xl bg-[#534AB7] text-white font-bold text-sm">
          + Tambah Lagi
        </button>
      </div>
    </div>
  )

  return (
    <div>
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {[{ n:1, label:'Data Balita' }, { n:2, label:'Pengukuran' }].map(({ n, label }, i) => (
          <div key={n} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step >= n ? 'bg-[#534AB7] text-white' : 'bg-[#e8e4db] text-[#9a9a8a]'
            }`}>{n}</div>
            <span className={`text-xs ${step >= n ? 'text-[#534AB7] font-semibold' : 'text-[#9a9a8a]'}`}>{label}</span>
            {i === 0 && <div className={`h-px w-6 ${step > n ? 'bg-[#534AB7]' : 'bg-[#e8e4db]'}`} />}
          </div>
        ))}
      </div>

      {/* ── STEP 1: Data Balita ── */}
      {step === 1 && (
        <div className="space-y-4">
          <InputField label="Nama Lengkap Balita *" value={form.nama} onChange={set('nama')} error={errors.nama} placeholder="Contoh: Andi Kurniawan" />
          <InputField label="NIK (opsional)" value={form.nik} onChange={set('nik')} placeholder="16 digit NIK" />

          <div className="grid grid-cols-2 gap-3">
            <InputField label="Tanggal Lahir *" type="date" value={form.tanggal_lahir} onChange={set('tanggal_lahir')} error={errors.tanggal_lahir} />
            <div>
              <label className="block text-xs font-semibold text-[#4a4a3a] mb-1.5">Jenis Kelamin *</label>
              <div className="flex gap-2">
                {[['L','👦 Laki-laki'],['P','👧 Perempuan']].map(([val, lbl]) => (
                  <button key={val} type="button" onClick={() => setForm(f => ({ ...f, jenis_kelamin: val }))}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                      form.jenis_kelamin === val
                        ? 'bg-[#534AB7] text-white border-[#534AB7]'
                        : 'bg-white text-[#4a4a3a] border-[#e8e4db]'
                    }`}>{lbl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <InputField label="Nama Orang Tua" value={form.nama_orang_tua} onChange={set('nama_orang_tua')} placeholder="Nama ayah/ibu" />
          <InputField label="No. HP Orang Tua" value={form.no_hp_orang_tua} onChange={set('no_hp_orang_tua')} placeholder="08..." type="tel" />

          <div className="grid grid-cols-2 gap-3">
            <InputField label="RT" value={form.rt} onChange={set('rt')} placeholder="05" />
            <InputField label="RW" value={form.rw} onChange={set('rw')} placeholder="03" />
          </div>

          {/* LocationPicker */}
          <div>
            <label className="block text-xs font-semibold text-[#4a4a3a] mb-2">
              Wilayah / Alamat *
            </label>
            <div className={`rounded-2xl border p-4 ${errors.lokasi ? 'border-red-300 bg-red-50' : 'border-[#e8e4db] bg-white'}`}>
              <LocationPicker onChange={setLokasi} />
            </div>
            {errors.lokasi && <p className="text-xs text-red-500 mt-1">{errors.lokasi}</p>}
          </div>

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">{errors.submit}</div>
          )}

          <button onClick={handleSimpanBalita} disabled={loadingTambah}
            className="w-full py-4 rounded-2xl bg-[#534AB7] text-white font-bold text-sm mt-2 disabled:opacity-50">
            {loadingTambah ? 'Menyimpan...' : 'Simpan Data Balita →'}
          </button>
        </div>
      )}

      {/* ── STEP 2: Pengukuran ── */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-[#E1F5EE] border border-[#b7e4cc] rounded-2xl p-4">
            <p className="text-xs text-[#2D6A4F] font-semibold">✅ Data balita tersimpan! Sekarang input pengukuran (opsional)</p>
          </div>

          <InputField label="Tanggal Ukur" type="date" value={ukur.tanggal_ukur} onChange={setU('tanggal_ukur')} />

          <div className="grid grid-cols-2 gap-3">
            <InputField label="Berat Badan (kg) *" type="number" value={ukur.berat_badan_kg} onChange={setU('berat_badan_kg')} placeholder="7.5" suffix="kg" />
            <InputField label="Tinggi Badan (cm) *" type="number" value={ukur.tinggi_badan_cm} onChange={setU('tinggi_badan_cm')} placeholder="75.0" suffix="cm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Lingkar Kepala (cm)" type="number" value={ukur.lingkar_kepala_cm} onChange={setU('lingkar_kepala_cm')} placeholder="42.0" suffix="cm" />
            <InputField label="Lingkar Lengan (cm)" type="number" value={ukur.lingkar_lengan_cm} onChange={setU('lingkar_lengan_cm')} placeholder="13.0" suffix="cm" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4a4a3a] mb-1.5">Catatan</label>
            <textarea value={ukur.catatan} onChange={setU('catatan')} rows={2} placeholder="Kondisi balita saat diukur..."
              className="w-full px-4 py-3 rounded-xl border border-[#e8e4db] bg-white text-sm focus:outline-none focus:border-[#534AB7] resize-none" />
          </div>

          {errors.ukur && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">{errors.ukur}</div>
          )}

          <HasilZScore result={hasilUkur} />

          <div className="flex gap-3">
            <button onClick={() => navigate('/balita')}
              className="flex-1 py-3 rounded-xl bg-white border border-[#e8e4db] text-sm font-semibold text-[#4a4a3a]">
              Lewati
            </button>
            <button onClick={handleSimpanUkur} disabled={loadingUkur}
              className="flex-1 py-4 rounded-2xl bg-[#2D6A4F] text-white font-bold text-sm disabled:opacity-50">
              {loadingUkur ? '⏳ Menghitung...' : '💾 Simpan & Hitung Z-Score'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// TAB 2 — Import Excel
// ═══════════════════════════════════════════════════════════════
function FormImportExcel() {
  const fileRef = useRef()
  const { importData, loading, result } = useImportBalita()

  const [preview, setPreview]   = useState([])
  const [fileName, setFileName] = useState('')
  const [step, setStep]         = useState('upload') // upload | preview | result
  const [error, setError]       = useState('')

  // Lokasi default untuk semua baris yang tidak punya kelurahan sendiri
  const [lokasiDefault, setLokasiDefault] = useState({
    provinsi: '', kabupaten: '', kecamatan: '', kelurahan: '', jalan: '', alamat: '',
  })
  const [wilayahId, setWilayahId] = useState(null)
  const [resolving, setResolving] = useState(false)

  // Resolve wilayah_id saat lokasi berubah
  useEffect(() => {
    if (!lokasiDefault.kelurahan || !lokasiDefault.kecamatan) {
      setWilayahId(null)
      return
    }
    setResolving(true)
    resolveWilayahId(lokasiDefault)
      .then(id => setWilayahId(id))
      .finally(() => setResolving(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lokasiDefault.kelurahan, lokasiDefault.kecamatan])

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new()

    // Sheet 1: Data
    const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, ...TEMPLATE_CONTOH])
    ws['!cols'] = TEMPLATE_HEADERS.map(h => ({ wch: Math.max(h.length + 4, 18) }))

    // Styling header (warna hijau)
    const headerRange = XLSX.utils.decode_range(ws['!ref'])
    for (let c = headerRange.s.c; c <= headerRange.e.c; c++) {
      const cell = XLSX.utils.encode_cell({ r: 0, c })
      if (!ws[cell]) continue
      ws[cell].s = {
        fill: { fgColor: { rgb: '2D6A4F' } },
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        alignment: { horizontal: 'center' },
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, 'Data Balita')

    // Sheet 2: Panduan
    const wsPanduan = XLSX.utils.aoa_to_sheet([
      ['PANDUAN PENGISIAN TEMPLATE IMPORT DATA BALITA'],
      [],
      ['Kolom', 'Keterangan', 'Wajib?', 'Contoh'],
      ['nama',            'Nama lengkap balita',                          'YA',   'Andi Kurniawan'],
      ['nik',             'NIK 16 digit (boleh kosong)',                  'TIDAK', '1275012203220001'],
      ['tanggal_lahir',   'Format DD/MM/YYYY atau YYYY-MM-DD',            'YA',   '22/03/2022'],
      ['jenis_kelamin',   'L = Laki-laki, P = Perempuan',                 'YA',   'L'],
      ['nama_orang_tua',  'Nama ayah atau ibu',                           'TIDAK', 'Budi Kurniawan'],
      ['no_hp_orang_tua', 'Nomor HP yang bisa dihubungi',                 'TIDAK', '08123456789'],
      ['provinsi',        'Nama provinsi (sesuai API Wilayah Indonesia)', 'TIDAK', 'SUMATERA UTARA'],
      ['kabupaten',       'Nama kabupaten/kota',                          'TIDAK', 'KABUPATEN TOBA'],
      ['kecamatan',       'Nama kecamatan',                               'TIDAK', 'BALIGE'],
      ['kelurahan',       'Nama kelurahan/desa',                          'TIDAK', 'BALIGE I'],
      ['alamat_jalan',    'Detail jalan/nomor rumah',                     'TIDAK', 'Jl. Sisingamangaraja No. 10'],
      ['rt',              'Nomor RT',                                     'TIDAK', '05'],
      ['rw',              'Nomor RW',                                     'TIDAK', '03'],
      ['berat_badan_kg',  'Berat badan dalam kg (desimal)',                'TIDAK', '7.5'],
      ['tinggi_badan_cm', 'Tinggi badan dalam cm (desimal)',               'TIDAK', '78.0'],
      ['tanggal_ukur',    'Tanggal pengukuran, format DD/MM/YYYY',         'TIDAK', '10/05/2025'],
      [],
      ['CATATAN:'],
      ['- Kolom bertanda YA wajib diisi, lainnya boleh kosong'],
      ['- Maksimal 500 baris per sekali import'],
      ['- Untuk wilayah, bisa kosongkan di Excel dan pilih via dropdown saat upload'],
      ['- Jika kelurahan diisi, sistem akan otomatis mencocokkan ke database wilayah'],
    ])
    wsPanduan['!cols'] = [{ wch: 20 }, { wch: 50 }, { wch: 10 }, { wch: 30 }]
    XLSX.utils.book_append_sheet(wb, wsPanduan, 'Panduan')

    XLSX.writeFile(wb, 'Template_Import_Balita_Posyandu.xlsx')
  }

  const handleFileChange = e => {
    const file = e.target.files[0]
    if (!file) return
    setFileName(file.name)
    setError('')

    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const wb   = XLSX.read(ev.target.result, { type: 'binary', cellDates: false })
        const ws   = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(ws, {
          header: TEMPLATE_HEADERS,
          range: 1,
          defval: '',
        })
        if (rows.length === 0) { setError('File Excel kosong'); return }
        if (rows.length > 500) { setError('Maksimal 500 data per import'); return }
        setPreview(rows)
        setStep('preview')
      } catch {
        setError('File tidak valid. Pastikan format .xlsx sesuai template.')
      }
    }
    reader.readAsBinaryString(file)
  }

  const handleImport = async () => {
    if (!wilayahId) { setError('Pilih wilayah default terlebih dahulu'); return }
    const res = await importData({ rows: preview, wilayah_id: wilayahId })
    if (res.success) setStep('result')
    else setError(res.error)
  }

  const reset = () => {
    setPreview([]); setFileName(''); setStep('upload'); setError('')
    if (fileRef.current) fileRef.current.value = ''
  }

  // ── Upload ──
  if (step === 'upload') return (
    <div className="space-y-5">
      <div className="bg-[#E0F2FE] border border-[#b0d9f5] rounded-2xl p-4">
        <p className="text-sm font-semibold text-[#0369a1] mb-1">📥 Import Data Massal</p>
        <p className="text-xs text-[#0369a1]/80">Upload file Excel. Maksimal 500 balita sekaligus.</p>
      </div>

      {/* Download Template */}
      <button onClick={downloadTemplate}
        className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-white border border-[#e8e4db] hover:border-[#534AB7] transition-all group">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📄</span>
          <div className="text-left">
            <p className="text-sm font-semibold text-[#1a3a2a]">Download Template Excel</p>
            <p className="text-xs text-[#9a9a8a]">Template_Import_Balita_Posyandu.xlsx (+ sheet Panduan)</p>
          </div>
        </div>
        <span className="text-[#534AB7] text-sm font-semibold group-hover:underline">↓</span>
      </button>

      {/* Lokasi Default via LocationPicker */}
      <div>
        <label className="block text-xs font-semibold text-[#4a4a3a] mb-2">
          Wilayah Default (untuk baris yang tidak punya kolom kelurahan) *
        </label>
        <div className="rounded-2xl border border-[#e8e4db] bg-white p-4">
          <LocationPicker onChange={setLokasiDefault} />
        </div>
        {resolving && <p className="text-xs text-[#534AB7] mt-1">🔄 Menyimpan wilayah...</p>}
        {wilayahId && !resolving && (
          <p className="text-xs text-green-600 mt-1 font-semibold">✅ Wilayah siap: {lokasiDefault.kelurahan}, {lokasiDefault.kecamatan}</p>
        )}
      </div>

      {/* Upload Area */}
      <div onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-[#c4b8f9] rounded-2xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:bg-[#EDE9FE]/30 transition-all">
        <span className="text-4xl">📂</span>
        <div className="text-center">
          <p className="text-sm font-semibold text-[#534AB7]">Klik untuk pilih file Excel</p>
          <p className="text-xs text-[#9a9a8a] mt-1">Format: .xlsx atau .xls · Maks 500 baris</p>
        </div>
        <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="hidden" />
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">⚠️ {error}</div>}

      {/* Kolom template */}
      <div className="bg-white border border-[#e8e4db] rounded-2xl p-4">
        <p className="text-xs font-semibold text-[#4a4a3a] mb-2">📋 Kolom template:</p>
        <div className="flex flex-wrap gap-1.5">
          {TEMPLATE_HEADERS.map(h => (
            <span key={h} className={`px-2 py-0.5 rounded-full text-xs font-mono ${
              ['nama','tanggal_lahir','jenis_kelamin'].includes(h)
                ? 'bg-red-100 text-red-700'
                : 'bg-[#f4f4f0] text-[#6a7a6a]'
            }`}>{h}</span>
          ))}
        </div>
        <p className="text-xs text-[#9a9a8a] mt-2">Merah = wajib. Lainnya opsional.</p>
      </div>
    </div>
  )

  // ── Preview ──
  if (step === 'preview') return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-[#1a3a2a]">Preview Data</p>
          <p className="text-xs text-[#9a9a8a]">{fileName} · {preview.length} baris</p>
        </div>
        <button onClick={reset} className="text-xs text-[#534AB7] font-semibold">Ganti file</button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[#e8e4db]">
        <table className="w-full text-xs min-w-[700px]">
          <thead>
            <tr className="bg-[#f4f4f0]">
              {['No','Nama','Tgl Lahir','JK','Kelurahan','Kecamatan','BB','TB','Status'].map(h => (
                <th key={h} className="px-3 py-2.5 text-left text-[#4a4a3a] font-semibold whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.slice(0, 10).map((row, i) => {
              const jk = String(row.jenis_kelamin || '').trim().toUpperCase()
              const jkOk = ['L','P','LAKI-LAKI','PEREMPUAN'].includes(jk)
              const ok = row.nama && row.tanggal_lahir && jkOk
              return (
                <tr key={i} className="border-t border-[#f4f4f0]">
                  <td className="px-3 py-2 text-[#9a9a8a]">{i+1}</td>
                  <td className="px-3 py-2 font-medium text-[#1a3a2a]">{row.nama || '—'}</td>
                  <td className="px-3 py-2 text-[#4a4a3a] whitespace-nowrap">{row.tanggal_lahir || '—'}</td>
                  <td className="px-3 py-2">
                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${jkOk ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-600'}`}>
                      {row.jenis_kelamin || '?'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-[#4a4a3a]">{row.kelurahan || <span className="text-[#9a9a8a] italic">default</span>}</td>
                  <td className="px-3 py-2 text-[#4a4a3a]">{row.kecamatan || <span className="text-[#9a9a8a] italic">default</span>}</td>
                  <td className="px-3 py-2 text-[#4a4a3a]">{row.berat_badan_kg || '—'}</td>
                  <td className="px-3 py-2 text-[#4a4a3a]">{row.tinggi_badan_cm || '—'}</td>
                  <td className="px-3 py-2">
                    {ok
                      ? <span className="text-green-600 font-semibold">✓ OK</span>
                      : <span className="text-red-500 font-semibold">⚠ Cek</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {preview.length > 10 && (
          <div className="px-3 py-2 text-xs text-[#9a9a8a] border-t border-[#f4f4f0]">
            + {preview.length - 10} baris lainnya
          </div>
        )}
      </div>

      {/* Wilayah default saat preview */}
      {wilayahId ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3">
          <p className="text-xs font-semibold text-green-700">
            📍 Wilayah default: {lokasiDefault.kelurahan}, {lokasiDefault.kecamatan}, {lokasiDefault.kabupaten}
          </p>
          <p className="text-xs text-green-600 mt-0.5">
            Baris tanpa kolom kelurahan akan menggunakan wilayah ini.
          </p>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
          <p className="text-xs text-yellow-700">⚠️ Kembali ke tab Upload untuk pilih wilayah default.</p>
        </div>
      )}

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">⚠️ {error}</div>}

      <div className="flex gap-3">
        <button onClick={reset} className="flex-1 py-3 rounded-xl bg-white border border-[#e8e4db] text-sm font-semibold text-[#4a4a3a]">Batal</button>
        <button onClick={handleImport} disabled={loading || !wilayahId}
          className="flex-1 py-4 rounded-2xl bg-[#534AB7] text-white font-bold text-sm disabled:opacity-50">
          {loading ? `Mengimport ${preview.length} data...` : `Import ${preview.length} Balita →`}
        </button>
      </div>
    </div>
  )

  // ── Result ──
  if (step === 'result' && result) return (
    <div className="space-y-4">
      <div className="text-center py-4">
        <div className="text-5xl mb-3">{result.gagal === 0 ? '🎉' : result.berhasil > 0 ? '⚠️' : '❌'}</div>
        <h2 className="text-xl font-bold text-[#1a3a2a]">Import Selesai</h2>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#f4f4f0] rounded-2xl p-3 text-center">
          <div className="text-2xl font-bold text-[#1a3a2a]">{result.total}</div>
          <div className="text-xs text-[#9a9a8a] mt-1">Total</div>
        </div>
        <div className="bg-[#E1F5EE] rounded-2xl p-3 text-center border border-[#b7e4cc]">
          <div className="text-2xl font-bold text-green-600">{result.berhasil}</div>
          <div className="text-xs text-green-700 mt-1">Berhasil</div>
        </div>
        <div className="bg-red-50 rounded-2xl p-3 text-center border border-red-200">
          <div className="text-2xl font-bold text-red-600">{result.gagal}</div>
          <div className="text-xs text-red-500 mt-1">Gagal</div>
        </div>
      </div>

      {result.errors?.length > 0 && (
        <div className="bg-white border border-[#e8e4db] rounded-2xl p-4">
          <p className="text-sm font-semibold text-[#4a4a3a] mb-3">Detail Error:</p>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {result.errors.map((e, i) => (
              <div key={i} className="bg-red-50 rounded-xl p-2.5">
                <p className="text-xs font-semibold text-red-700">Baris {e.baris}: {e.nama}</p>
                <p className="text-xs text-red-500 mt-0.5">{e.pesan}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={reset} className="flex-1 py-3 rounded-xl bg-white border border-[#e8e4db] text-sm font-semibold text-[#4a4a3a]">Import Lagi</button>
        <a href="/balita" className="flex-1 py-3 rounded-2xl bg-[#534AB7] text-white font-bold text-sm text-center">Lihat Daftar →</a>
      </div>
    </div>
  )

  return null
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════
export default function InputBalita() {
  const [activeTab, setActiveTab] = useState('manual')

  return (
    <Layout>
      <div className="mb-5">
        <button onClick={() => window.history.back()} className="text-sm text-[#534AB7] font-semibold mb-3 flex items-center gap-1">
          ← Kembali
        </button>
        <h1 className="text-2xl font-bold text-[#1a3a2a]">Input Data Balita</h1>
        <p className="text-sm text-[#7a8a7a] mt-1">Tambah satu atau banyak balita sekaligus</p>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 mb-6 p-1 bg-[#f4f4f0] rounded-2xl">
        <TabButton active={activeTab === 'manual'} onClick={() => setActiveTab('manual')}>
          👶 Input Manual
        </TabButton>
        <TabButton active={activeTab === 'import'} onClick={() => setActiveTab('import')}>
          📥 Import Excel
        </TabButton>
      </div>

      {activeTab === 'manual' ? <FormInputManual /> : <FormImportExcel />}
    </Layout>
  )
}
