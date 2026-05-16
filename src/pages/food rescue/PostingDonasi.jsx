import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/Layout'
import LocationPicker from '../../components/LocationPicker'
import { tambahPoin } from '../../lib/poinHelper'

export default function PostingDonasi() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    nama_makanan: '',
    deskripsi: '',
    jumlah_porsi: '',
    expired_at: '',
  })
  const [lokasi, setLokasi] = useState({
    alamat: '', provinsi: '', kabupaten: '', kecamatan: '', kelurahan: '', jalan: ''
  })
  const [foto, setFoto] = useState(null)
  const [fotoFile, setFotoFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  function handleFoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setFoto(URL.createObjectURL(file))
    setFotoFile(file)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nama_makanan || !form.jumlah_porsi) {
      setError('Nama makanan dan jumlah porsi wajib diisi.')
      return
    }
    if (!lokasi.kabupaten) {
      setError('Pilih lokasi minimal sampai kabupaten/kota.')
      return
    }
    setLoading(true)
    setError('')
    try {
      let foto_url = null
      if (fotoFile) {
        const ext = fotoFile.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}.${ext}`
        const { data: uploadData } = await supabase.storage
          .from('foto-donasi').upload(fileName, fotoFile)
        if (uploadData) {
          const { data: urlData } = supabase.storage
            .from('foto-donasi').getPublicUrl(fileName)
          foto_url = urlData.publicUrl
        }
      }
      const { error: insertError } = await supabase.from('donasi').insert({
        donor_id: user.id,
        nama_makanan: form.nama_makanan,
        deskripsi: form.deskripsi,
        jumlah_porsi: parseInt(form.jumlah_porsi),
        alamat: lokasi.alamat,
        provinsi: lokasi.provinsi,
        kabupaten: lokasi.kabupaten,
        kecamatan: lokasi.kecamatan,
        kelurahan: lokasi.kelurahan,
        foto_url,
        expired_at: form.expired_at || null,
        status: 'tersedia'
      })
      if (insertError) throw insertError
      await tambahPoin(user.id, 'donasi_porsi', `Donasi: ${form.nama_makanan} (${form.jumlah_porsi} porsi)`)
      navigate('/food-rescue')
    } catch (err) {
      setError('Gagal memposting donasi. Coba lagi.')
      console.error(err)
    }
    setLoading(false)
  }

  const inputClass = "w-full px-4 py-3 rounded-xl border border-[#e8e4db] bg-[#faf9f7] text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] transition-all"
  const labelClass = "block text-xs font-semibold text-[#4a4a3a] mb-1.5"

  return (
    <Layout>
      <div className="w-full px-4">

        {/* Header Hero */}
        <div className="relative bg-gradient-to-br from-[#F4A261] to-[#e8924f] rounded-3xl p-5 mb-6 overflow-hidden">
          <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-white/10" />
          <div className="relative">
            <span className="text-3xl">📤</span>
            <h1 className="text-xl font-bold text-white mt-2 mb-1">
              Posting Donasi Makanan
            </h1>
            <p className="text-xs text-white/80 leading-relaxed">
              Punya sisa makanan yang sayang dibuang? Bagikan ke keluarga yang membutuhkan di sekitarmu. Setiap donasi = <span className="font-bold">+50 Lumbung Poin</span> untukmu! 🌾
            </p>
          </div>
        </div>

        {/* Info 3 langkah */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {[
            { step: '1', icon: '📝', title: 'Isi Form', desc: 'Nama & jumlah porsi' },
            { step: '2', icon: '📍', title: 'Set Lokasi', desc: 'Agar mudah dijemput' },
            { step: '3', icon: '🚀', title: 'Publish', desc: 'Langsung live!' },
          ].map(s => (
            <div key={s.step} className="bg-white rounded-2xl border border-[#e8e4db] p-3 text-center">
              <div className="w-6 h-6 rounded-full bg-[#2D6A4F] text-white text-xs font-bold flex items-center justify-center mx-auto mb-2">
                {s.step}
              </div>
              <div className="text-xl mb-1">{s.icon}</div>
              <p className="text-xs font-semibold text-[#1a3a2a]">{s.title}</p>
              <p className="text-[10px] text-[#9a9a8a] mt-0.5">{s.desc}</p>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Section 1 — Foto */}
          <div className="bg-white rounded-2xl border border-[#e8e4db] p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-[#f0faf4] flex items-center justify-center text-xs">
                📸
              </div>
              <div>
                <p className="text-xs font-semibold text-[#1a3a2a]">Foto Makanan</p>
                <p className="text-[10px] text-[#9a9a8a]">
                  Foto menarik = lebih cepat diambil orang
                </p>
              </div>
            </div>

            {foto ? (
              <div className="relative rounded-xl overflow-hidden">
                <img src={foto} alt="Preview" className="w-full h-48 object-cover" />
                <button
                  type="button"
                  onClick={() => { setFoto(null); setFotoFile(null) }}
                  className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/80 transition-all"
                >✕</button>
                <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                  Tap ✕ untuk ganti foto
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-[#b7e4cc] bg-[#f8fdf9] rounded-xl cursor-pointer hover:bg-[#f0faf4] transition-all group">
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📷</div>
                <p className="text-sm font-medium text-[#2D6A4F]">Upload foto makanan</p>
                <p className="text-xs text-[#9a9a8a] mt-1">JPG, PNG · Opsional tapi direkomendasikan</p>
                <input type="file" accept="image/*" onChange={handleFoto} className="hidden" />
              </label>
            )}
          </div>

          {/* Section 2 — Detail Makanan */}
          <div className="bg-white rounded-2xl border border-[#e8e4db] p-4 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-full bg-[#f0faf4] flex items-center justify-center text-xs">🍱</div>
              <div>
                <p className="text-xs font-semibold text-[#1a3a2a]">Detail Makanan</p>
                <p className="text-[10px] text-[#9a9a8a]">Informasi makanan yang akan didonasikan</p>
              </div>
            </div>

            <div>
              <label className={labelClass}>
                Nama Makanan <span className="text-red-400">*</span>
              </label>
              <input
                name="nama_makanan"
                value={form.nama_makanan}
                onChange={handleChange}
                placeholder="contoh: Nasi Padang, Mie Goreng, Bubur Ayam"
                required
                className={inputClass}
              />
              <p className="text-[10px] text-[#9a9a8a] mt-1">
                Tulis nama makanan sejelas mungkin
              </p>
            </div>

            <div>
              <label className={labelClass}>Deskripsi</label>
              <textarea
                name="deskripsi"
                value={form.deskripsi}
                onChange={handleChange}
                placeholder="Ceritakan isi makanan, lauk pauknya, kondisi makanan, apakah masih panas, dll."
                rows={3}
                className={inputClass + ' resize-none'}
              />
            </div>

            <div>
              <label className={labelClass}>
                Jumlah Porsi <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  name="jumlah_porsi"
                  type="number"
                  min="1"
                  value={form.jumlah_porsi}
                  onChange={handleChange}
                  placeholder="0"
                  required
                  className={inputClass + ' pr-16'}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#9a9a8a] font-medium">
                  porsi
                </span>
              </div>
              <p className="text-[10px] text-[#9a9a8a] mt-1">
                Estimasi jumlah orang yang bisa makan
              </p>
            </div>

            <div>
              <label className={labelClass}>Batas Waktu Pengambilan</label>
              <input
                name="expired_at"
                type="datetime-local"
                value={form.expired_at}
                onChange={handleChange}
                min={new Date().toISOString().slice(0, 16)}
                className={inputClass}
              />
              <p className="text-[10px] text-[#9a9a8a] mt-1">
                Kosongkan jika tidak ada batas waktu
              </p>
            </div>
          </div>

          {/* Section 3 — Lokasi */}
          <div className="bg-white rounded-2xl border border-[#e8e4db] p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-[#f0faf4] flex items-center justify-center text-xs">📍</div>
              <div>
                <p className="text-xs font-semibold text-[#1a3a2a]">Lokasi Pengambilan</p>
                <p className="text-[10px] text-[#9a9a8a]">
                  Pilih lokasi agar penerima tahu tempat jemput makanan
                </p>
              </div>
            </div>
            <LocationPicker onChange={setLokasi} />
          </div>

          {/* Poin Reward */}
          <div className="bg-gradient-to-r from-[#f0faf4] to-[#e8f7ef] rounded-2xl p-4 flex items-center gap-4 border border-[#b7e4cc]">
            <div className="w-12 h-12 rounded-2xl bg-[#2D6A4F] flex items-center justify-center text-2xl flex-shrink-0">
              ⭐
            </div>
            <div>
              <p className="text-sm font-bold text-[#2D6A4F]">
                Kamu dapat +50 Lumbung Poin!
              </p>
              <p className="text-xs text-[#5a7a6a] mt-0.5 leading-relaxed">
                Poin bisa dipakai untuk naik level badge. Semakin sering donasi, semakin tinggi levelmu di komunitas LUMBUNG.
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-start gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Tombol */}
          <div className="flex gap-3 pb-6">
            <button
              type="button"
              onClick={() => navigate('/food-rescue')}
              className="flex-1 py-3.5 rounded-2xl border border-[#e8e4db] text-[#4a4a3a] text-sm font-medium hover:bg-[#f5f3ee] transition-all"
            >
              ← Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3.5 rounded-2xl bg-[#2D6A4F] hover:bg-[#235c43] active:scale-[0.98] text-white text-sm font-bold transition-all shadow-lg shadow-[#2D6A4F]/25 disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Memposting...
                </span>
              ) : '📤 Post Donasi Sekarang'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}