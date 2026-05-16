import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/Layout'
import LocationPicker from '../../components/LocationPicker'

const STEPS = [
  { num: 1, label: 'Info Warung' },
  { num: 2, label: 'Foto & Lokasi' },
  { num: 3, label: 'Jadwal Donasi' },
]

const JENIS_MAKANAN = [
  'Nasi & Lauk', 'Mie & Bakso', 'Sarapan', 'Seafood',
  'Vegetarian', 'Kantin/Catering', 'Kafe', 'Lainnya'
]

export default function OnboardingWarung({ onSelesai }) {
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [foto, setFoto] = useState(null)
  const [fotoFile, setFotoFile] = useState(null)
  const [lokasi, setLokasi] = useState({})

  const [form, setForm] = useState({
    nama_warung: '',
    deskripsi: '',
    jenis_makanan: '',
    jam_buka: '08:00',
    jam_tutup: '21:00',
  })

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSelesai() {
    setLoading(true)

    let foto_url = null
    if (fotoFile) {
      const ext = fotoFile.name.split('.').pop()
      const fileName = `warung/${user.id}.${ext}`
      const { data: uploadData } = await supabase.storage
        .from('foto-donasi').upload(fileName, fotoFile, { upsert: true })
      if (uploadData) {
        const { data: urlData } = supabase.storage
          .from('foto-donasi').getPublicUrl(fileName)
        foto_url = urlData.publicUrl
      }
    }

    await supabase.from('warung_profiles').upsert({
      user_id: user.id,
      nama_warung: form.nama_warung,
      deskripsi: form.deskripsi,
      jenis_makanan: form.jenis_makanan,
      jam_buka: form.jam_buka,
      jam_tutup: form.jam_tutup,
      foto_url,
      onboarding_done: true,
    }, { onConflict: 'user_id' })

    // Update profil utama dengan lokasi
    if (lokasi.kabupaten) {
      await supabase.from('profiles').update({
        kabupaten: lokasi.kabupaten,
        provinsi: lokasi.provinsi,
      }).eq('id', user.id)
    }

    setLoading(false)
    onSelesai()
  }

  const inputClass = "w-full px-4 py-3 rounded-xl border border-[#e8e4db] bg-[#faf9f7] text-sm focus:outline-none focus:ring-2 focus:ring-[#F4A261]/30 focus:border-[#F4A261] transition-all"

  return (
    <Layout>
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🍜</div>
          <h1 className="text-xl font-bold text-[#1a3a2a]">Setup Profil Warung</h1>
          <p className="text-xs text-[#7a8a7a] mt-1">
            Selesaikan dalam 3 menit dan langsung bisa tampil di Food Rescue!
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.num} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                step === s.num
                  ? 'bg-[#F4A261] text-white'
                  : step > s.num
                  ? 'bg-[#f0faf4] text-[#2D6A4F]'
                  : 'bg-[#f5f3ee] text-[#9a9a8a]'
              }`}>
                <span>{step > s.num ? '✓' : s.num}</span>
                <span className="hidden sm:block">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-6 h-0.5 rounded ${step > s.num ? 'bg-[#F4A261]' : 'bg-[#e8e4db]'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1 — Info Warung */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="bg-[#fef3e7] rounded-2xl p-4 border border-[#f9d4a7] mb-5">
              <p className="text-xs font-semibold text-[#d4720a] mb-1">📝 Langkah 1 dari 3</p>
              <p className="text-xs text-[#854F0B]">Isi informasi dasar warungmu</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#4a4a3a] mb-1.5">
                Nama Warung <span className="text-red-400">*</span>
              </label>
              <input name="nama_warung" value={form.nama_warung} onChange={handleChange}
                placeholder="contoh: Warung Bu Sari" className={inputClass} />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#4a4a3a] mb-1.5">Deskripsi Singkat</label>
              <textarea name="deskripsi" value={form.deskripsi} onChange={handleChange}
                placeholder="Ceritakan warungmu, menu andalan, dll."
                rows={3} className={inputClass + ' resize-none'} />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#4a4a3a] mb-2">
                Jenis Makanan <span className="text-red-400">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {JENIS_MAKANAN.map(j => (
                  <button key={j} type="button"
                    onClick={() => setForm(f => ({ ...f, jenis_makanan: j }))}
                    className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                      form.jenis_makanan === j
                        ? 'bg-[#F4A261] text-white border-[#F4A261]'
                        : 'bg-white text-[#4a4a3a] border-[#e8e4db] hover:border-[#F4A261]'
                    }`}>
                    {j}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#4a4a3a] mb-1.5">Jam Buka</label>
                <input type="time" name="jam_buka" value={form.jam_buka}
                  onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4a4a3a] mb-1.5">Jam Tutup</label>
                <input type="time" name="jam_tutup" value={form.jam_tutup}
                  onChange={handleChange} className={inputClass} />
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!form.nama_warung || !form.jenis_makanan}
              className="w-full py-3.5 rounded-2xl bg-[#F4A261] hover:bg-[#e8924f] text-white text-sm font-semibold disabled:opacity-50 transition-all shadow-md shadow-[#F4A261]/20"
            >
              Lanjut →
            </button>
          </div>
        )}

        {/* Step 2 — Foto & Lokasi */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-[#fef3e7] rounded-2xl p-4 border border-[#f9d4a7] mb-5">
              <p className="text-xs font-semibold text-[#d4720a] mb-1">📍 Langkah 2 dari 3</p>
              <p className="text-xs text-[#854F0B]">Upload foto warung dan set lokasi</p>
            </div>

            {/* Foto */}
            <div>
              <label className="block text-xs font-medium text-[#4a4a3a] mb-2">Foto Warung</label>
              {foto ? (
                <div className="relative rounded-2xl overflow-hidden">
                  <img src={foto} alt="Warung" className="w-full h-40 object-cover" />
                  <button onClick={() => { setFoto(null); setFotoFile(null) }}
                    className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-7 h-7 flex items-center justify-center">
                    ✕
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-[#f9d4a7] bg-[#fef3e7] rounded-2xl cursor-pointer hover:bg-[#fde8c8] transition-all">
                  <span className="text-3xl mb-2">📸</span>
                  <span className="text-xs text-[#d4720a] font-medium">Upload foto warung</span>
                  <input type="file" accept="image/*" className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0]
                      if (f) { setFoto(URL.createObjectURL(f)); setFotoFile(f) }
                    }} />
                </label>
              )}
            </div>

            {/* Lokasi */}
            <div>
              <label className="block text-xs font-medium text-[#4a4a3a] mb-2">
                📍 Lokasi Warung
              </label>
              <LocationPicker onChange={setLokasi} />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)}
                className="flex-1 py-3.5 rounded-2xl border border-[#e8e4db] text-[#4a4a3a] text-sm font-medium">
                ← Kembali
              </button>
              <button onClick={() => setStep(3)}
                className="flex-1 py-3.5 rounded-2xl bg-[#F4A261] hover:bg-[#e8924f] text-white text-sm font-semibold transition-all shadow-md shadow-[#F4A261]/20">
                Lanjut →
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Konfirmasi & Selesai */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-[#fef3e7] rounded-2xl p-4 border border-[#f9d4a7] mb-5">
              <p className="text-xs font-semibold text-[#d4720a] mb-1">🚀 Langkah 3 dari 3</p>
              <p className="text-xs text-[#854F0B]">Review dan selesaikan setup</p>
            </div>

            {/* Summary */}
            <div className="bg-white rounded-2xl border border-[#e8e4db] overflow-hidden">
              {foto && (
                <img src={foto} alt="Warung" className="w-full h-32 object-cover" />
              )}
              <div className="p-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[#9a9a8a]">Nama warung</span>
                  <span className="font-semibold text-[#1a3a2a]">{form.nama_warung}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#9a9a8a]">Jenis makanan</span>
                  <span className="font-semibold text-[#1a3a2a]">{form.jenis_makanan}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#9a9a8a]">Jam operasional</span>
                  <span className="font-semibold text-[#1a3a2a]">{form.jam_buka} - {form.jam_tutup}</span>
                </div>
                {lokasi.kabupaten && (
                  <div className="flex justify-between text-xs">
                    <span className="text-[#9a9a8a]">Lokasi</span>
                    <span className="font-semibold text-[#1a3a2a] text-right max-w-[60%] truncate">
                      {lokasi.kabupaten}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Benefit setelah daftar */}
            <div className="bg-[#f0faf4] rounded-2xl p-4 border border-[#b7e4cc]">
              <p className="text-xs font-semibold text-[#2D6A4F] mb-2">🎉 Setelah daftar kamu bisa:</p>
              {[
                'Tampil di peta Food Rescue',
                'Set jadwal donasi otomatis',
                'Dapat AI prediksi sisa makanan',
                'Lacak dampak donasi dengan dashboard',
              ].map(b => (
                <div key={b} className="flex items-center gap-2 text-xs text-[#4a4a3a] mb-1">
                  <span className="text-[#2D6A4F]">✓</span> {b}
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)}
                className="flex-1 py-3.5 rounded-2xl border border-[#e8e4db] text-[#4a4a3a] text-sm font-medium">
                ← Kembali
              </button>
              <button onClick={handleSelesai} disabled={loading}
                className="flex-1 py-3.5 rounded-2xl bg-[#F4A261] hover:bg-[#e8924f] text-white text-sm font-bold disabled:opacity-60 transition-all shadow-md shadow-[#F4A261]/20">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Menyimpan...
                  </span>
                ) : '🚀 Aktifkan Warung!'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}