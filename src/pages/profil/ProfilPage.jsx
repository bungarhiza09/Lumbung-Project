import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/Layout'

const ROLE_LABEL = {
  keluarga: { label: 'Keluarga', icon: '👩‍👧' },
  warung:   { label: 'Warung / Restoran', icon: '🍜' },
  kader:    { label: 'Kader Posyandu', icon: '👶' },
}

const BADGE_CONFIG = [
  { slug: 'lumbung-master', icon: '🏆', label: 'Lumbung Master', min: 2000 },
  { slug: 'petani-aktif',   icon: '🌾', label: 'Petani Aktif',   min: 500 },
  { slug: 'penabur-benih',  icon: '🌱', label: 'Penabur Benih',  min: 0 },
]

function getBadge(poin) {
  return BADGE_CONFIG.find(b => (poin || 0) >= b.min) || BADGE_CONFIG[2]
}

export default function ProfilPage() {
  const { user, profile, setProfile } = useAuth()
  const navigate = useNavigate()
  const fileRef = useRef()

  const [editing, setEditing]           = useState(false)
  const [saving, setSaving]             = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [toast, setToast]               = useState('')
  const [stats, setStats]               = useState({ donasi: 0, porsi: 0, forum: 0, resep: 0 })

  const [form, setForm] = useState({
    nama: '', no_hp: '', kota: '',
    provinsi: '', kabupaten: '', kecamatan: '', bio: '',
  })

  // Sync form saat profile loaded
  useEffect(() => {
    if (profile) {
      setForm({
        nama:       profile.nama      || '',
        no_hp:      profile.no_hp     || '',
        kota:       profile.kota      || '',
        provinsi:   profile.provinsi  || '',
        kabupaten:  profile.kabupaten || '',
        kecamatan:  profile.kecamatan || '',
        bio:        profile.bio       || '',
      })
      fetchStats()
    }
  }, [profile])

  async function fetchStats() {
    if (!user) return
    const [donasiRes, forumRes, resepRes] = await Promise.all([
      supabase.from('donasi').select('jumlah_porsi').eq('donor_id', user.id),
      supabase.from('forum_posts').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('recipes').select('id', { count: 'exact', head: true }).eq('author_id', user.id),
    ])
    const totalPorsi = donasiRes.data?.reduce((s, d) => s + (d.jumlah_porsi || 0), 0) || 0
    setStats({
      donasi: donasiRes.data?.length || 0,
      porsi:  totalPorsi,
      forum:  forumRes.count  || 0,
      resep:  resepRes.count  || 0,
    })
  }

  async function refreshProfile() {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (data) setProfile(data)
  }

  async function handleUploadPhoto(e) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploadingPhoto(true)

    const ext  = file.name.split('.').pop()
    const path = `avatars/${user.id}.${ext}`

    const { error: upErr } = await supabase.storage
      .from('foto-profil')
      .upload(path, file, { upsert: true })

    if (upErr) {
      showToast('❌ Gagal upload foto: ' + upErr.message)
      setUploadingPhoto(false)
      return
    }

    const { data: urlData } = supabase.storage.from('foto-profil').getPublicUrl(path)
    const avatarUrl = urlData.publicUrl + '?t=' + Date.now()

    await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', user.id)
    await refreshProfile()
    showToast('✅ Foto profil berhasil diperbarui!')
    setUploadingPhoto(false)
  }

  async function handleSave() {
    if (!form.nama.trim()) return
    setSaving(true)

    const { error } = await supabase.from('profiles')
      .update({
        nama:       form.nama.trim(),
        no_hp:      form.no_hp.trim(),
        kota:       form.kota.trim(),
        provinsi:   form.provinsi.trim(),
        kabupaten:  form.kabupaten.trim(),
        kecamatan:  form.kecamatan.trim(),
        bio:        form.bio.trim(),
      })
      .eq('id', user.id)

    if (error) {
      showToast('❌ Gagal menyimpan: ' + error.message)
    } else {
      await refreshProfile()
      setEditing(false)
      showToast('✅ Profil berhasil diperbarui!')
    }
    setSaving(false)
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const badge    = getBadge(profile?.poin)
  const role     = ROLE_LABEL[profile?.role] || ROLE_LABEL.keluarga
  const joinDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
    : '-'

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-[#e8e4db] bg-[#faf9f7] text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] transition-all"
  const labelCls = "block text-xs font-semibold text-[#4a4a3a] mb-1.5"

  return (
    <Layout>
      <div className="w-full px-4">

        {/* Toast */}
        {toast && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#1a3a2a] text-white text-sm px-5 py-3 rounded-2xl shadow-xl transition-all">
            {toast}
          </div>
        )}

        {/* ── HERO ── */}
        <div className="relative bg-gradient-to-br from-[#1a3a2a] to-[#2D6A4F] rounded-3xl p-6 mb-4 overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
          <div className="absolute -bottom-8 left-6 w-28 h-28 rounded-full bg-white/5" />

          <div className="relative flex gap-4 items-start">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-white/20 border-2 border-white/30 overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-3xl font-bold">
                    {profile?.nama?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute -bottom-2 -right-2 w-7 h-7 bg-white rounded-full shadow-lg flex items-center justify-center border border-[#e8e4db] hover:bg-[#f0faf4] transition-all"
              >
                {uploadingPhoto
                  ? <div className="w-3 h-3 border-2 border-[#2D6A4F]/30 border-t-[#2D6A4F] rounded-full animate-spin" />
                  : <span className="text-xs">📷</span>
                }
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUploadPhoto} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-white truncate">{profile?.nama}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs bg-white/20 text-white px-2.5 py-0.5 rounded-full font-medium">
                  {role.icon} {role.label}
                </span>
                {profile?.kota && (
                  <span className="text-xs text-white/60">📍 {profile.kota}</span>
                )}
              </div>
              {profile?.bio ? (
                <p className="text-xs text-white/70 mt-2 leading-relaxed line-clamp-2">{profile.bio}</p>
              ) : (
                <p className="text-xs text-white/40 mt-2 italic">Belum ada bio</p>
              )}
              <p className="text-xs text-white/40 mt-1">Bergabung {joinDate}</p>
            </div>
          </div>

          {/* Poin & Badge */}
          <div className="relative mt-4 bg-white/10 backdrop-blur rounded-2xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{badge.icon}</span>
              <div>
                <p className="text-xs text-white/60">Level</p>
                <p className="text-sm font-bold text-white">{badge.label}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/60">Total Poin</p>
              <p className="text-xl font-bold text-white">⭐ {(profile?.poin || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* ── STATISTIK ── */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { icon: '🍱', label: 'Donasi',    val: stats.donasi },
            { icon: '🥘', label: 'Porsi',     val: stats.porsi  },
            { icon: '💬', label: 'Diskusi',   val: stats.forum  },
            { icon: '📖', label: 'Resep',     val: stats.resep  },
          ].map(s => (
            <div key={s.label} className="bg-white border border-[#e8e4db] rounded-2xl p-3 text-center">
              <p className="text-xl">{s.icon}</p>
              <p className="text-base font-bold text-[#1a3a2a]">{s.val}</p>
              <p className="text-[10px] text-[#9a9a8a] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── INFO / EDIT ── */}
        <div className="bg-white border border-[#e8e4db] rounded-3xl overflow-hidden mb-4">
          {/* Header section */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0ece4]">
            <p className="text-sm font-bold text-[#1a3a2a]">Informasi Pribadi</p>
            {!editing ? (
              <button onClick={() => setEditing(true)}
                className="text-xs text-[#2D6A4F] font-semibold bg-[#f0faf4] border border-[#b7e4cc] px-3 py-1.5 rounded-full hover:bg-[#e0f4ea] transition-all">
                ✏️ Edit Profil
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => { setEditing(false); setForm({ nama: profile?.nama||'', no_hp: profile?.no_hp||'', kota: profile?.kota||'', provinsi: profile?.provinsi||'', kabupaten: profile?.kabupaten||'', kecamatan: profile?.kecamatan||'', bio: profile?.bio||'' }) }}
                  className="text-xs text-[#9a9a8a] px-3 py-1.5 rounded-full border border-[#e8e4db] hover:bg-[#f5f3ee] transition-all">
                  Batal
                </button>
                <button onClick={handleSave} disabled={saving || !form.nama.trim()}
                  className="text-xs text-white bg-[#2D6A4F] px-3 py-1.5 rounded-full font-semibold disabled:opacity-50 hover:bg-[#235c43] transition-all">
                  {saving ? 'Menyimpan...' : '✅ Simpan'}
                </button>
              </div>
            )}
          </div>

          <div className="p-5">
            {!editing ? (
              // ── VIEW MODE ──
              <div className="space-y-1">
                {[
                  { icon: '👤', label: 'Nama Lengkap', val: profile?.nama },
                  { icon: '📱', label: 'No. HP',       val: profile?.no_hp    || '—' },
                  { icon: '🏙️', label: 'Kota',         val: profile?.kota     || '—' },
                  { icon: '🗺️', label: 'Provinsi',     val: profile?.provinsi || '—' },
                  { icon: '📍', label: 'Kabupaten',    val: profile?.kabupaten|| '—' },
                  { icon: '🏘️', label: 'Kecamatan',   val: profile?.kecamatan|| '—' },
                ].map((item, i, arr) => (
                  <div key={item.label}
                    className={`flex items-start gap-3 py-3 ${i < arr.length - 1 ? 'border-b border-[#f5f3ee]' : ''}`}>
                    <span className="text-base w-5 flex-shrink-0 mt-0.5">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#9a9a8a]">{item.label}</p>
                      <p className="text-sm font-medium text-[#1a3a2a] mt-0.5 break-words">{item.val}</p>
                    </div>
                  </div>
                ))}

                {/* Bio */}
                <div className="pt-3 border-t border-[#f5f3ee]">
                  <p className="text-xs text-[#9a9a8a] mb-1.5">✍️ Bio</p>
                  {profile?.bio
                    ? <p className="text-sm text-[#4a4a3a] leading-relaxed">{profile.bio}</p>
                    : <p className="text-sm text-[#c0bdb4] italic">Belum ada bio. Tap "Edit Profil" untuk tambahkan.</p>
                  }
                </div>
              </div>
            ) : (
              // ── EDIT MODE ──
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Nama Lengkap *</label>
                  <input value={form.nama}
                    onChange={e => setForm(f => ({...f, nama: e.target.value}))}
                    placeholder="Nama lengkap" className={inputCls} />
                </div>

                <div>
                  <label className={labelCls}>No. HP</label>
                  <input value={form.no_hp} type="tel"
                    onChange={e => setForm(f => ({...f, no_hp: e.target.value}))}
                    placeholder="08xxxxxxxxxx" className={inputCls} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Kota</label>
                    <input value={form.kota}
                      onChange={e => setForm(f => ({...f, kota: e.target.value}))}
                      placeholder="Medan" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Provinsi</label>
                    <input value={form.provinsi}
                      onChange={e => setForm(f => ({...f, provinsi: e.target.value}))}
                      placeholder="Sumatera Utara" className={inputCls} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Kabupaten</label>
                    <input value={form.kabupaten}
                      onChange={e => setForm(f => ({...f, kabupaten: e.target.value}))}
                      placeholder="Medan Barat" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Kecamatan</label>
                    <input value={form.kecamatan}
                      onChange={e => setForm(f => ({...f, kecamatan: e.target.value}))}
                      placeholder="Sei Agul" className={inputCls} />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Bio</label>
                  <textarea value={form.bio} rows={3}
                    onChange={e => setForm(f => ({...f, bio: e.target.value}))}
                    placeholder="Ceritakan sedikit tentang dirimu..."
                    className={inputCls + ' resize-none'} />
                  <p className="text-xs text-[#9a9a8a] mt-1">{form.bio.length}/200 karakter</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── QUICK LINKS ── */}
        <div className="bg-white border border-[#e8e4db] rounded-3xl overflow-hidden">
          <p className="text-xs font-bold text-[#9a9a8a] px-5 pt-4 pb-1 tracking-wider">MENU LAINNYA</p>
          {[
            { icon: '🏆', label: 'Poin & Reward',         sub: `${(profile?.poin||0).toLocaleString()} poin terkumpul`, path: '/gamifikasi' },
            { icon: '📚', label: 'Lumbung Pengetahuan',   sub: 'Resep, video, forum, kuis',                             path: '/pengetahuan' },
            { icon: '🍱', label: 'Food Rescue',           sub: 'Lihat donasi makanan terdekat',                          path: '/food-rescue' },
          ].map((item, i) => (
            <button key={item.path} onClick={() => navigate(item.path)}
              className="w-full flex items-center gap-3 px-5 py-4 hover:bg-[#f5f3ee] transition-all border-t border-[#f5f3ee]">
              <div className="w-9 h-9 rounded-xl bg-[#f0faf4] flex items-center justify-center text-lg flex-shrink-0">
                {item.icon}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-[#1a3a2a]">{item.label}</p>
                <p className="text-xs text-[#9a9a8a]">{item.sub}</p>
              </div>
              <span className="text-[#c0bdb4]">›</span>
            </button>
          ))}
        </div>

      </div>
    </Layout>
  )
}