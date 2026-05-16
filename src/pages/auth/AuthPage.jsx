import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import LocationPicker from '../../components/LocationPicker'

// ─── LANDING PAGE ────────────────────────────────────────────────
function LandingPage({ onLogin, onRegister }) {
  const FEATURES = [
    {
      icon: '🤖', title: 'AI Nutrisi Lokal',
      desc: 'Foto makananmu, AI langsung analisis kandungan gizi dan berikan rekomendasi menu harian sesuai budget keluargamu.'
    },
    {
      icon: '🍱', title: 'Food Rescue',
      desc: 'Hubungkan surplus makanan dari warung & restoran ke keluarga yang membutuhkan. Zero waste, maksimal manfaat.'
    },
    {
      icon: '📊', title: 'Pantau Gizi Anak',
      desc: 'Kader Posyandu bisa input & pantau data gizi balita. Deteksi stunting lebih awal dengan data yang akurat.'
    },
    {
      icon: '🏆', title: 'Sistem Poin & Reward',
      desc: 'Setiap aksi baik menghasilkan poin. Naik level dari Penabur Benih hingga Lumbung Master!'
    },
    {
      icon: '📚', title: 'Lumbung Pengetahuan',
      desc: 'Resep lokal bergizi, video edukasi ahli gizi, forum komunitas, dan kuis pengetahuan gizi — semua gratis.'
    },
    {
      icon: '🏪', title: 'Smart Warung',
      desc: 'Warung dan restoran bisa kelola donasi makanan, pantau dampak sosial, dan dapat sertifikat CSR digital.'
    },
  ]

  const STATS = [
    { val: '10.000+', label: 'Keluarga Terbantu' },
    { val: '50.000+', label: 'Porsi Diselamatkan' },
    { val: '500+',    label: 'Warung Mitra' },
    { val: '1.200+',  label: 'Kader Aktif' },
  ]

  const HOW = [
    { icon: '📱', step: '1', title: 'Daftar Gratis', desc: 'Buat akun dalam 2 menit. Pilih peranmu: Keluarga, Warung, atau Kader Posyandu.' },
    { icon: '🎯', step: '2', title: 'Gunakan Fitur', desc: 'Foto makanan untuk analisis gizi, cari donasi terdekat, atau input data balita.' },
    { icon: '🌾', step: '3', title: 'Beri Dampak', desc: 'Setiap aksimu berkontribusi mengurangi stunting dan food waste di Indonesia.' },
  ]

  const ROLES = [
    { icon: '👩‍👧', label: 'Keluarga', color: 'bg-blue-50 border-blue-200', text: 'text-blue-700', desc: 'Pantau gizi anak, terima donasi makanan, akses resep bergizi murah.' },
    { icon: '🍜', label: 'Warung / Restoran', color: 'bg-orange-50 border-orange-200', text: 'text-orange-700', desc: 'Donasikan surplus makanan, pantau dampak sosial, dapat sertifikat CSR.' },
    { icon: '👩‍⚕️', label: 'Kader Posyandu', color: 'bg-purple-50 border-purple-200', text: 'text-purple-700', desc: 'Input data balita, pantau peta gizi wilayah, akses kelas edukasi.' },
  ]

  return (
    <div className="min-h-screen bg-[#f5f3ee]">

      {/* ── NAVBAR LANDING ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur border-b border-[#e8e4db] h-14 flex items-center px-5 justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌾</span>
          <span className="font-bold text-[#1a3a2a] tracking-tight">LUMBUNG</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onLogin}
            className="text-sm font-medium text-[#2D6A4F] px-4 py-2 rounded-xl hover:bg-[#f0faf4] transition-all">
            Masuk
          </button>
          <button onClick={onRegister}
            className="text-sm font-semibold text-white bg-[#2D6A4F] px-4 py-2 rounded-xl hover:bg-[#235c43] transition-all shadow-md shadow-[#2D6A4F]/20">
            Daftar Gratis
          </button>
        </div>
      </nav>

      <div className="pt-14">

        {/* ── HERO ── */}
        <section className="relative bg-gradient-to-br from-[#1a3a2a] via-[#2D6A4F] to-[#3a8a66] px-5 py-16 text-center overflow-hidden">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-white/5" />
          <div className="absolute top-8 left-8 w-3 h-3 rounded-full bg-white/20" />
          <div className="absolute bottom-12 right-12 w-2 h-2 rounded-full bg-[#F4A261]/40" />

          <div className="relative max-w-lg mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/15 text-white/90 text-xs px-3 py-1.5 rounded-full mb-6 border border-white/20">
              🌱 Platform Gizi & Food Rescue Indonesia
            </div>
            <h1 className="text-3xl font-bold text-white leading-tight mb-4">
              Dari Surplus ke Kebutuhan,<br />
              <span className="text-[#95d5b2]">Dari Lokal ke Sehat</span>
            </h1>
            <p className="text-sm text-white/75 leading-relaxed mb-8 max-w-sm mx-auto">
              LUMBUNG menghubungkan keluarga Indonesia dengan gizi berkualitas. AI analisis nutrisi, food rescue real-time, dan pemantauan gizi balita — semua dalam satu platform.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button onClick={onRegister}
                className="bg-white text-[#2D6A4F] font-bold text-sm px-6 py-3 rounded-2xl hover:bg-[#f0faf4] transition-all shadow-lg">
                🚀 Mulai Gratis Sekarang
              </button>
              <button onClick={onLogin}
                className="bg-white/15 text-white font-medium text-sm px-6 py-3 rounded-2xl border border-white/30 hover:bg-white/25 transition-all">
                Sudah punya akun →
              </button>
            </div>
          </div>
        </section>

        {/* ── STATS ── */}
        <section className="bg-white border-b border-[#e8e4db] px-5 py-6">
          <div className="max-w-lg mx-auto grid grid-cols-4 gap-3">
            {STATS.map(s => (
              <div key={s.label} className="text-center">
                <p className="text-lg font-bold text-[#2D6A4F]">{s.val}</p>
                <p className="text-xs text-[#9a9a8a] mt-0.5 leading-tight">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── MASALAH YANG DISELESAIKAN ── */}
        <section className="px-5 py-10 max-w-lg mx-auto">
          <div className="text-center mb-6">
            <p className="text-xs font-semibold text-[#2D6A4F] tracking-wider mb-1">MASALAH YANG KAMI SELESAIKAN</p>
            <h2 className="text-xl font-bold text-[#1a3a2a]">Indonesia darurat stunting & food waste</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: '😢', val: '21,5%', label: 'Balita stunting di Indonesia', color: 'bg-red-50 border-red-100' },
              { icon: '🗑️', val: '48 juta', label: 'Ton makanan terbuang per tahun', color: 'bg-orange-50 border-orange-100' },
              { icon: '💸', val: '70%', label: 'Keluarga kesulitan beli makanan bergizi', color: 'bg-yellow-50 border-yellow-100' },
              { icon: '📉', val: '1 dari 5', label: 'Anak kekurangan gizi mikro', color: 'bg-red-50 border-red-100' },
            ].map(s => (
              <div key={s.label} className={`${s.color} border rounded-2xl p-4 text-center`}>
                <p className="text-2xl mb-1">{s.icon}</p>
                <p className="text-lg font-bold text-[#1a3a2a]">{s.val}</p>
                <p className="text-xs text-[#7a8a7a] leading-tight mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 bg-[#f0faf4] border border-[#b7e4cc] rounded-2xl p-4 text-center">
            <p className="text-sm text-[#2D6A4F] font-semibold">LUMBUNG hadir sebagai solusi nyata 🌾</p>
            <p className="text-xs text-[#5a7a6a] mt-1">Menghubungkan surplus dengan kebutuhan, teknologi dengan komunitas</p>
          </div>
        </section>

        {/* ── FITUR ── */}
        <section className="bg-white px-5 py-10 border-y border-[#e8e4db]">
          <div className="max-w-lg mx-auto">
            <div className="text-center mb-6">
              <p className="text-xs font-semibold text-[#2D6A4F] tracking-wider mb-1">FITUR UNGGULAN</p>
              <h2 className="text-xl font-bold text-[#1a3a2a]">Semua yang kamu butuhkan</h2>
              <p className="text-xs text-[#9a9a8a] mt-1">6 modul terintegrasi untuk gizi dan ketahanan pangan</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {FEATURES.map(f => (
                <div key={f.title}
                  className="border border-[#e8e4db] rounded-2xl p-4 hover:border-[#b7e4cc] hover:bg-[#fafdf9] transition-all">
                  <span className="text-2xl">{f.icon}</span>
                  <p className="text-sm font-semibold text-[#1a3a2a] mt-2 mb-1">{f.title}</p>
                  <p className="text-xs text-[#7a8a7a] leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CARA KERJA ── */}
        <section className="px-5 py-10 max-w-lg mx-auto">
          <div className="text-center mb-6">
            <p className="text-xs font-semibold text-[#2D6A4F] tracking-wider mb-1">CARA KERJA</p>
            <h2 className="text-xl font-bold text-[#1a3a2a]">Mudah dalam 3 langkah</h2>
          </div>
          <div className="space-y-4">
            {HOW.map((h, i) => (
              <div key={h.step} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-[#2D6A4F] text-white flex items-center justify-center font-bold text-sm">
                  {h.step}
                </div>
                <div className="flex-1 pb-4 border-b border-[#f0ece4] last:border-0">
                  <p className="text-sm font-semibold text-[#1a3a2a]">{h.icon} {h.title}</p>
                  <p className="text-xs text-[#7a8a7a] mt-1 leading-relaxed">{h.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── UNTUK SIAPA ── */}
        <section className="bg-white px-5 py-10 border-y border-[#e8e4db]">
          <div className="max-w-lg mx-auto">
            <div className="text-center mb-6">
              <p className="text-xs font-semibold text-[#2D6A4F] tracking-wider mb-1">UNTUK SIAPA</p>
              <h2 className="text-xl font-bold text-[#1a3a2a]">Bergabung sesuai peranmu</h2>
            </div>
            <div className="space-y-3">
              {ROLES.map(r => (
                <div key={r.label} className={`${r.color} border rounded-2xl p-4 flex items-start gap-3`}>
                  <span className="text-2xl flex-shrink-0">{r.icon}</span>
                  <div>
                    <p className={`text-sm font-bold ${r.text}`}>{r.label}</p>
                    <p className="text-xs text-[#5a5a4a] mt-0.5 leading-relaxed">{r.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA AKHIR ── */}
        <section className="px-5 py-12 text-center max-w-lg mx-auto">
          <span className="text-4xl">🌾</span>
          <h2 className="text-xl font-bold text-[#1a3a2a] mt-3 mb-2">
            Siap berkontribusi untuk Indonesia?
          </h2>
          <p className="text-sm text-[#7a8a7a] mb-6 leading-relaxed">
            Bergabung bersama ribuan keluarga, warung, dan kader yang sudah membuat perbedaan nyata.
          </p>
          <button onClick={onRegister}
            className="w-full bg-[#2D6A4F] text-white font-bold text-sm py-4 rounded-2xl hover:bg-[#235c43] transition-all shadow-lg shadow-[#2D6A4F]/25 mb-3">
            🚀 Daftar Gratis Sekarang
          </button>
          <button onClick={onLogin}
            className="w-full border border-[#e8e4db] text-[#4a4a3a] font-medium text-sm py-3.5 rounded-2xl hover:bg-[#f5f3ee] transition-all">
            Sudah punya akun? Masuk →
          </button>
          <p className="text-xs text-[#b0b0a0] mt-4">Gratis selamanya · Tanpa kartu kredit · Data aman</p>
        </section>

      </div>
    </div>
  )
}

// ─── KOMPONEN FORM AUTH ──────────────────────────────────────────
const ROLES_REGISTER = [
  { id: 'keluarga', icon: '👨‍👩‍👧', label: 'Keluarga', desc: 'Pantau gizi & terima donasi makanan' },
  { id: 'warung',   icon: '🍜',      label: 'Warung / Restoran', desc: 'Donasikan surplus makanan harian' },
  { id: 'kader',    icon: '👩‍⚕️',   label: 'Kader Posyandu', desc: 'Pantau gizi balita di wilayahmu' },
]

function AuthForm({ initialMode, onBack }) {
  const [mode, setMode]       = useState(initialMode) // 'login' | 'register'
  const [step, setStep]       = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({ email: '', password: '', nama: '', role: '', no_hp: '' })
  const [lokasi, setLokasi]   = useState({ provinsi: '', kabupaten: '', kota: '', alamat: '' })

  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  function switchMode(m) {
    setMode(m); setStep(1); setError(''); setSuccess('')
    setForm({ email: '', password: '', nama: '', role: '' })
  }

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await signIn({ email: form.email, password: form.password })
    if (error) setError('Email atau password salah.')
    else navigate('/dashboard')
    setLoading(false)
  }

  async function handleStep1(e) {
    e.preventDefault()
    if (!form.nama || !form.email || !form.password) return setError('Semua field wajib diisi.')
    if (form.password.length < 6) return setError('Password minimal 6 karakter.')
    if (!lokasi.kabupaten) return setError('Pilih lokasi minimal sampai kabupaten/kota.')
    setStep(2); setError('')
  }

  async function handleStep2(e) {
    e.preventDefault()
    if (!form.role) return setError('Pilih salah satu peran.')
    setLoading(true); setError('')
    const { error } = await signUp({
      email: form.email, password: form.password, nama: form.nama,
      role: form.role, kota: lokasi.kabupaten,
      provinsi: lokasi.provinsi, kabupaten: lokasi.kabupaten,
    })
    if (error) setError(error.message)
    else {
      setSuccess('Akun berhasil dibuat! Cek email untuk verifikasi.')
      setTimeout(() => { switchMode('login') }, 3000)
    }
    setLoading(false)
  }

  const inputCls = "w-full px-4 py-3 rounded-xl border border-[#e8e4db] bg-[#faf9f7] text-sm text-[#1a1a1a] placeholder-[#bbb] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] transition-all"
  const labelCls = "block text-xs font-medium text-[#4a4a3a] mb-1.5"

  return (
    <div className="min-h-screen bg-[#f5f3ee] flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Back to landing */}
        <button onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-[#2D6A4F] font-medium mb-4 hover:underline">
          ← Kembali
        </button>

        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#2D6A4F] text-white text-2xl mb-3 shadow-lg">🌾</div>
          <h1 className="text-xl font-bold text-[#1a3a2a]">LUMBUNG</h1>
          <p className="text-xs text-[#5a7a6a] mt-1">Dari surplus ke kebutuhan, dari lokal ke sehat</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-black/5 overflow-hidden border border-[#e8e4db]">
          {/* Tab */}
          <div className="flex border-b border-[#f0ece4]">
            {['login','register'].map(m => (
              <button key={m} onClick={() => switchMode(m)}
                className={`flex-1 py-4 text-sm font-medium transition-all ${
                  mode === m
                    ? 'text-[#2D6A4F] border-b-2 border-[#2D6A4F] bg-[#f8fdf9]'
                    : 'text-[#9a9a8a] hover:text-[#2D6A4F]'
                }`}>
                {m === 'login' ? 'Masuk' : 'Daftar'}
              </button>
            ))}
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex gap-2">
                ⚠️ {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-100 text-green-700 text-sm flex gap-2">
                ✅ {success}
              </div>
            )}

            {/* LOGIN */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className={labelCls}>Email</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange}
                    placeholder="nama@email.com" required className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Password</label>
                  <input name="password" type="password" value={form.password} onChange={handleChange}
                    placeholder="••••••••" required className={inputCls} />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-[#2D6A4F] hover:bg-[#235c43] text-white text-sm font-semibold transition-all shadow-md shadow-[#2D6A4F]/20 disabled:opacity-60">
                  {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Memproses...</span> : 'Masuk'}
                </button>
                <p className="text-center text-xs text-[#9a9a8a]">
                  Belum punya akun?{' '}
                  <button type="button" onClick={() => switchMode('register')} className="text-[#2D6A4F] font-medium hover:underline">Daftar sekarang</button>
                </p>
              </form>
            )}

            {/* REGISTER STEP 1 */}
            {mode === 'register' && step === 1 && (
              <form onSubmit={handleStep1} className="space-y-4">
                <div>
                  <label className={labelCls}>Nama Lengkap</label>
                  <input name="nama" type="text" value={form.nama} onChange={handleChange}
                    placeholder="Masukkan nama kamu" required className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Email</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange}
                    placeholder="nama@email.com" required className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Password</label>
                  <input name="password" type="password" value={form.password} onChange={handleChange}
                    placeholder="Minimal 6 karakter" required className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>📍 Lokasi Kamu</label>
                  <LocationPicker onChange={setLokasi} />
                </div>
                <button type="submit"
                  className="w-full py-3.5 rounded-xl bg-[#2D6A4F] hover:bg-[#235c43] text-white text-sm font-semibold transition-all shadow-md shadow-[#2D6A4F]/20">
                  Lanjut →
                </button>
              </form>
            )}

            {/* REGISTER STEP 2 */}
            {mode === 'register' && step === 2 && (
              <form onSubmit={handleStep2}>
                <p className="text-sm font-medium text-[#4a4a3a] mb-1">Kamu bergabung sebagai?</p>
                <p className="text-xs text-[#9a9a8a] mb-4">Pilih peran yang paling sesuai denganmu</p>
                <div className="space-y-3 mb-6">
                  {ROLES_REGISTER.map(r => (
                    <button key={r.id} type="button" onClick={() => setForm(f => ({...f, role: r.id}))}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                        form.role === r.id ? 'border-[#2D6A4F] bg-[#f0faf4]' : 'border-[#e8e4db] bg-[#faf9f7] hover:border-[#c8e4d4]'
                      }`}>
                      <span className="text-2xl w-10 h-10 flex items-center justify-center rounded-xl bg-white shadow-sm flex-shrink-0">{r.icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-[#1a3a2a]">{r.label}</p>
                        <p className="text-xs text-[#7a8a7a] mt-0.5">{r.desc}</p>
                      </div>
                      {form.role === r.id && <span className="ml-auto text-[#2D6A4F] text-lg">✓</span>}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)}
                    className="flex-1 py-3.5 rounded-xl border border-[#e8e4db] text-[#4a4a3a] text-sm font-medium hover:bg-[#f5f3ee] transition-all">
                    ← Kembali
                  </button>
                  <button type="submit" disabled={loading || !form.role}
                    className="flex-1 py-3.5 rounded-xl bg-[#2D6A4F] hover:bg-[#235c43] text-white text-sm font-semibold transition-all shadow-md disabled:opacity-50">
                    {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Mendaftar...</span> : 'Daftar Sekarang'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-[#9a9a8a] mt-4">
          Dengan mendaftar kamu menyetujui syarat & ketentuan LUMBUNG
        </p>
      </div>
    </div>
  )
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────
export default function AuthPage() {
  const [view, setView] = useState('landing') // 'landing' | 'login' | 'register'

  if (view === 'landing') {
    return (
      <LandingPage
        onLogin={() => setView('login')}
        onRegister={() => setView('register')}
      />
    )
  }

  return (
    <AuthForm
      initialMode={view}
      onBack={() => setView('landing')}
    />
  )
}