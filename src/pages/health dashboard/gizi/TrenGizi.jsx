// src/pages/TrenGizi.jsx
import { useEffect, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts'
import Layout from '../../../components/Layout'
import { useTrenGizi, useWilayah } from '../../../hooks/useBalita'

const USIA_GROUPS = [
  { label: 'Semua',    min: 0,  max: 60 },
  { label: '0–6 bln',  min: 0,  max: 6  },
  { label: '6–12 bln', min: 6,  max: 12 },
  { label: '1–2 thn',  min: 12, max: 24 },
  { label: '2–5 thn',  min: 24, max: 60 },
]

function formatBulan(bulanStr) {
  if (!bulanStr) return ''
  return new Date(bulanStr).toLocaleDateString('id-ID', { month: 'short', year: '2-digit' })
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[#e8e4db] rounded-2xl p-3 shadow-lg text-xs">
      <p className="font-bold text-[#1a3a2a] mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-[#4a4a3a]">{p.name}:</span>
          <span className="font-bold" style={{ color: p.color }}>{p.value}{p.name === 'Stunting' || p.name === 'Berisiko' ? '%' : ''}</span>
        </div>
      ))}
    </div>
  )
}

function StatCard({ label, value, sub, color, bg }) {
  return (
    <div className={`${bg} rounded-2xl p-4 border border-[#e8e4db]`}>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-[#9a9a8a] mt-0.5">{label}</p>
      {sub && <p className="text-xs text-[#6a7a6a] mt-0.5">{sub}</p>}
    </div>
  )
}

export default function TrenGizi() {
  const { data: trenData, loading, error, fetch } = useTrenGizi()
  const { data: wilayahList, fetch: fetchWilayah } = useWilayah()

  const [wilayahId, setWilayahId]   = useState('')
  const [usiaGroup, setUsiaGroup]   = useState(0)
  const [metrik, setMetrik]         = useState('stunting') // stunting | berisiko | diukur

  useEffect(() => { fetchWilayah() }, [fetchWilayah])
  useEffect(() => { fetch(wilayahId || null) }, [fetch, wilayahId])

  // Format data untuk chart
  const chartData = trenData.map(t => ({
    bulan:    formatBulan(t.bulan),
    Stunting: parseFloat(t.persen_stunting) || 0,
    Berisiko: t.total_diukur > 0
      ? parseFloat(((t.jumlah_berisiko / t.total_diukur) * 100).toFixed(1))
      : 0,
    Diukur:   t.total_diukur || 0,
  }))

  // Statistik ringkasan
  const last  = trenData[trenData.length - 1]
  const first = trenData[0]
  const trend = last && first
    ? parseFloat(((last.persen_stunting || 0) - (first.persen_stunting || 0)).toFixed(1))
    : 0

  const avgStunting = trenData.length
    ? (trenData.reduce((s, t) => s + (t.persen_stunting || 0), 0) / trenData.length).toFixed(1)
    : 0

  return (
    <Layout>
      {/* Header */}
      <div className="mb-5">
        <button onClick={() => window.history.back()} className="text-sm text-[#534AB7] font-semibold mb-3 flex items-center gap-1">← Kembali</button>
        <h1 className="text-2xl font-bold text-[#1a3a2a]">Tren Gizi Komunitas 📈</h1>
        <p className="text-sm text-[#7a8a7a] mt-1">Grafik bulanan status gizi per wilayah</p>
      </div>

      {/* Filter Wilayah */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-[#4a4a3a] mb-1.5">Pilih Wilayah</label>
        <select
          value={wilayahId}
          onChange={e => setWilayahId(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-[#e8e4db] bg-white text-sm focus:outline-none focus:border-[#534AB7]"
        >
          <option value="">Semua Wilayah</option>
          {wilayahList.map(w => (
            <option key={w.id} value={w.id}>{w.kelurahan} — {w.kecamatan}</option>
          ))}
        </select>
      </div>

      {/* Filter Usia */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
        {USIA_GROUPS.map((g, i) => (
          <button
            key={i}
            onClick={() => setUsiaGroup(i)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border flex-shrink-0 transition-all ${
              usiaGroup === i ? 'bg-[#534AB7] text-white border-[#534AB7]' : 'bg-white text-[#4a4a3a] border-[#e8e4db]'
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <StatCard
          label="Stunting Terkini"
          value={`${last?.persen_stunting || 0}%`}
          color={last?.persen_stunting > 30 ? 'text-red-600' : last?.persen_stunting > 15 ? 'text-yellow-600' : 'text-green-600'}
          bg="bg-white"
        />
        <StatCard
          label="Rata-rata 12 Bln"
          value={`${avgStunting}%`}
          color="text-[#534AB7]"
          bg="bg-[#EDE9FE]"
        />
        <StatCard
          label="Tren"
          value={trend > 0 ? `+${trend}%` : `${trend}%`}
          sub={trend > 0 ? '↑ Meningkat' : trend < 0 ? '↓ Menurun' : '→ Stabil'}
          color={trend > 0 ? 'text-red-600' : trend < 0 ? 'text-green-600' : 'text-gray-500'}
          bg="bg-white"
        />
      </div>

      {/* Chart */}
      <div className="bg-white border border-[#e8e4db] rounded-2xl p-4 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-[#1a3a2a]">Grafik % Stunting per Bulan</h3>
          <div className="flex gap-1">
            {[['stunting','Stunting'],['berisiko','Berisiko']].map(([val, lbl]) => (
              <button
                key={val}
                onClick={() => setMetrik(val)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                  metrik === val ? 'bg-[#534AB7] text-white border-[#534AB7]' : 'bg-[#f4f4f0] text-[#4a4a3a] border-[#e8e4db]'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="h-48 bg-[#f4f4f0] rounded-xl animate-pulse" />
        ) : chartData.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center">
            <p className="text-3xl mb-2">📈</p>
            <p className="text-sm font-semibold text-[#1a3a2a]">Belum ada data</p>
            <p className="text-xs text-[#9a9a8a] mt-1">Input pengukuran untuk melihat tren</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f0" />
              <XAxis dataKey="bulan" tick={{ fontSize: 10, fill: '#9a9a8a' }} />
              <YAxis tick={{ fontSize: 10, fill: '#9a9a8a' }} unit="%" domain={[0, 'dataMax + 5']} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={30} stroke="#dc2626" strokeDasharray="4 4" label={{ value: '30% (Kritis)', fontSize: 9, fill: '#dc2626' }} />
              <ReferenceLine y={15} stroke="#d97706" strokeDasharray="4 4" label={{ value: '15% (Waspada)', fontSize: 9, fill: '#d97706' }} />
              {metrik === 'stunting' && (
                <Line
                  type="monotone" dataKey="Stunting" stroke="#dc2626" strokeWidth={2.5}
                  dot={{ r: 4, fill: '#dc2626' }} activeDot={{ r: 6 }}
                />
              )}
              {metrik === 'berisiko' && (
                <Line
                  type="monotone" dataKey="Berisiko" stroke="#d97706" strokeWidth={2.5}
                  dot={{ r: 4, fill: '#d97706' }} activeDot={{ r: 6 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}

        {/* Keterangan garis */}
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-px border-t-2 border-dashed border-red-500" />
            <span className="text-xs text-[#9a9a8a]">30% batas kritis</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-px border-t-2 border-dashed border-yellow-500" />
            <span className="text-xs text-[#9a9a8a]">15% batas waspada</span>
          </div>
        </div>
      </div>

      {/* Tabel Data Bulanan */}
      <div className="bg-white border border-[#e8e4db] rounded-2xl overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-[#f4f4f0]">
          <h3 className="text-sm font-bold text-[#1a3a2a]">Data Bulanan</h3>
        </div>
        {trenData.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#9a9a8a]">Belum ada data</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[360px]">
              <thead>
                <tr className="bg-[#f4f4f0]">
                  {['Bulan','Diukur','Stunting','% Stunting','Berisiko'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-[#4a4a3a] font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...trenData].reverse().map((t, i) => {
                  const pct = t.persen_stunting || 0
                  return (
                    <tr key={i} className="border-t border-[#f4f4f0]">
                      <td className="px-3 py-2.5 font-medium text-[#1a3a2a] whitespace-nowrap">
                        {new Date(t.bulan).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                      </td>
                      <td className="px-3 py-2.5 text-[#4a4a3a]">{t.total_diukur || 0}</td>
                      <td className="px-3 py-2.5 text-red-600 font-semibold">{t.jumlah_stunting || 0}</td>
                      <td className="px-3 py-2.5">
                        <span className={`font-bold ${pct > 30 ? 'text-red-600' : pct > 15 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {pct}%
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-yellow-600 font-semibold">{t.jumlah_berisiko || 0}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Interpretasi */}
      {trend !== 0 && (
        <div className={`rounded-2xl border p-4 mb-6 ${trend > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
          <p className={`text-sm font-bold mb-1 ${trend > 0 ? 'text-red-700' : 'text-green-700'}`}>
            {trend > 0 ? '⚠️ Tren Memburuk' : '✅ Tren Membaik'}
          </p>
          <p className={`text-xs ${trend > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {trend > 0
              ? `Prevalensi stunting naik ${Math.abs(trend)}% dalam 12 bulan terakhir. Perlu evaluasi program intervensi.`
              : `Prevalensi stunting turun ${Math.abs(trend)}% dalam 12 bulan terakhir. Program intervensi menunjukkan dampak positif.`}
          </p>
        </div>
      )}
    </Layout>
  )
}