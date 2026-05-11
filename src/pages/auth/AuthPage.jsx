import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import LocationPicker from '../../components/LocationPicker'

const ROLES = [
  {
    id: 'keluarga',
    icon: '👨‍👩‍👧',
    label: 'Keluarga',
    desc: 'Pantau gizi & terima donasi makanan'
  },
  {
    id: 'warung',
    icon: '🍜',
    label: 'Warung / Restoran',
    desc: 'Donasikan surplus makanan harian'
  },
  {
    id: 'kader',
    icon: '👩‍⚕️',
    label: 'Kader Posyandu',
    desc: 'Pantau gizi balita di wilayahmu'
  }
]

const KOTA_LIST = [
  'Medan', 'Jakarta', 'Bandung', 'Surabaya', 'Yogyakarta',
  'Semarang', 'Makassar', 'Palembang', 'Denpasar', 'Balikpapan'
]

export default function AuthPage() {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [step, setStep] = useState(1) // register: step 1 = form, step 2 = pilih role
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    email: '',
    password: '',
    nama: '',
    role: '',
    no_hp: ''
  })

  const [lokasi, setLokasi] = useState({
    provinsi: '',
    kabupaten: '',
    kota: '',
    alamat: ''
  })

  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  function selectRole(roleId) {
    setForm(f => ({ ...f, role: roleId }))
  }

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await signIn({ email: form.email, password: form.password })
    if (error) {
      setError('Email atau password salah. Coba lagi.')
    } else {
      navigate('/dashboard')
    }
    setLoading(false)
  }

  async function handleRegisterStep1(e) {
    e.preventDefault()
    if (!form.nama || !form.email || !form.password) {
      setError('Semua field wajib diisi.')
      return
    }
    if (form.password.length < 6) {
      setError('Password minimal 6 karakter.')
      return
    }
    if (!lokasi.kabupaten) {
      setError('Pilih lokasi minimal sampai kabupaten/kota.')
      return
    }
    setStep(2)
    setError('')
  }

  async function handleRegisterStep2(e) {
    e.preventDefault()
    if (!form.role) {
      setError('Pilih salah satu peran terlebih dahulu.')
      return
    }
    if (!lokasi.kabupaten) {
      setError('Pilih lokasi minimal sampai kabupaten/kota.')
      return
    }
    setLoading(true)
    setError('')
    const { error } = await signUp({
      email: form.email,
      password: form.password,
      nama: form.nama,
      role: form.role,
      kota: lokasi.kabupaten,      // ← simpan kabupaten sebagai kota
      provinsi: lokasi.provinsi,
      kabupaten: lokasi.kabupaten,
    })
    if (error) {
      setError(error.message)
    } else {
      setSuccess('Akun berhasil dibuat! Cek email kamu untuk verifikasi.')
      setTimeout(() => {
        setMode('login')
        setStep(1)
        setSuccess('')
      }, 3000)
    }
    setLoading(false)
  }

  function switchMode(newMode) {
    setMode(newMode)
    setStep(1)
    setError('')
    setSuccess('')
    setForm({ email: '', password: '', nama: '', kota: '', role: '' })
  }

  return (
    <div className="min-h-screen bg-[#f5f3ee] flex items-center justify-center p-4">

      {/* Background dekorasi */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-[#2D6A4F]/8" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-[#F4A261]/10" />
        <div className="absolute top-1/2 left-1/4 w-4 h-4 rounded-full bg-[#2D6A4F]/20" />
        <div className="absolute top-1/3 right-1/3 w-2 h-2 rounded-full bg-[#F4A261]/30" />
      </div>

      <div className="w-full max-w-md relative">

        {/* Logo & Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#2D6A4F] text-white text-3xl mb-4 shadow-lg">
            🌾
          </div>
          <h1 className="text-2xl font-bold text-[#1a3a2a] tracking-tight">LUMBUNG</h1>
          <p className="text-sm text-[#5a7a6a] mt-1">Dari surplus ke kebutuhan, dari lokal ke sehat</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-black/5 overflow-hidden border border-[#e8e4db]">

          {/* Tab Login / Daftar */}
          <div className="flex border-b border-[#f0ece4]">
            <button
              onClick={() => switchMode('login')}
              className={`flex-1 py-4 text-sm font-medium transition-all ${
                mode === 'login'
                  ? 'text-[#2D6A4F] border-b-2 border-[#2D6A4F] bg-[#f8fdf9]'
                  : 'text-[#9a9a8a] hover:text-[#2D6A4F]'
              }`}
            >
              Masuk
            </button>
            <button
              onClick={() => switchMode('register')}
              className={`flex-1 py-4 text-sm font-medium transition-all ${
                mode === 'register'
                  ? 'text-[#2D6A4F] border-b-2 border-[#2D6A4F] bg-[#f8fdf9]'
                  : 'text-[#9a9a8a] hover:text-[#2D6A4F]'
              }`}
            >
              Daftar
            </button>
          </div>

          <div className="p-7">

            {/* Error & Success */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-start gap-2">
                <span>⚠️</span> {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-100 text-green-700 text-sm flex items-start gap-2">
                <span>✅</span> {success}
              </div>
            )}

            {/* ===== FORM LOGIN ===== */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#4a4a3a] mb-1.5">Email</label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="nama@email.com"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-[#e8e4db] bg-[#faf9f7] text-sm text-[#1a1a1a] placeholder-[#bbb] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4a4a3a] mb-1.5">Password</label>
                  <input
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-[#e8e4db] bg-[#faf9f7] text-sm text-[#1a1a1a] placeholder-[#bbb] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-[#2D6A4F] hover:bg-[#235c43] active:scale-[0.98] text-white text-sm font-semibold transition-all shadow-md shadow-[#2D6A4F]/20 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Memproses...
                    </span>
                  ) : 'Masuk'}
                </button>
                <p className="text-center text-xs text-[#9a9a8a] mt-2">
                  Belum punya akun?{' '}
                  <button type="button" onClick={() => switchMode('register')} className="text-[#2D6A4F] font-medium hover:underline">
                    Daftar sekarang
                  </button>
                </p>
              </form>
            )}

            {/* ===== FORM REGISTER STEP 1 ===== */}
            {mode === 'register' && step === 1 && (
            <form onSubmit={handleRegisterStep1} className="space-y-4">

              {/* Nama */}
              <div>
                <label className="block text-xs font-medium text-[#4a4a3a] mb-1.5">
                  Nama Lengkap
                </label>
                <input
                  name="nama"
                  type="text"
                  value={form.nama}
                  onChange={handleChange}
                  placeholder="Masukkan nama kamu"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-[#e8e4db] bg-[#faf9f7] text-sm text-[#1a1a1a] placeholder-[#bbb] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] transition-all"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-[#4a4a3a] mb-1.5">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="nama@email.com"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-[#e8e4db] bg-[#faf9f7] text-sm text-[#1a1a1a] placeholder-[#bbb] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] transition-all"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-[#4a4a3a] mb-1.5">
                  Password
                </label>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Minimal 6 karakter"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-[#e8e4db] bg-[#faf9f7] text-sm text-[#1a1a1a] placeholder-[#bbb] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] transition-all"
                />
              </div>

              {/* Lokasi */}
              <div>
                <label className="block text-xs font-medium text-[#4a4a3a] mb-2">
                  📍 Lokasi Kamu
                </label>
                <LocationPicker onChange={setLokasi} />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-[#2D6A4F] hover:bg-[#235c43] text-white text-sm font-semibold transition-all shadow-md shadow-[#2D6A4F]/20 mt-2"
              >
                Lanjut →
              </button>
            </form>
          )}

            {/* ===== REGISTER STEP 2 — PILIH ROLE ===== */}
            {mode === 'register' && step === 2 && (
              <form onSubmit={handleRegisterStep2}>
                <p className="text-sm text-[#4a4a3a] font-medium mb-1">Kamu bergabung sebagai?</p>
                <p className="text-xs text-[#9a9a8a] mb-4">Pilih peran yang paling sesuai denganmu</p>

                <div className="space-y-3 mb-6">
                  {ROLES.map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => selectRole(r.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                        form.role === r.id
                          ? 'border-[#2D6A4F] bg-[#f0faf4] shadow-sm'
                          : 'border-[#e8e4db] bg-[#faf9f7] hover:border-[#c8e4d4]'
                      }`}
                    >
                      <span className="text-2xl w-10 h-10 flex items-center justify-center rounded-xl bg-white shadow-sm flex-shrink-0">
                        {r.icon}
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-[#1a3a2a]">{r.label}</div>
                        <div className="text-xs text-[#7a8a7a] mt-0.5">{r.desc}</div>
                      </div>
                      {form.role === r.id && (
                        <span className="ml-auto text-[#2D6A4F] text-lg flex-shrink-0">✓</span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-3.5 rounded-xl border border-[#e8e4db] text-[#4a4a3a] text-sm font-medium hover:bg-[#f5f3ee] transition-all"
                  >
                    ← Kembali
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !form.role}
                    className="flex-1 py-3.5 rounded-xl bg-[#2D6A4F] hover:bg-[#235c43] active:scale-[0.98] text-white text-sm font-semibold transition-all shadow-md shadow-[#2D6A4F]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Mendaftar...
                      </span>
                    ) : 'Daftar Sekarang'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[#9a9a8a] mt-6">
          Dengan mendaftar kamu menyetujui syarat & ketentuan LUMBUNG
        </p>
      </div>
    </div>
  )
}