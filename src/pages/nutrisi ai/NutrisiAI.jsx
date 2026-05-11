import { useState, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import Layout from '../../components/Layout'

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const PENILAIAN_CONFIG = {
  baik: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', label: '✅ Gizi Baik' },
  cukup: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', label: '⚠️ Gizi Cukup' },
  kurang: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', label: '❌ Gizi Kurang' },
}

export default function NutrisiAI() {
  const { user } = useAuth()
  const fileInputRef = useRef(null)

  const [foto, setFoto] = useState(null)
  const [fotoFile, setFotoFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [hasil, setHasil] = useState(null)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  function handleFotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setFoto(URL.createObjectURL(file))
    setFotoFile(file)
    setHasil(null)
    setSaved(false)
    setError('')
  }

  function handleDrop(e) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setFoto(URL.createObjectURL(file))
      setFotoFile(file)
      setHasil(null)
      setSaved(false)
    }
  }

  async function handleAnalisis() {
    if (!fotoFile) return
    setLoading(true)
    setError('')
    setHasil(null)

    try {
      // Konversi foto ke base64
      const base64 = await fileToBase64(fotoFile)
      const mimeType = fotoFile.type || 'image/jpeg'

      // Panggil Supabase Edge Function
      // API key Grok aman tersimpan di server, tidak terekspos ke browser
      const { data, error: fnError } = await supabase.functions.invoke('analisis-gizi', {
        body: { base64Image: base64, mimeType }
      })

      if (fnError) throw new Error(fnError.message)
      if (data?.error) throw new Error(data.error)

      setHasil(data)

    } catch (err) {
      console.error('Error analisis:', err)
      setError('Gagal menganalisis foto. Pastikan foto makanan jelas dan coba lagi.')
    }

    setLoading(false)
  }

  async function handleSimpan() {
    if (!hasil || !user) return
    setSaved(true)

    let foto_url = null
    try {
      const ext = fotoFile.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${ext}`
      const { data: uploadData } = await supabase.storage
        .from('foto-makanan')
        .upload(fileName, fotoFile)

      if (uploadData) {
        const { data: urlData } = supabase.storage
          .from('foto-makanan')
          .getPublicUrl(fileName)
        foto_url = urlData.publicUrl
      }
    } catch (_) {}

    await supabase.from('tracking_gizi').insert({
      user_id: user.id,
      foto_url,
      nama_makanan: hasil.makanan_terdeteksi?.join(', '),
      hasil_analisis: hasil,
      total_kalori: hasil.gizi?.kalori,
      total_protein: hasil.gizi?.protein_gram,
      total_zat_besi: hasil.gizi?.zat_besi_mg,
      total_vitamin_a: hasil.gizi?.vitamin_a_mcg,
    })
  }

  function handleReset() {
    setFoto(null)
    setFotoFile(null)
    setHasil(null)
    setSaved(false)
    setError('')
  }

  const penilaian = hasil
    ? PENILAIAN_CONFIG[hasil.penilaian] || PENILAIAN_CONFIG.cukup
    : null

  return (
    <Layout>
      <div className="max-w-lg mx-auto">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#1a3a2a]">🤖 AI Nutrisi</h1>
          <p className="text-sm text-[#7a8a7a] mt-1">
            Foto makananmu → AI analisis kandungan gizi instan
          </p>
        </div>

        {/* Upload Area */}
        {!foto ? (
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#b7e4cc] bg-[#f0faf4] rounded-3xl p-10 text-center cursor-pointer hover:bg-[#e8f7ef] hover:border-[#2D6A4F] transition-all"
          >
            <div className="text-5xl mb-4">📸</div>
            <p className="text-sm font-semibold text-[#2D6A4F]">
              Tap untuk upload foto makanan
            </p>
            <p className="text-xs text-[#9a9a8a] mt-2">atau drag & drop foto ke sini</p>
            <p className="text-xs text-[#b0b0a0] mt-4">JPG, PNG, WEBP · Max 10MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFotoChange}
              className="hidden"
            />
          </div>
        ) : (
          <div className="relative rounded-3xl overflow-hidden mb-4 shadow-lg">
            <img
              src={foto}
              alt="Foto makanan"
              className="w-full max-h-72 object-cover"
            />
            <button
              onClick={handleReset}
              className="absolute top-3 right-3 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/70 transition-all"
            >✕</button>
          </div>
        )}

        {/* Tombol Analisis */}
        {foto && !hasil && (
          <button
            onClick={handleAnalisis}
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-[#2D6A4F] hover:bg-[#235c43] text-white font-semibold text-sm transition-all shadow-lg shadow-[#2D6A4F]/20 disabled:opacity-60 mt-4"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                AI sedang menganalisis...
              </span>
            ) : '🔍 Analisis Gizi Sekarang'}
          </button>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="mt-6 bg-white rounded-3xl border border-[#e8e4db] p-6 text-center">
            <div className="text-3xl mb-3 animate-bounce">🤖</div>
            <p className="text-sm font-medium text-[#1a3a2a]">
              AI sedang menganalisis makananmu...
            </p>
            <p className="text-xs text-[#9a9a8a] mt-1">Ini mungkin butuh 5-10 detik</p>
          </div>
        )}

        {/* Hasil Analisis */}
        {hasil && (
          <div className="mt-4 space-y-4">

            {/* Makanan Terdeteksi */}
            <div className="bg-white rounded-3xl border border-[#e8e4db] p-5">
              <h3 className="text-sm font-semibold text-[#1a3a2a] mb-3">
                🍽️ Makanan Terdeteksi
              </h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {hasil.makanan_terdeteksi?.map((item, i) => (
                  <span
                    key={i}
                    className="bg-[#f0faf4] text-[#2D6A4F] text-xs font-medium px-3 py-1.5 rounded-full border border-[#b7e4cc]"
                  >
                    {item}
                  </span>
                ))}
              </div>
              <p className="text-xs text-[#9a9a8a]">📏 {hasil.estimasi_porsi}</p>
            </div>

            {/* Kandungan Gizi */}
            <div className="bg-white rounded-3xl border border-[#e8e4db] p-5">
              <h3 className="text-sm font-semibold text-[#1a3a2a] mb-4">
                📊 Kandungan Gizi
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Kalori', value: hasil.gizi?.kalori, unit: 'kkal', color: 'text-orange-500', bg: 'bg-orange-50' },
                  { label: 'Protein', value: hasil.gizi?.protein_gram, unit: 'gram', color: 'text-[#2D6A4F]', bg: 'bg-[#f0faf4]' },
                  { label: 'Karbohidrat', value: hasil.gizi?.karbohidrat_gram, unit: 'gram', color: 'text-blue-500', bg: 'bg-blue-50' },
                  { label: 'Lemak', value: hasil.gizi?.lemak_gram, unit: 'gram', color: 'text-yellow-600', bg: 'bg-yellow-50' },
                  { label: 'Zat Besi', value: hasil.gizi?.zat_besi_mg, unit: 'mg', color: 'text-red-500', bg: 'bg-red-50' },
                  { label: 'Vitamin A', value: hasil.gizi?.vitamin_a_mcg, unit: 'mcg', color: 'text-purple-500', bg: 'bg-purple-50' },
                ].map(item => (
                  <div key={item.label} className={`${item.bg} rounded-2xl p-3 text-center`}>
                    <div className={`text-xl font-bold ${item.color}`}>{item.value}</div>
                    <div className="text-xs text-[#9a9a8a] mt-0.5">{item.unit}</div>
                    <div className="text-xs font-medium text-[#4a4a3a] mt-0.5">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Penilaian & Catatan */}
            <div className={`${penilaian?.bg} rounded-3xl border ${penilaian?.border} p-5`}>
              <div className={`text-sm font-bold ${penilaian?.text} mb-2`}>
                {penilaian?.label}
              </div>
              <p className="text-sm text-[#4a4a3a] leading-relaxed">{hasil.catatan}</p>
              {hasil.saran && (
                <div className="mt-3 pt-3 border-t border-[#e8e4db]">
                  <p className="text-xs font-medium text-[#4a4a3a] mb-1">💡 Saran:</p>
                  <p className="text-xs text-[#6a7a6a] leading-relaxed">{hasil.saran}</p>
                </div>
              )}
            </div>

            {/* Tombol Aksi */}
            <div className="flex gap-3 pb-4">
              <button
                onClick={handleReset}
                className="flex-1 py-3.5 rounded-2xl border border-[#e8e4db] text-[#4a4a3a] text-sm font-medium hover:bg-[#f5f3ee] transition-all"
              >
                📸 Foto Lagi
              </button>
              <button
                onClick={handleSimpan}
                disabled={saved}
                className="flex-1 py-3.5 rounded-2xl bg-[#2D6A4F] hover:bg-[#235c43] text-white text-sm font-semibold transition-all disabled:opacity-60"
              >
                {saved ? '✅ Tersimpan!' : '💾 Simpan'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}