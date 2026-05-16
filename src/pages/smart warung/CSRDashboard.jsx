import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

function generateLaporanHTML(warungNama, data, trenBulanan) {
  const bulanIni = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  const barRows = trenBulanan.map(t =>
    `<tr><td>${t.bulan}</td><td>${t.jumlah}</td><td>${t.porsi}</td></tr>`
  ).join('')

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Laporan CSR - ${warungNama}</title>
<style>
  body { font-family: Arial, sans-serif; margin: 40px; color: #1a3a2a; }
  h1 { color: #2D6A4F; border-bottom: 3px solid #F4A261; padding-bottom: 10px; }
  .subtitle { color: #7a8a7a; font-size: 14px; margin-bottom: 30px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
  .card { border: 1px solid #e8e4db; border-radius: 12px; padding: 16px; background: #faf9f7; }
  .card .val { font-size: 28px; font-weight: bold; color: #2D6A4F; }
  .card .label { font-size: 12px; color: #7a8a7a; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; margin-top: 20px; }
  th { background: #2D6A4F; color: white; padding: 10px; text-align: left; }
  td { padding: 8px 10px; border-bottom: 1px solid #f0ece4; }
  tr:nth-child(even) td { background: #faf9f7; }
  .footer { margin-top: 40px; font-size: 12px; color: #9a9a8a; border-top: 1px solid #e8e4db; padding-top: 16px; }
  .badge { display: inline-block; background: #f0faf4; border: 1px solid #b7e4cc; color: #2D6A4F; padding: 4px 12px; border-radius: 999px; font-size: 12px; margin-bottom: 20px; }
</style>
</head>
<body>
<h1>🌾 Laporan Dampak Sosial LUMBUNG</h1>
<p class="subtitle">Periode: ${bulanIni} | Warung: <strong>${warungNama}</strong></p>
<span class="badge">📊 Laporan CSR Otomatis</span>

<h2>Ringkasan Dampak</h2>
<div class="grid">
  <div class="card"><div class="val">${data.diambil}</div><div class="label">👨‍👩‍👧 Keluarga Terbantu</div></div>
  <div class="card"><div class="val">${data.totalPorsi}</div><div class="label">🍱 Porsi Tersalurkan</div></div>
  <div class="card"><div class="val">${data.foodWaste} kg</div><div class="label">♻️ Food Waste Diselamatkan (est.)</div></div>
  <div class="card"><div class="val">${data.co2} kg</div><div class="label">🌍 CO₂ Dihemat (est.)</div></div>
</div>

<h2>Tren Donasi 6 Bulan</h2>
<table>
  <thead><tr><th>Bulan</th><th>Jumlah Donasi</th><th>Total Porsi</th></tr></thead>
  <tbody>${barRows}</tbody>
</table>

<div class="footer">
  <p>Laporan ini diterbitkan oleh platform LUMBUNG — Sistem Gizi & Food Rescue berbasis komunitas.</p>
  <p>Diterbitkan otomatis pada ${new Date().toLocaleString('id-ID')}.</p>
</div>
</body>
</html>`
}

export default function CSRDashboard({ userId, warungNama }) {
  const [data, setData] = useState(null)
  const [trenBulanan, setTrenBulanan] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const { data: donasi } = await supabase
      .from('donasi').select('*').eq('donor_id', userId)

    const total = donasi?.length || 0
    const diambil = donasi?.filter(d => d.status === 'diambil').length || 0
    const totalPorsi = donasi?.reduce((sum, d) => sum + (d.jumlah_porsi || 0), 0) || 0
    const foodWaste = Math.round(totalPorsi * 0.3)
    const co2 = Math.round(foodWaste * 2.5)

    // Tren 6 bulan terakhir
    const bulanIni = new Date()
    const tren = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(bulanIni.getFullYear(), bulanIni.getMonth() - i, 1)
      const bulanLabel = d.toLocaleDateString('id-ID', { month: 'short' })
      const donasiMonth = donasi?.filter(don => {
        const dt = new Date(don.created_at)
        return dt.getMonth() === d.getMonth() && dt.getFullYear() === d.getFullYear()
      }) || []
      tren.push({
        bulan: bulanLabel,
        jumlah: donasiMonth.length,
        porsi: donasiMonth.reduce((s, d) => s + (d.jumlah_porsi || 0), 0)
      })
    }

    setData({ total, diambil, totalPorsi, foodWaste, co2 })
    setTrenBulanan(tren)
    setLoading(false)
  }

  if (loading) return (
    <div className="text-center py-10">
      <div className="text-3xl animate-bounce mb-2">📊</div>
      <p className="text-xs text-[#9a9a8a]">Memuat data CSR...</p>
    </div>
  )

  const maxPorsi = Math.max(...trenBulanan.map(t => t.porsi), 1)

  return (
    <div className="space-y-4">

      {/* Info Banner */}
      <div className="bg-[#f0faf4] rounded-2xl p-4 border border-[#b7e4cc]">
        <p className="text-xs font-semibold text-[#2D6A4F] mb-1">📊 Dashboard CSR</p>
        <p className="text-xs text-[#5a7a6a] leading-relaxed">
          Laporan dampak sosial dan lingkungan dari program donasi warungmu. Data ini bisa dipakai untuk laporan sustainability bisnis.
        </p>
      </div>

      {/* Impact Cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: '👨‍👩‍👧', label: 'Keluarga Terbantu', value: data.diambil, unit: 'keluarga', color: 'text-[#2D6A4F]', bg: 'bg-[#f0faf4]' },
          { icon: '🍱', label: 'Porsi Tersalurkan', value: data.totalPorsi, unit: 'porsi', color: 'text-[#F4A261]', bg: 'bg-[#fef3e7]' },
          { icon: '♻️', label: 'Food Waste Diselamatkan', value: `${data.foodWaste} kg`, unit: 'estimasi', color: 'text-green-600', bg: 'bg-green-50' },
          { icon: '🌍', label: 'CO₂ Dihemat', value: `${data.co2} kg`, unit: 'estimasi', color: 'text-blue-500', bg: 'bg-blue-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4 border border-[#e8e4db]`}>
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-[#9a9a8a] mt-0.5">{s.unit}</div>
            <div className="text-xs font-medium text-[#4a4a3a] mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tren Bulanan */}
      <div className="bg-white rounded-2xl border border-[#e8e4db] p-4">
        <p className="text-sm font-semibold text-[#1a3a2a] mb-4">📈 Tren Donasi 6 Bulan</p>
        <div className="flex items-end gap-2 h-24">
          {trenBulanan.map((t, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="text-xs font-bold text-[#F4A261]">
                {t.porsi > 0 ? t.porsi : ''}
              </div>
              <div
                className="w-full rounded-t-lg bg-[#F4A261] transition-all"
                style={{ height: `${Math.max((t.porsi / maxPorsi) * 64, t.porsi > 0 ? 4 : 0)}px` }}
              />
              <div className="text-[10px] text-[#9a9a8a]">{t.bulan}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sertifikat CSR */}
      <div className="bg-gradient-to-r from-[#F4A261] to-[#e8924f] rounded-2xl p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs opacity-80 mb-1">Laporan Dampak Sosial</p>
            <p className="text-sm font-bold">Download Sertifikat CSR</p>
            <p className="text-xs opacity-75 mt-1">
              {data.diambil} keluarga · {data.totalPorsi} porsi · {data.foodWaste}kg food waste diselamatkan
            </p>
          </div>
          <button
            onClick={() => {
              const html = generateLaporanHTML(warungNama || 'Warung Saya', data, trenBulanan)
              const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `laporan-csr-lumbung-${new Date().toISOString().split('T')[0]}.html`
              a.click()
              URL.revokeObjectURL(url)
            }}
            className="bg-white text-[#d4720a] text-xs font-bold px-3 py-2 rounded-xl flex-shrink-0 ml-3"
          >
            📄 Download
          </button>
        </div>
      </div>

      {/* Roadmap */}
      <div className="bg-white rounded-2xl border border-[#e8e4db] p-4">
        <p className="text-xs font-semibold text-[#4a4a3a] mb-3">🔗 Integrasi Mendatang (Roadmap)</p>
        {[
          { icon: '🟢', label: 'GoFood Integration', desc: 'Tarik data stok otomatis dari GoFood' },
          { icon: '🟠', label: 'ShopeeFood Integration', desc: 'Deteksi menu hampir expired otomatis' },
          { icon: '🔵', label: 'Laporan ESG PDF', desc: 'Export laporan sustainability lengkap' },
        ].map(r => (
          <div key={r.label} className="flex items-start gap-3 py-2 border-b border-[#f0ece4] last:border-0">
            <span className="text-sm mt-0.5">{r.icon}</span>
            <div>
              <p className="text-xs font-medium text-[#1a3a2a]">{r.label}</p>
              <p className="text-xs text-[#9a9a8a]">{r.desc}</p>
            </div>
            <span className="ml-auto text-xs text-[#9a9a8a] bg-[#f5f3ee] px-2 py-0.5 rounded-full flex-shrink-0">
              Soon
            </span>
          </div>
        ))}
      </div>

    </div>
  )
}