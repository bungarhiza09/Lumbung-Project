import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const CATEGORIES = ['Semua', 'MPASI', 'Balita', 'Umum', 'Ibu Hamil', 'Lansia']

export default function ResepPage() {
  const [recipes, setRecipes] = useState([])
  const [category, setCategory] = useState('Semua')
  const [maxBudget, setMaxBudget] = useState(50000)
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecipes()
  }, [category, maxBudget])

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

  if (selected) return <RecipeDetail recipe={selected} onBack={() => setSelected(null)} />

  return (
    <div>
      {/* Info */}
      <div className="bg-[#f0faf4] rounded-2xl p-3 mb-4 border border-[#b7e4cc]">
        <p className="text-xs font-semibold text-[#2D6A4F] mb-0.5">📖 Resep Lokal Bergizi</p>
        <p className="text-xs text-[#5a7a6a]">
          Resep berbahan lokal Indonesia yang murah, bergizi, dan mudah dibuat. Filter sesuai budget dan kebutuhanmu.
        </p>
      </div>

      {/* Budget Slider */}
      <div className="bg-white rounded-2xl border border-[#e8e4db] p-3 mb-4">
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
          <span>Rp 5.000</span>
          <span>Rp 50.000</span>
        </div>
      </div>

      {/* Category */}
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
                <p className="text-xs font-semibold text-[#1a3a2a] line-clamp-2 leading-tight mb-1">
                  {r.title}
                </p>
                <p className="text-xs font-bold text-[#2D6A4F]">
                  Rp {r.budget_per_portion?.toLocaleString('id-ID')}/porsi
                </p>
                <p className="text-xs text-[#9a9a8a] mt-1">
                  {r.nutrition?.kalori} kkal · {r.nutrition?.protein}g protein
                </p>
                <span className="inline-block mt-2 text-xs bg-[#f0faf4] text-[#2D6A4F] px-2 py-0.5 rounded-full border border-[#b7e4cc]">
                  {r.category}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function RecipeDetail({ recipe, onBack }) {
  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-[#2D6A4F] font-medium mb-4">
        ← Kembali ke Resep
      </button>

      <div className="w-full h-40 bg-gradient-to-br from-[#f0faf4] to-[#e8f7ef] rounded-2xl flex items-center justify-center mb-4">
        <span className="text-6xl">🥘</span>
      </div>

      <h2 className="text-base font-bold text-[#1a3a2a] mb-1">{recipe.title}</h2>
      <p className="text-xs text-[#7a8a7a] mb-4 leading-relaxed">{recipe.description}</p>

      {/* Nutrition */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        {[
          { label: 'Budget', val: `Rp ${recipe.budget_per_portion?.toLocaleString('id-ID')}`, bg: 'bg-[#f0faf4]', text: 'text-[#2D6A4F]' },
          { label: 'Kalori', val: `${recipe.nutrition?.kalori}`, bg: 'bg-orange-50', text: 'text-orange-600' },
          { label: 'Protein', val: `${recipe.nutrition?.protein}g`, bg: 'bg-blue-50', text: 'text-blue-600' },
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
            <span className="text-[#9a9a8a]">±Rp {Number(ing.harga_estimasi).toLocaleString('id-ID')}</span>
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