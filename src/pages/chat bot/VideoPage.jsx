import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { tambahPoin } from '../../lib/poinHelper'

const CATEGORIES = ['Semua', 'MPASI', 'Balita', 'Ibu Hamil', 'Kader Posyandu', 'Umum']

function getYoutubeId(url) {
  const match = url?.match(/(?:v=|youtu\.be\/)([^&\n?#]+)/)
  return match ? match[1] : null
}

export default function VideoPage() {
  const { user } = useAuth()
  const [videos, setVideos] = useState([])
  const [category, setCategory] = useState('Semua')
  const [selected, setSelected] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => { fetchVideos() }, [category])

  async function fetchVideos() {
    setLoading(true)
    let query = supabase.from('education_videos').select('*')
    if (category !== 'Semua') query = query.eq('category', category)
    const { data } = await query.order('created_at', { ascending: false })
    setVideos(data || [])
    setLoading(false)
  }

  if (showForm) {
    return (
      <>
        <TambahVideoForm
          onSuccess={() => {
            setShowSuccess(true)
            fetchVideos()

            setTimeout(() => {
              setShowSuccess(false)
            }, 3000)
          }}
          onBack={() => {
            setShowForm(false)
            fetchVideos()
          }}
        />

        {/* Success Popup */}
        {showSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
            <div className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl animate-[fadeIn_.2s_ease]">
              <div className="w-16 h-16 rounded-full bg-[#f0faf4] flex items-center justify-center text-3xl mx-auto mb-4">
                🎉
              </div>

              <h3 className="text-base font-bold text-center text-[#1a3a2a]">
                Video Berhasil Ditambahkan!
              </h3>

              <p className="text-sm text-[#6b7b70] text-center mt-2 leading-relaxed">
                Terima kasih sudah berbagi edukasi 🎬
                <br />
                Kamu mendapat <span className="font-bold text-[#2D6A4F]">+10 poin</span>
              </p>

              <button
                onClick={() => {
                  setShowSuccess(false)
                  setShowForm(false)
                }}
                className="w-full mt-5 bg-[#2D6A4F] hover:bg-[#235c43] text-white py-3 rounded-2xl text-sm font-semibold transition-all"
              >
                Oke
              </button>
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <div>
      {/* Header + Tombol Tambah */}
      <div className="flex items-center justify-between mb-4 gap-2">
        <div className="bg-[#f0faf4] rounded-2xl p-3 flex-1 border border-[#b7e4cc]">
          <p className="text-xs font-semibold text-[#2D6A4F] mb-0.5">🎬 Video Edukasi Gizi</p>
          <p className="text-xs text-[#5a7a6a]">
            Pelajari gizi dari para ahli melalui video singkat.
          </p>

          <div className="mt-2 inline-flex items-center gap-1 bg-[#fff7d6] text-[#8a6d1f] border border-[#ffe58f] px-2 py-1 rounded-full text-[11px] font-semibold">
            ⭐ Upload video = +10 poin
          </div>
        </div>
        {user && (
          <button
            onClick={() => setShowForm(true)}
            className="flex-shrink-0 bg-[#2D6A4F] hover:bg-[#235c43] text-white text-xs font-semibold px-3 py-2 rounded-2xl flex items-center gap-1 shadow-md shadow-[#2D6A4F]/20 transition-all"
          >
            <span>+</span> Tambah
          </button>
        )}
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(c)}
            className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap border font-medium transition-all ${
              category === c
                ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]'
                : 'bg-white text-[#4a4a3a] border-[#e8e4db] hover:bg-[#f0faf4] hover:border-[#b7e4cc]'
            }`}>
            {c}
          </button>
        ))}
      </div>

      {/* Video Player */}
      {selected && (
        <div className="mb-4">
          <div className="relative w-full rounded-2xl overflow-hidden border border-[#e8e4db]"
            style={{ paddingTop: '56.25%' }}>
            <iframe
              className="absolute top-0 left-0 w-full h-full"
              src={`https://www.youtube.com/embed/${getYoutubeId(selected.youtube_url)}`}
              title={selected.title}
              allowFullScreen
            />
          </div>
          <div className="mt-3 p-3 bg-[#f0faf4] rounded-2xl border border-[#b7e4cc]">
            <h3 className="text-sm font-semibold text-[#1a3a2a]">{selected.title}</h3>
            <p className="text-xs text-[#2D6A4F] font-medium mt-1">
              {selected.expert_name} · {selected.expert_title}
            </p>
            <p className="text-xs text-[#7a8a7a] mt-2 leading-relaxed">{selected.description}</p>
          </div>
          <button onClick={() => setSelected(null)} className="mt-3 text-xs text-[#2D6A4F] font-medium">
            ← Kembali ke daftar video
          </button>
          <div className="border-t border-[#f0ece4] my-4" />
          <p className="text-xs font-semibold text-[#9a9a8a] mb-3">VIDEO LAINNYA</p>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-32 h-20 bg-[#f0ece4] rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3 bg-[#f0ece4] rounded w-full" />
                <div className="h-3 bg-[#f0ece4] rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-4xl mb-2">🎬</p>
          <p className="text-sm font-medium text-[#4a4a3a]">Belum ada video</p>
          <p className="text-xs text-[#9a9a8a] mt-1">Coba kategori lain</p>
          {user && (
            <button onClick={() => setShowForm(true)}
              className="mt-3 text-xs text-[#2D6A4F] font-semibold underline">
              + Tambah video pertama
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {videos.map(v => {
            const ytId = getYoutubeId(v.youtube_url)
            const isSelected = selected?.id === v.id
            return (
              <div key={v.id} onClick={() => setSelected(v)}
                className={`flex gap-3 cursor-pointer rounded-2xl p-2.5 border transition-all ${
                  isSelected
                    ? 'bg-[#f0faf4] border-[#b7e4cc]'
                    : 'bg-white border-[#e8e4db] hover:bg-[#faf9f7] hover:border-[#b7e4cc]'
                }`}>
                <div className="w-32 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-[#f0faf4]">
                  <img
                    src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
                    alt={v.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#1a3a2a] line-clamp-2 leading-tight">{v.title}</p>
                  <p className="text-xs text-[#7a8a7a] mt-1">{v.expert_name}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs bg-[#f0faf4] text-[#2D6A4F] border border-[#b7e4cc] px-2 py-0.5 rounded-full">
                      {v.category}
                    </span>
                    {v.duration_minutes && (
                      <span className="text-xs text-[#9a9a8a]">⏱ {v.duration_minutes} menit</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Form Tambah Video ───────────────────────────────────────
function TambahVideoForm({ onBack, onSuccess }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', youtube_url: '', category: 'Umum',
    duration_minutes: '', expert_name: '', expert_title: ''
  })

  async function handleSubmit() {
    if (!form.title || !form.youtube_url) return

    setLoading(true)

    const { error } = await supabase.from('education_videos').insert({
      title: form.title,
      description: form.description,
      youtube_url: form.youtube_url,
      category: form.category,
      expert_name: form.expert_name,
      expert_title: form.expert_title,
      duration_minutes: form.duration_minutes
        ? parseInt(form.duration_minutes)
        : null,
      created_by: user?.id,
    })

    if (!error) {
      await tambahPoin(
        user.id,
        'upload_video',
        `Upload video edukasi: ${form.title}`
      )

      onSuccess?.()

      setTimeout(() => {
        onBack?.()
      }, 5000)
    }

    setLoading(false)
  }

  const inputClass = "w-full px-3 py-2.5 rounded-xl border border-[#e8e4db] bg-[#faf9f7] text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] transition-all"

  return (
    <div>
      <button onClick={onBack} className="text-sm text-[#2D6A4F] font-medium mb-4">← Kembali</button>
      <h2 className="text-base font-bold text-[#1a3a2a] mb-4">Tambah Video Edukasi</h2>
      <div className="space-y-3">
        <input value={form.title}
          onChange={e => setForm(f => ({...f, title: e.target.value}))}
          placeholder="Judul video *" className={inputClass} />

        <input value={form.youtube_url}
          onChange={e => setForm(f => ({...f, youtube_url: e.target.value}))}
          placeholder="URL YouTube * (https://youtube.com/watch?v=...)" className={inputClass} />

        <textarea value={form.description}
          onChange={e => setForm(f => ({...f, description: e.target.value}))}
          placeholder="Deskripsi video" rows={2} className={inputClass + ' resize-none'} />

        <div className="grid grid-cols-2 gap-3">
          <select value={form.category}
            onChange={e => setForm(f => ({...f, category: e.target.value}))}
            className={inputClass}>
            {['MPASI','Balita','Ibu Hamil','Kader Posyandu','Umum'].map(c => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <input type="number" value={form.duration_minutes}
            onChange={e => setForm(f => ({...f, duration_minutes: e.target.value}))}
            placeholder="Durasi (menit)" className={inputClass} />
        </div>

        <input value={form.expert_name}
          onChange={e => setForm(f => ({...f, expert_name: e.target.value}))}
          placeholder="Nama narasumber" className={inputClass} />

        <input value={form.expert_title}
          onChange={e => setForm(f => ({...f, expert_title: e.target.value}))}
          placeholder="Jabatan narasumber" className={inputClass} />

        <button onClick={handleSubmit}
          disabled={loading || !form.title || !form.youtube_url}
          className="w-full bg-[#2D6A4F] hover:bg-[#235c43] text-white py-3.5 rounded-2xl text-sm font-semibold disabled:opacity-40 shadow-md shadow-[#2D6A4F]/20 transition-all">
          {loading ? 'Menyimpan...' : '✅ Simpan Video'}
        </button>
      </div>
    </div>
  )
}