import { useState, useRef, useEffect } from 'react'
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
  baik: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    label: '✅ Gizi Baik',
  },
  cukup: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-700',
    label: '⚠️ Gizi Cukup',
  },
  kurang: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    label: '❌ Gizi Kurang',
  },
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

  const [riwayat, setRiwayat] = useState([])

  useEffect(() => {
    if (user) fetchRiwayat()
  }, [user])

  async function fetchRiwayat() {
    const { data } = await supabase
      .from('tracking_gizi')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setRiwayat(data || [])
  }

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
      setError('')
    }
  }

  async function handleAnalisis() {
    if (!fotoFile) return

    setLoading(true)
    setError('')
    setHasil(null)

    try {
      const base64 = await fileToBase64(fotoFile)
      const mimeType = fotoFile.type || 'image/jpeg'

      const { data, error: fnError } = await supabase.functions.invoke(
        'analisis-gizi',
        {
          body: {
            base64Image: base64,
            mimeType,
          },
        }
      )

      if (fnError) throw new Error(fnError.message)
      if (data?.error) throw new Error(data.error)

      setHasil(data)
    } catch (err) {
      console.error(err)
      setError('Gagal menganalisis foto.')
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

      total_kalori: hasil.gizi?.kalori || 0,
      total_protein: hasil.gizi?.protein_gram || 0,
      total_karbohidrat: hasil.gizi?.karbohidrat_gram || 0,
      total_lemak: hasil.gizi?.lemak_gram || 0,
      total_zat_besi: hasil.gizi?.zat_besi_mg || 0,
      total_vitamin_a: hasil.gizi?.vitamin_a_mcg || 0,
    })

    fetchRiwayat()
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
      <div className="w-full px-4">

        {/* HEADER */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#1a3a2a]">
            🤖 AI Nutrisi
          </h1>

          <p className="text-sm text-[#7a8a7a] mt-1">
            Foto makananmu → AI analisis kandungan gizi instan
          </p>
        </div>

        {/* UPLOAD */}
        {!foto ? (
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#b7e4cc] bg-[#f0faf4] rounded-3xl p-10 text-center cursor-pointer"
          >
            <div className="text-5xl mb-4">📸</div>

            <p className="text-sm font-semibold text-[#2D6A4F]">
              Tap untuk upload foto makanan
            </p>

            <p className="text-xs text-[#9a9a8a] mt-2">
              atau drag & drop foto ke sini
            </p>

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
          <div className="relative rounded-3xl overflow-hidden mb-4">
            <img
              src={foto}
              alt="preview"
              className="w-full max-h-72 object-cover"
            />

            <button
              onClick={handleReset}
              className="absolute top-3 right-3 bg-black/50 text-white w-8 h-8 rounded-full"
            >
              ✕
            </button>
          </div>
        )}

        {/* BUTTON ANALISIS */}
        {foto && !hasil && (
          <button
            onClick={handleAnalisis}
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-[#2D6A4F] text-white font-semibold mt-4"
          >
            {loading ? 'AI sedang menganalisis...' : '🔍 Analisis Gizi'}
          </button>
        )}

        {/* ERROR */}
        {error && (
          <div className="mt-4 p-4 rounded-2xl bg-red-50 text-red-500 text-sm">
            {error}
          </div>
        )}

        {/* HASIL */}
        {hasil && (
          <div className="mt-4 space-y-4">

            {/* Makanan */}
            <div className="bg-white rounded-3xl border border-[#e8e4db] p-5">
              <h3 className="text-sm font-semibold mb-3">
                🍽️ Makanan Terdeteksi
              </h3>

              <div className="flex flex-wrap gap-2 mb-3">
                {hasil.makanan_terdeteksi?.map((item, i) => (
                  <span
                    key={i}
                    className="bg-[#f0faf4] text-[#2D6A4F] text-xs px-3 py-1.5 rounded-full"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <p className="text-xs text-[#9a9a8a]">
                📏 {hasil.estimasi_porsi}
              </p>
            </div>

            {/* GIZI */}
            <div className="bg-white rounded-3xl border border-[#e8e4db] p-5">
              <h3 className="text-sm font-semibold mb-4">
                📊 Kandungan Gizi
              </h3>

              <div className="grid grid-cols-2 gap-3">

                <div className="bg-orange-50 rounded-2xl p-3 text-center">
                  <div className="text-xl font-bold text-orange-500">
                    {hasil.gizi?.kalori || 0}
                  </div>
                  <div className="text-xs">kkal</div>
                  <div className="text-xs mt-1">Kalori</div>
                </div>

                <div className="bg-[#f0faf4] rounded-2xl p-3 text-center">
                  <div className="text-xl font-bold text-[#2D6A4F]">
                    {hasil.gizi?.protein_gram || 0}
                  </div>
                  <div className="text-xs">gram</div>
                  <div className="text-xs mt-1">Protein</div>
                </div>

                <div className="bg-blue-50 rounded-2xl p-3 text-center">
                  <div className="text-xl font-bold text-blue-500">
                    {hasil.gizi?.karbohidrat_gram || 0}
                  </div>
                  <div className="text-xs">gram</div>
                  <div className="text-xs mt-1">Karbohidrat</div>
                </div>

                <div className="bg-yellow-50 rounded-2xl p-3 text-center">
                  <div className="text-xl font-bold text-yellow-600">
                    {hasil.gizi?.lemak_gram || 0}
                  </div>
                  <div className="text-xs">gram</div>
                  <div className="text-xs mt-1">Lemak</div>
                </div>
              </div>
            </div>

            {/* KESIMPULAN */}
            <div className={`${penilaian?.bg} border ${penilaian?.border} rounded-3xl p-5`}>
              <div className={`text-sm font-bold ${penilaian?.text} mb-2`}>
                {penilaian?.label}
              </div>

              <p className="text-sm text-[#4a4a3a] leading-relaxed">
                {hasil.catatan}
              </p>
            </div>

            {/* BUTTON */}
            <div className="flex gap-3">

              <button
                onClick={handleReset}
                className="flex-1 py-3 rounded-2xl border border-[#e8e4db]"
              >
                📸 Foto Lagi
              </button>

              <button
                onClick={handleSimpan}
                disabled={saved}
                className="flex-1 py-3 rounded-2xl bg-[#2D6A4F] text-white"
              >
                {saved ? '✅ Tersimpan' : '💾 Simpan'}
              </button>
            </div>
          </div>
        )}

        {/* RIWAYAT */}
        {riwayat.length > 0 && (
          <div className="mt-10">

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#1a3a2a]">
                📚 Riwayat Tracking Saya
              </h2>

              <span className="text-xs bg-[#f0faf4] text-[#2D6A4F] px-3 py-1 rounded-full">
                {riwayat.length} tracking
              </span>
            </div>

            <div className="space-y-4">

              {riwayat.map(item => {

                const analisis =
                  typeof item.hasil_analisis === 'string'
                    ? JSON.parse(item.hasil_analisis)
                    : item.hasil_analisis

                const penilaianData =
                  PENILAIAN_CONFIG[analisis?.penilaian] ||
                  PENILAIAN_CONFIG.cukup

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-3xl border border-[#e8e4db] overflow-hidden"
                  >

                    {/* FOTO */}
                    {item.foto_url && (
                      <img
                        src={item.foto_url}
                        alt={item.nama_makanan}
                        className="w-full h-52 object-cover"
                      />
                    )}

                    <div className="p-5">

                      {/* HEADER */}
                      <div className="flex items-start justify-between gap-3 mb-3">

                        <div>
                          <h3 className="text-base font-bold text-[#1a3a2a]">
                            🍽️ {item.nama_makanan}
                          </h3>

                          <p className="text-xs text-[#9a9a8a] mt-1">
                            {new Date(item.created_at).toLocaleDateString(
                              'id-ID',
                              {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              }
                            )}
                          </p>
                        </div>

                        <div
                          className={`${penilaianData.bg} ${penilaianData.border} border px-3 py-1 rounded-full text-xs font-semibold ${penilaianData.text}`}
                        >
                          {penilaianData.label}
                        </div>
                      </div>

                      {/* MAKANAN */}
                      {analisis?.makanan_terdeteksi && (
                        <div className="mb-4">
                          <p className="text-xs font-semibold mb-2">
                            🍴 Makanan Terdeteksi
                          </p>

                          <div className="flex flex-wrap gap-2">
                            {analisis.makanan_terdeteksi.map((mkn, i) => (
                              <span
                                key={i}
                                className="bg-[#f0faf4] text-[#2D6A4F] text-[11px] px-2.5 py-1 rounded-full"
                              >
                                {mkn}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* GIZI */}
                      <div className="grid grid-cols-2 gap-3 mb-4">

                        <div className="bg-orange-50 rounded-2xl p-3 text-center">
                          <div className="text-lg font-bold text-orange-500">
                            {item.total_kalori || 0}
                          </div>
                          <div className="text-xs">kkal</div>
                          <div className="text-xs mt-1">Kalori</div>
                        </div>

                        <div className="bg-[#f0faf4] rounded-2xl p-3 text-center">
                          <div className="text-lg font-bold text-[#2D6A4F]">
                            {item.total_protein || 0}
                          </div>
                          <div className="text-xs">gram</div>
                          <div className="text-xs mt-1">Protein</div>
                        </div>

                        <div className="bg-blue-50 rounded-2xl p-3 text-center">
                          <div className="text-lg font-bold text-blue-500">
                            {item.total_karbohidrat || 0}
                          </div>
                          <div className="text-xs">gram</div>
                          <div className="text-xs mt-1">Karbohidrat</div>
                        </div>

                        <div className="bg-yellow-50 rounded-2xl p-3 text-center">
                          <div className="text-lg font-bold text-yellow-600">
                            {item.total_lemak || 0}
                          </div>
                          <div className="text-xs">gram</div>
                          <div className="text-xs mt-1">Lemak</div>
                        </div>
                      </div>

                      {/* KESIMPULAN */}
                      {analisis?.catatan && (
                        <div className="bg-[#f8f8f5] rounded-2xl p-4 mb-3">
                          <p className="text-xs font-semibold mb-1">
                            📝 Kesimpulan Analisis
                          </p>

                          <p className="text-sm text-[#5a5a4a] leading-relaxed">
                            {analisis.catatan}
                          </p>
                        </div>
                      )}

                      {/* SARAN */}
                      {analisis?.saran && (
                        <div className="bg-[#fef9f3] rounded-2xl p-4">
                          <p className="text-xs font-semibold mb-1">
                            💡 Saran AI
                          </p>

                          <p className="text-sm text-[#7a5a2a] leading-relaxed">
                            {analisis.saran}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="h-10" />
      </div>
    </Layout>
  )
}