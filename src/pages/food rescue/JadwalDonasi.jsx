import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/Layout'

const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']

export default function JadwalDonasi() {
  const { user } = useAuth()
  const [jadwal, setJadwal] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    nama_makanan: '',
    jumlah_porsi: '',
    hari: [],
    jam: '14:00',
    aktif: true,
  })

  useEffect(() => { fetchJadwal() }, [])

  async function fetchJadwal() {
    const { data } = await supabase
      .from('jadwal_donasi')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setJadwal(data || [])
    setLoading(false)
  }

  function toggleHari(hari) {
    setForm(f => ({
      ...f,
      hari: f.hari.includes(hari)
        ? f.hari.filter(h => h !== hari)
        : [...f.hari, hari]
    }))
  }

  async function handleSimpan(e) {
    e.preventDefault()
    if (!form.nama_makanan || !form.jumlah_porsi || form.hari.length === 0) return

    await supabase.from('jadwal_donasi').insert({
      user_id: user.id,
      nama_makanan: form.nama_makanan,
      jumlah_porsi: parseInt(form.jumlah_porsi),
      hari: form.hari,
      jam: form.jam,
      aktif: true,
    })

    setForm({ nama_makanan: '', jumlah_porsi: '', hari: [], jam: '14:00', aktif: true })
    setShowForm(false)
    fetchJadwal()
  }

  async function toggleAktif(id, currentAktif) {
    await supabase.from('jadwal_donasi').update({ aktif: !currentAktif }).eq('id', id)
    fetchJadwal()
  }

  async function hapusJadwal(id) {
    if (!confirm('Hapus jadwal ini?')) return
    await supabase.from('jadwal_donasi').delete().eq('id', id)
    fetchJadwal()
  }

  return (
    <Layout>
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#1a3a2a]">⏰ Jadwal Donasi</h1>
          <p className="text-sm text-[#7a8a7a] mt-1">Set donasi otomatis berulang setiap minggu</p>
        </div>

        {/* Info */}
        <div className="bg-[#f0faf4] rounded-2xl p-4 mb-5 border border-[#b7e4cc]">
          <div className="flex items-start gap-3">
            <span className="text-xl">💡</span>
            <div>
              <p className="text-xs font-semibold text-[#2D6A4F] mb-1">Cara kerja jadwal donasi</p>
              <p className="text-xs text-[#5a7a6a] leading-relaxed">
                Set jadwal sekali, donasi akan otomatis muncul di Food Rescue sesuai hari dan jam yang kamu tentukan. Cocok untuk warung yang rutin punya sisa makanan.
              </p>
            </div>
          </div>
        </div>

        {/* Tombol Tambah */}
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full py-3.5 rounded-2xl bg-[#2D6A4F] hover:bg-[#235c43] text-white text-sm font-semibold mb-5 transition-all shadow-md shadow-[#2D6A4F]/20"
        >
          + Buat Jadwal Baru
        </button>

        {/* Form */}
        {showForm && (
          <form onSubmit={handleSimpan} className="bg-white rounded-2xl border border-[#e8e4db] p-4 mb-5 space-y-4">
            <p className="text-sm font-semibold text-[#1a3a2a]">Jadwal Donasi Baru</p>

            <div>
              <label className="block text-xs font-medium text-[#4a4a3a] mb-1.5">Nama Makanan</label>
              <input
                value={form.nama_makanan}
                onChange={e => setForm(f => ({ ...f, nama_makanan: e.target.value }))}
                placeholder="contoh: Nasi Padang sisa makan siang"
                required
                className="w-full px-4 py-3 rounded-xl border border-[#e8e4db] bg-[#faf9f7] text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#4a4a3a] mb-1.5">Estimasi Porsi</label>
              <input
                type="number" min="1"
                value={form.jumlah_porsi}
                onChange={e => setForm(f => ({ ...f, jumlah_porsi: e.target.value }))}
                placeholder="contoh: 10"
                required
                className="w-full px-4 py-3 rounded-xl border border-[#e8e4db] bg-[#faf9f7] text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#4a4a3a] mb-2">Hari</label>
              <div className="flex flex-wrap gap-2">
                {HARI.map(h => (
                  <button
                    key={h} type="button"
                    onClick={() => toggleHari(h)}
                    className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                      form.hari.includes(h)
                        ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]'
                        : 'bg-white text-[#4a4a3a] border-[#e8e4db] hover:bg-[#f0faf4]'
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#4a4a3a] mb-1.5">Jam Posting</label>
              <input
                type="time"
                value={form.jam}
                onChange={e => setForm(f => ({ ...f, jam: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-[#e8e4db] bg-[#faf9f7] text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F]"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)}
                className="flex-1 py-3 rounded-xl border border-[#e8e4db] text-[#4a4a3a] text-sm font-medium">
                Batal
              </button>
              <button type="submit"
                disabled={!form.nama_makanan || !form.jumlah_porsi || form.hari.length === 0}
                className="flex-1 py-3 rounded-xl bg-[#2D6A4F] text-white text-sm font-semibold disabled:opacity-50">
                Simpan Jadwal
              </button>
            </div>
          </form>
        )}

        {/* List Jadwal */}
        {loading ? (
          <div className="space-y-3">
            {[1,2].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-[#e8e4db] p-4 animate-pulse">
                <div className="h-4 bg-[#f0ece4] rounded w-1/2 mb-2" />
                <div className="h-3 bg-[#f0ece4] rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : jadwal.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-3xl border border-[#e8e4db]">
            <div className="text-4xl mb-3">⏰</div>
            <p className="text-sm font-medium text-[#4a4a3a]">Belum ada jadwal</p>
            <p className="text-xs text-[#9a9a8a] mt-1">Buat jadwal donasi rutin pertamamu!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {jadwal.map(item => (
              <div key={item.id} className={`bg-white rounded-2xl border overflow-hidden transition-all ${
                item.aktif ? 'border-[#b7e4cc]' : 'border-[#e8e4db] opacity-60'
              }`}>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-[#1a3a2a]">{item.nama_makanan}</p>
                      <p className="text-xs text-[#9a9a8a]">{item.jumlah_porsi} porsi · {item.jam} WIB</p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.aktif
                        ? 'bg-[#f0faf4] text-[#2D6A4F] border border-[#b7e4cc]'
                        : 'bg-[#f5f3ee] text-[#9a9a8a]'
                    }`}>
                      {item.aktif ? '● Aktif' : '○ Nonaktif'}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {item.hari?.map(h => (
                      <span key={h} className="text-xs bg-[#f0faf4] text-[#2D6A4F] px-2 py-0.5 rounded-full border border-[#b7e4cc]">
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex border-t border-[#f0ece4]">
                  <button
                    onClick={() => toggleAktif(item.id, item.aktif)}
                    className="flex-1 py-2.5 text-xs text-[#2D6A4F] hover:bg-[#f0faf4] transition-all font-medium"
                  >
                    {item.aktif ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                  <div className="w-px bg-[#f0ece4]" />
                  <button
                    onClick={() => hapusJadwal(item.id)}
                    className="flex-1 py-2.5 text-xs text-red-500 hover:bg-red-50 transition-all"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="h-6" />
      </div>
    </Layout>
  )
}