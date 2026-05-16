import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Link } from 'react-router-dom'

export default function ProfilWarung({ profile, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    nama_warung: profile.nama_warung,
    deskripsi: profile.deskripsi || '',
    jam_buka: profile.jam_buka || '',
    jam_tutup: profile.jam_tutup || '',
    jenis_makanan: profile.jenis_makanan || '',
  })
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({ totalDonasi: 0, ratingAvg: 0, ratingCount: 0 })

  useEffect(() => { fetchStats() }, [profile.id, profile.user_id])

  async function fetchStats() {
    const { count: totalConfirmed } = await supabase
      .from('chat_rooms')
      .select('*', { count: 'exact', head: true })
      .eq('donor_id', profile.user_id)
      .eq('status', 'selesai')

    const { data: ratingData } = await supabase
      .from('warung_ratings')
      .select('nilai')
      .eq('warung_id', profile.id)

    const count = ratingData?.length || 0

    const avg = count > 0
      ? ratingData.reduce((sum, r) => sum + r.nilai, 0) / count
      : 0

    const total = totalConfirmed || 0

    await supabase.from('warung_profiles').update({
      total_donasi: total,
      rating_avg: parseFloat(avg.toFixed(2)),
      is_verified: total >= 20,
    }).eq('id', profile.id)

    setStats({
      totalDonasi: total,
      ratingAvg: avg,
      ratingCount: count
    })
  }

  async function handleSave() {
    setLoading(true)
    await supabase.from('warung_profiles').update(form).eq('id', profile.id)
    setLoading(false)
    setEditing(false)
    onUpdate()
  }

  const inputClass = "w-full px-3 py-2.5 rounded-xl border border-[#e8e4db] bg-[#faf9f7] text-sm focus:outline-none focus:ring-2 focus:ring-[#F4A261]/30 focus:border-[#F4A261]"
  const verifiedProgress = Math.min((stats.totalDonasi / 20) * 100, 100)
  const isVerified = stats.totalDonasi >= 20

  return (
    <div className="space-y-4">
      {/* Lumbung Verified Progress */}
      <div className={`rounded-2xl p-4 border ${isVerified ? 'bg-[#f0faf4] border-[#b7e4cc]' : 'bg-white border-[#e8e4db]'}`}>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">{isVerified ? '✅' : '🏅'}</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#1a3a2a]">
              {isVerified ? 'Lumbung Verified!' : 'Menuju Lumbung Verified'}
            </p>
            <p className="text-xs text-[#9a9a8a]">
              {isVerified ? 'Warungmu dipercaya komunitas LUMBUNG'
                : `Donasi ${Math.max(0, 20 - stats.totalDonasi)}x lagi untuk verified`}
            </p>
          </div>
          <span className="text-sm font-bold text-[#2D6A4F]">{stats.totalDonasi}/20</span>
        </div>
        <div className="bg-[#f0ece4] rounded-full h-2 overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-[#F4A261] to-[#2D6A4F] rounded-full transition-all"
            style={{ width: `${verifiedProgress}%` }} />
        </div>
      </div>

      {/* Statistik */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-[#e8e4db] p-3 text-center">
          <div className="text-xl mb-1">📤</div>
          <div className="text-sm font-bold text-[#F4A261]">{stats.totalDonasi}</div>
          <div className="text-xs text-[#9a9a8a] mt-0.5">Total Donasi</div>
        </div>
        <div className="bg-white rounded-2xl border border-[#e8e4db] p-3 text-center">
          <div className="text-xl mb-1">⭐</div>
          <div className="text-sm font-bold text-yellow-500">
            {stats.ratingCount > 0 ? stats.ratingAvg.toFixed(1) : '-'}
          </div>
          <div className="text-[10px] text-[#b0b0a0]">
            {stats.ratingCount > 0 ? `${stats.ratingCount} ulasan` : 'Belum ada'}
          </div>
          <div className="text-xs text-[#9a9a8a]">Rating</div>
        </div>
        <div className="bg-white rounded-2xl border border-[#e8e4db] p-3 text-center">
          <div className="text-xl mb-1">🏅</div>
          <div className="text-sm font-bold text-[#2D6A4F]">{isVerified ? 'Verified' : 'Reguler'}</div>
          <div className="text-xs text-[#9a9a8a] mt-0.5">Status</div>
        </div>
      </div>

      {/* Edit / Detail Profil */}
      <div className="bg-white rounded-2xl border border-[#e8e4db] p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-[#1a3a2a]">Detail Profil</p>
          <button onClick={() => setEditing(!editing)}
            className="text-xs text-[#F4A261] font-semibold border border-[#f9d4a7] px-3 py-1 rounded-full">
            {editing ? 'Batal' : '✏️ Edit'}
          </button>
        </div>
        {editing ? (
          <div className="space-y-3">
            <input value={form.nama_warung} onChange={e => setForm(f => ({...f, nama_warung: e.target.value}))}
              placeholder="Nama warung" className={inputClass} />
            <textarea value={form.deskripsi} onChange={e => setForm(f => ({...f, deskripsi: e.target.value}))}
              placeholder="Deskripsi warung" rows={2} className={inputClass + ' resize-none'} />
            <input value={form.jenis_makanan} onChange={e => setForm(f => ({...f, jenis_makanan: e.target.value}))}
              placeholder="Jenis makanan" className={inputClass} />
            <div className="grid grid-cols-2 gap-2">
              <input type="time" value={form.jam_buka} onChange={e => setForm(f => ({...f, jam_buka: e.target.value}))} className={inputClass} />
              <input type="time" value={form.jam_tutup} onChange={e => setForm(f => ({...f, jam_tutup: e.target.value}))} className={inputClass} />
            </div>
            <button onClick={handleSave} disabled={loading}
              className="w-full py-3 rounded-2xl bg-[#F4A261] text-white text-sm font-semibold disabled:opacity-50">
              {loading ? 'Menyimpan...' : '💾 Simpan Perubahan'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {[
              { label: 'Nama Warung', value: profile.nama_warung },
              { label: 'Jenis Makanan', value: profile.jenis_makanan || '-' },
              { label: 'Jam Operasional', value: `${profile.jam_buka || '-'} - ${profile.jam_tutup || '-'}` },
              { label: 'Deskripsi', value: profile.deskripsi || '-' },
            ].map(item => (
              <div key={item.label} className="flex justify-between text-xs py-2 border-b border-[#f0ece4] last:border-0">
                <span className="text-[#9a9a8a]">{item.label}</span>
                <span className="text-[#1a3a2a] font-medium text-right max-w-[60%]">{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ulasan Terbaru */}
      <UlasanTerbaru warungId={profile.id} />

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/donasi/buat"
          className="bg-[#fef3e7] border border-[#f9d4a7] rounded-2xl p-4 text-center hover:shadow-md transition-all">
          <div className="text-2xl mb-1">📤</div>
          <p className="text-xs font-semibold text-[#d4720a]">Posting Donasi</p>
        </Link>
        <Link to="/donasi/jadwal"
          className="bg-[#f0faf4] border border-[#b7e4cc] rounded-2xl p-4 text-center hover:shadow-md transition-all">
          <div className="text-2xl mb-1">⏰</div>
          <p className="text-xs font-semibold text-[#2D6A4F]">Jadwal Donasi</p>
        </Link>
      </div>
    </div>
  )
}

function UlasanTerbaru({ warungId }) {
  const [ulasan, setUlasan] = useState([])
  useEffect(() => {
    supabase
      .from('warung_ratings')
      .select('*, user:profiles!warung_ratings_user_id_fkey(nama, avatar_url)')
      .eq('warung_id', warungId)
      .order('created_at', { ascending: false })
      .limit(3)
      .then(({ data }) => setUlasan(data || []))
  }, [warungId])

  if (ulasan.length === 0) return null
  return (
    <div className="bg-white rounded-2xl border border-[#e8e4db] p-4">
      <p className="text-sm font-semibold text-[#1a3a2a] mb-3">⭐ Ulasan Penerima</p>
      <div className="space-y-3">
        {ulasan.map(u => (
          <div key={u.id} className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-full bg-[#2D6A4F] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
              {u.user?.avatar_url
                ? <img src={u.user.avatar_url} alt="" className="w-full h-full object-cover" />
                : u.user?.nama?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-[#1a3a2a]">{u.user?.nama || 'Anonim'}</p>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(s => (
                    <span key={s} className={`text-xs ${s <= u.rating ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                  ))}
                </div>
              </div>
              {u.komentar && <p className="text-xs text-[#7a8a7a] mt-0.5">{u.komentar}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
