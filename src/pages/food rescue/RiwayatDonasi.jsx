import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/Layout'

const STATUS_CONFIG = {
  tersedia: { label: 'Tersedia', bg: 'bg-[#f0faf4]', text: 'text-[#2D6A4F]', border: 'border-[#b7e4cc]' },
  diambil: { label: 'Sudah Diambil', bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  kadaluarsa: { label: 'Kadaluarsa', bg: 'bg-red-50', text: 'text-red-500', border: 'border-red-200' },
}

export default function RiwayatDonasi() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [donasi, setDonasi] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('semua')

  useEffect(() => { fetchDonasi() }, [])

  async function fetchDonasi() {
    const { data } = await supabase
      .from('donasi')
      .select('*')
      .eq('donor_id', user.id)
      .order('created_at', { ascending: false })
    setDonasi(data || [])
    setLoading(false)
  }

  async function handleHapus(id) {
    if (!confirm('Hapus donasi ini?')) return
    await supabase.from('donasi').delete().eq('id', id)
    fetchDonasi()
  }

  async function handleTandaiKadaluarsa(id) {
    await supabase.from('donasi').update({ status: 'kadaluarsa' }).eq('id', id)
    fetchDonasi()
  }

  const filtered = filter === 'semua'
    ? donasi
    : donasi.filter(d => d.status === filter)

  const stats = {
    total: donasi.length,
    tersedia: donasi.filter(d => d.status === 'tersedia').length,
    diambil: donasi.filter(d => d.status === 'diambil').length,
    totalPorsi: donasi.reduce((sum, d) => sum + (d.jumlah_porsi || 0), 0),
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#1a3a2a]">📋 Riwayat Donasi</h1>
          <p className="text-sm text-[#7a8a7a] mt-1">Semua donasi makanan yang pernah kamu posting</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-5">
          {[
            { label: 'Total', value: stats.total, color: 'text-[#1a3a2a]' },
            { label: 'Aktif', value: stats.tersedia, color: 'text-[#2D6A4F]' },
            { label: 'Diambil', value: stats.diambil, color: 'text-blue-600' },
            { label: 'Porsi', value: stats.totalPorsi, color: 'text-[#F4A261]' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-3 border border-[#e8e4db] text-center">
              <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-[#9a9a8a] mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-4">
          {['semua', 'tersedia', 'diambil', 'kadaluarsa'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium capitalize transition-all ${
                filter === f
                  ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]'
                  : 'bg-white text-[#4a4a3a] border-[#e8e4db] hover:bg-[#f0faf4]'
              }`}>
              {f === 'semua' ? 'Semua' : STATUS_CONFIG[f]?.label}
            </button>
          ))}
        </div>

        {/* Tombol Donasi Baru */}
        <button
          onClick={() => navigate('/donasi/buat')}
          className="w-full py-3 rounded-2xl bg-[#F4A261] hover:bg-[#e8924f] text-white text-sm font-semibold mb-5 transition-all shadow-md shadow-[#F4A261]/20"
        >
          + Posting Donasi Baru
        </button>

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-[#e8e4db] p-4 animate-pulse">
                <div className="h-4 bg-[#f0ece4] rounded w-1/2 mb-2" />
                <div className="h-3 bg-[#f0ece4] rounded w-3/4" />
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 bg-white rounded-3xl border border-[#e8e4db]">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-sm font-medium text-[#4a4a3a]">Belum ada donasi</p>
            <p className="text-xs text-[#9a9a8a] mt-1">
              {filter === 'semua' ? 'Mulai donasi makanan pertamamu!' : `Tidak ada donasi dengan status "${STATUS_CONFIG[filter]?.label}"`}
            </p>
          </div>
        )}

        {/* List */}
        <div className="space-y-3">
          {filtered.map(item => {
            const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.tersedia
            return (
              <div key={item.id} className="bg-white rounded-2xl border border-[#e8e4db] overflow-hidden">
                <div className="flex gap-3 p-4">
                  {item.foto_url ? (
                    <img src={item.foto_url} alt={item.nama_makanan}
                      className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-[#f0faf4] flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">🍱</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-[#1a3a2a] truncate">{item.nama_makanan}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${status.bg} ${status.text} ${status.border}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-xs text-[#9a9a8a] mt-1">{item.jumlah_porsi} porsi</p>
                    {item.kabupaten && (
                      <p className="text-xs text-[#9a9a8a]">📍 {item.kabupaten}</p>
                    )}
                    <p className="text-xs text-[#b0b0a0] mt-1">
                      {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Action buttons */}
                {item.status === 'tersedia' && (
                  <div className="flex border-t border-[#f0ece4]">
                    <button
                      onClick={() => handleTandaiKadaluarsa(item.id)}
                      className="flex-1 py-2.5 text-xs text-[#9a9a8a] hover:bg-[#faf9f7] transition-all"
                    >
                      Tandai Kadaluarsa
                    </button>
                    <div className="w-px bg-[#f0ece4]" />
                    <button
                      onClick={() => handleHapus(item.id)}
                      className="flex-1 py-2.5 text-xs text-red-500 hover:bg-red-50 transition-all"
                    >
                      Hapus
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="h-6" />
      </div>
    </Layout>
  )
}