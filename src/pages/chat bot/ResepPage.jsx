import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { tambahPoin } from '../../lib/poinHelper'

const CATEGORIES = ['Semua', 'MPASI', 'Balita', 'Umum', 'Ibu Hamil', 'Lansia']

export default function ResepPage() {
  const { user } = useAuth()
  const [recipes, setRecipes] = useState([])
  const [category, setCategory] = useState('Semua')
  const [maxBudget, setMaxBudget] = useState(50000)
  const [selected, setSelected] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => { fetchRecipes() }, [category, maxBudget])

  async function fetchRecipes() {
    setLoading(true)
    let query = supabase.from('recipes').select('*')
      .eq('is_verified', true)
      .lte('budget_per_portion', maxBudget)
    if (category !== 'Semua') query = query.eq('category', category)
    const { data } = await query.order('created_at', { ascending: false })
    setRecipes(data || [])
    setLoading(false)
  }

  if (showForm) {
    return (
      <>
        <TambahResepForm
          onSuccess={() => {
            setShowSuccess(true)
            fetchRecipes()

            setTimeout(() => {
              setShowSuccess(false)
            }, 3000)
          }}
          onBack={() => {
            setShowForm(false)
            fetchRecipes()
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
                Resep Berhasil Ditambahkan!
              </h3>

              <p className="text-sm text-[#6b7b70] text-center mt-2 leading-relaxed">
                Terima kasih sudah berbagi resep sehat 🥘
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
  if (selected) return <RecipeDetail recipe={selected} onBack={() => setSelected(null)} />

  return (
    <div>
      {/* Header + Tombol Tambah */}
      <div className="flex items-center justify-between mb-4 gap-2">
        <div className="bg-[#f0faf4] rounded-2xl p-3 flex-1 border border-[#b7e4cc]">
          <p className="text-xs font-semibold text-[#2D6A4F] mb-0.5">📖 Resep Lokal Bergizi</p>
          <p className="text-xs text-[#5a7a6a]">Resep berbahan lokal Indonesia yang murah dan bergizi.</p>
          <div className="mt-2 inline-flex items-center gap-1 bg-[#fff7d6] text-[#8a6d1f] border border-[#ffe58f] px-2 py-1 rounded-full text-[11px] font-semibold">
            ⭐ Upload resep = +10 poin
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

      {/* Budget Slider */}
      <div className="bg-[#faf9f7] rounded-2xl border border-[#e8e4db] p-3 mb-4">
        <div className="flex justify-between text-xs mb-2">
          <span className="text-[#4a4a3a] font-medium">Budget per porsi</span>
          <span className="font-bold text-[#2D6A4F]">Rp {maxBudget.toLocaleString('id-ID')}</span>
        </div>
        <input
          type="range" min={5000} max={50000} step={5000}
          value={maxBudget}
          onChange={e => setMaxBudget(Number(e.target.value))}
          className="w-full accent-[#2D6A4F]"
        />
        <div className="flex justify-between text-xs text-[#9a9a8a] mt-1">
          <span>Rp 5.000</span><span>Rp 50.000</span>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(c)}
            className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap border font-medium transition-all ${
              category === c
                ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]'
                : 'bg-white text-[#4a4a3a] border-[#e8e4db] hover:bg-[#f0faf4]'
            }`}>
            {c}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="border border-[#e8e4db] rounded-2xl overflow-hidden animate-pulse">
              <div className="w-full h-28 bg-[#f0ece4]" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-[#f0ece4] rounded w-3/4" />
                <div className="h-3 bg-[#f0ece4] rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-4xl mb-2">🍽️</p>
          <p className="text-sm font-medium text-[#4a4a3a]">Belum ada resep</p>
          <p className="text-xs text-[#9a9a8a] mt-1">Coba ubah filter budget atau kategori</p>
          {user && (
            <button onClick={() => setShowForm(true)}
              className="mt-3 text-xs text-[#2D6A4F] font-semibold underline">
              + Tambah resep pertama
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {recipes.map(r => (
            <div key={r.id} onClick={() => setSelected(r)}
              className="border border-[#e8e4db] rounded-2xl overflow-hidden cursor-pointer hover:shadow-md hover:border-[#b7e4cc] transition-all bg-white group">
              <div className="w-full h-28 bg-gradient-to-br from-[#f0faf4] to-[#e8f7ef] flex items-center justify-center group-hover:from-[#e8f7ef] transition-all">
                <span className="text-4xl">🥘</span>
              </div>
              <div className="p-3">
                <p className="text-xs font-semibold text-[#1a3a2a] line-clamp-2 leading-tight mb-1">{r.title}</p>
                <p className="text-xs font-bold text-[#2D6A4F]">Rp {r.budget_per_portion?.toLocaleString('id-ID')}/porsi</p>
                <p className="text-xs text-[#9a9a8a] mt-1">{r.nutrition?.kalori} kkal · {r.nutrition?.protein}g protein</p>
                <span className="inline-block mt-2 text-xs bg-[#f0faf4] text-[#2D6A4F] px-2 py-0.5 rounded-full border border-[#b7e4cc]">{r.category}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Form Tambah Resep ───────────────────────────────────────
function TambahResepForm({ onBack, onSuccess }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', budget_per_portion: '', category: 'Umum',
    kalori: '', protein: '', zat_besi: '',
    bahan: [{ nama: '', jumlah: '', satuan: '', harga_estimasi: '' }],
    langkah: [{ instruksi: '' }],
  })

  function updateBahan(idx, field, val) {
    const arr = [...form.bahan]
    arr[idx][field] = val
    setForm(f => ({ ...f, bahan: arr }))
  }

  function updateLangkah(idx, val) {
    const arr = [...form.langkah]
    arr[idx].instruksi = val
    setForm(f => ({ ...f, langkah: arr }))
  }

  async function handleSubmit() {
    if (!form.title || !form.budget_per_portion) return

    setLoading(true)

    const { error } = await supabase.from('recipes').insert({
      title: form.title,
      description: form.description,
      budget_per_portion: parseInt(form.budget_per_portion),
      category: form.category,
      is_verified: true,
      author_id: user?.id,
      nutrition: {
        kalori: parseInt(form.kalori) || 0,
        protein: parseInt(form.protein) || 0,
        zat_besi: parseFloat(form.zat_besi) || 0
      },
      ingredients: form.bahan.filter(b => b.nama).map(b => ({
        nama: b.nama,
        jumlah: b.jumlah,
        satuan: b.satuan,
        harga_estimasi: parseInt(b.harga_estimasi) || 0
      })),
      steps: form.langkah.filter(l => l.instruksi).map((l, i) => ({
        urutan: i + 1,
        instruksi: l.instruksi
      })),
    })

    if (!error) {
      await tambahPoin(
        user.id,
        'upload_recipe',
        `Upload resep: ${form.title}`
      )

      setLoading(false)

      if (onSuccess) {
        onSuccess()
      }

      return
    }

    setLoading(false)
  }

  const inputClass = "w-full px-3 py-2.5 rounded-xl border border-[#e8e4db] bg-[#faf9f7] text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] transition-all"

  return (
    <div>
      <button onClick={onBack} className="text-sm text-[#2D6A4F] font-medium mb-4">← Kembali</button>
      <h2 className="text-base font-bold text-[#1a3a2a] mb-4">Tambah Resep Baru</h2>
      <div className="space-y-4">

        <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))}
          placeholder="Nama resep *" className={inputClass} />

        <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))}
          placeholder="Deskripsi singkat" rows={2} className={inputClass + ' resize-none'} />

        <div className="grid grid-cols-2 gap-3">
          <input type="number" value={form.budget_per_portion}
            onChange={e => setForm(f => ({...f, budget_per_portion: e.target.value}))}
            placeholder="Budget/porsi (Rp) *" className={inputClass} />
          <select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))} className={inputClass}>
            {['MPASI','Balita','Umum','Ibu Hamil','Lansia'].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <p className="text-xs font-medium text-[#4a4a3a] mb-2">Kandungan Gizi</p>
          <div className="grid grid-cols-3 gap-2">
            <input type="number" value={form.kalori} onChange={e => setForm(f => ({...f, kalori: e.target.value}))}
              placeholder="Kalori" className={inputClass} />
            <input type="number" value={form.protein} onChange={e => setForm(f => ({...f, protein: e.target.value}))}
              placeholder="Protein (g)" className={inputClass} />
            <input type="number" value={form.zat_besi} onChange={e => setForm(f => ({...f, zat_besi: e.target.value}))}
              placeholder="Zat Besi (mg)" className={inputClass} />
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-[#1a3a2a] mb-2">🥘 Bahan-bahan</p>
          {form.bahan.map((b, i) => (
            <div key={i} className="grid grid-cols-4 gap-2 mb-2">
              <input value={b.nama} onChange={e => updateBahan(i, 'nama', e.target.value)}
                placeholder="Bahan" className={inputClass + ' col-span-2'} />
              <input value={b.jumlah} onChange={e => updateBahan(i, 'jumlah', e.target.value)}
                placeholder="Jml" className={inputClass} />
              <input value={b.satuan} onChange={e => updateBahan(i, 'satuan', e.target.value)}
                placeholder="Satuan" className={inputClass} />
            </div>
          ))}
          <button type="button"
            onClick={() => setForm(f => ({...f, bahan: [...f.bahan, {nama:'',jumlah:'',satuan:'',harga_estimasi:''}]}))}
            className="text-xs text-[#2D6A4F] font-medium">
            + Tambah bahan
          </button>
        </div>

        <div>
          <p className="text-xs font-semibold text-[#1a3a2a] mb-2">📝 Langkah Memasak</p>
          {form.langkah.map((l, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-[#2D6A4F] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-2">
                {i+1}
              </div>
              <textarea value={l.instruksi} onChange={e => updateLangkah(i, e.target.value)}
                placeholder={`Langkah ${i+1}`} rows={2}
                className={inputClass + ' resize-none flex-1'} />
            </div>
          ))}
          <button type="button"
            onClick={() => setForm(f => ({...f, langkah: [...f.langkah, {instruksi:''}]}))}
            className="text-xs text-[#2D6A4F] font-medium">
            + Tambah langkah
          </button>
        </div>

        <button onClick={handleSubmit}
          disabled={loading || !form.title || !form.budget_per_portion}
          className="w-full bg-[#2D6A4F] hover:bg-[#235c43] text-white py-3.5 rounded-2xl text-sm font-semibold disabled:opacity-40 shadow-md shadow-[#2D6A4F]/20 transition-all">
          {loading ? 'Menyimpan...' : '✅ Simpan Resep'}
        </button>
      </div>
    </div>
  )
}

// ─── Detail Resep ────────────────────────────────────────────
function RecipeDetail({ recipe, onBack }) {
  const [author, setAuthor] = useState(null)

  useEffect(() => {
    if (recipe.author_id) {
      supabase.from('profiles').select('nama')
        .eq('id', recipe.author_id).single()
        .then(({ data }) => setAuthor(data))
    }
  }, [])

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-[#2D6A4F] font-medium mb-4">
        ← Kembali ke Resep
      </button>

      <div className="w-full h-40 bg-gradient-to-br from-[#f0faf4] to-[#e8f7ef] rounded-2xl flex items-center justify-center mb-4">
        <span className="text-6xl">🥘</span>
      </div>

      <h2 className="text-base font-bold text-[#1a3a2a] mb-1">{recipe.title}</h2>

      {author && (
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-[#2D6A4F] flex items-center justify-center text-white text-xs font-bold">
            {author.nama?.[0]?.toUpperCase()}
          </div>
          <p className="text-xs text-[#7a8a7a]">
            Dibagikan oleh <span className="font-semibold text-[#2D6A4F]">{author.nama}</span>
          </p>
        </div>
      )}

      <p className="text-xs text-[#7a8a7a] mb-4 leading-relaxed">{recipe.description}</p>

      {/* Nutrition */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        {[
          { label: 'Budget', val: `Rp ${recipe.budget_per_portion?.toLocaleString('id-ID')}`, bg: 'bg-[#f0faf4]', text: 'text-[#2D6A4F]' },
          { label: 'Kalori', val: `${recipe.nutrition?.kalori}`, bg: 'bg-orange-50', text: 'text-orange-500' },
          { label: 'Protein', val: `${recipe.nutrition?.protein}g`, bg: 'bg-[#f0faf4]', text: 'text-[#2D6A4F]' },
          { label: 'Zat Besi', val: `${recipe.nutrition?.zat_besi}mg`, bg: 'bg-red-50', text: 'text-red-500' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-2 text-center`}>
            <p className="text-xs text-[#9a9a8a]">{s.label}</p>
            <p className={`text-xs font-bold ${s.text} mt-0.5`}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Bahan */}
      <h3 className="text-sm font-bold text-[#1a3a2a] mb-2">🥘 Bahan-bahan</h3>
      <div className="border border-[#e8e4db] rounded-2xl overflow-hidden mb-5">
        {recipe.ingredients?.map((ing, i) => (
          <div key={i} className={`flex justify-between text-xs px-4 py-2.5 ${i % 2 === 0 ? 'bg-[#faf9f7]' : 'bg-white'}`}>
            <span className="text-[#4a4a3a]">{ing.nama} — {ing.jumlah} {ing.satuan}</span>
            <span className="text-[#9a9a8a]">±Rp {Number(ing.harga_estimasi || 0).toLocaleString('id-ID')}</span>
          </div>
        ))}
      </div>

      {/* Langkah */}
      <h3 className="text-sm font-bold text-[#1a3a2a] mb-3">📝 Cara Memasak</h3>
      <div className="space-y-3 pb-4">
        {recipe.steps?.map(step => (
          <div key={step.urutan} className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-[#2D6A4F] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
              {step.urutan}
            </div>
            <p className="text-sm text-[#4a4a3a] leading-relaxed">{step.instruksi}</p>
          </div>
        ))}
      </div>
    </div>
  )
}