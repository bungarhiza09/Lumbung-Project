// supabase/functions/generate-laporan-pdf/index.ts
// Edge Function: Generate laporan PDF posyandu menggunakan HTML → PDF
// Deploy: supabase functions deploy generate-laporan-pdf

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Generate HTML laporan (akan di-convert ke PDF oleh puppeteer atau dikirim sebagai HTML)
function generateHTMLLaporan(data: {
  wilayah: { kelurahan: string; kecamatan: string; kabupaten: string; provinsi: string }
  periode: string
  kader: { nama: string }
  statistik: {
    total_balita: number
    total_diukur: number
    normal: number
    berisiko: number
    stunting: number
    wasting: number
    gizi_buruk: number
    gizi_lebih: number
    persen_stunting: number
  }
  balita: Array<{
    nama: string
    tanggal_lahir: string
    jenis_kelamin: string
    usia_bulan: number
    berat_badan_kg: number
    tinggi_badan_cm: number
    status_gizi: string
    tanggal_ukur: string
  }>
  tren: Array<{ bulan: string; persen_stunting: number; total_diukur: number }>
}): string {

  const statusLabel: Record<string, string> = {
    normal: 'Normal',
    berisiko: 'Berisiko',
    stunting: 'Stunting',
    wasting: 'Wasting',
    gizi_buruk: 'Gizi Buruk',
    gizi_lebih: 'Gizi Lebih',
  }

  const statusColor: Record<string, string> = {
    normal: '#16a34a',
    berisiko: '#d97706',
    stunting: '#dc2626',
    wasting: '#dc2626',
    gizi_buruk: '#7f1d1d',
    gizi_lebih: '#7c3aed',
  }

  const formatTanggal = (tgl: string) => {
    if (!tgl) return '-'
    return new Date(tgl).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'long', year: 'numeric'
    })
  }

  const formatBulan = (bulan: string) => {
    return new Date(bulan).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  }

  const tabelBalita = data.balita.map((b, i) => `
    <tr style="background:${i % 2 === 0 ? '#f9fafb' : '#fff'}">
      <td style="padding:8px;border:1px solid #e5e7eb;text-align:center">${i + 1}</td>
      <td style="padding:8px;border:1px solid #e5e7eb">${b.nama}</td>
      <td style="padding:8px;border:1px solid #e5e7eb;text-align:center">${b.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</td>
      <td style="padding:8px;border:1px solid #e5e7eb;text-align:center">${b.usia_bulan} bln</td>
      <td style="padding:8px;border:1px solid #e5e7eb;text-align:center">${b.berat_badan_kg} kg</td>
      <td style="padding:8px;border:1px solid #e5e7eb;text-align:center">${b.tinggi_badan_cm} cm</td>
      <td style="padding:8px;border:1px solid #e5e7eb;text-align:center">
        <span style="
          background:${statusColor[b.status_gizi] || '#6b7280'}20;
          color:${statusColor[b.status_gizi] || '#6b7280'};
          padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:600
        ">${statusLabel[b.status_gizi] || b.status_gizi}</span>
      </td>
      <td style="padding:8px;border:1px solid #e5e7eb;text-align:center">${formatTanggal(b.tanggal_ukur)}</td>
    </tr>
  `).join('')

  const tabelTren = data.tren.map(t => `
    <tr>
      <td style="padding:8px;border:1px solid #e5e7eb">${formatBulan(t.bulan)}</td>
      <td style="padding:8px;border:1px solid #e5e7eb;text-align:center">${t.total_diukur}</td>
      <td style="padding:8px;border:1px solid #e5e7eb;text-align:center">
        <span style="color:${t.persen_stunting > 30 ? '#dc2626' : t.persen_stunting > 15 ? '#d97706' : '#16a34a'};font-weight:600">
          ${t.persen_stunting}%
        </span>
      </td>
    </tr>
  `).join('')

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Arial', sans-serif; font-size: 12px; color: #1f2937; padding: 24px; }
    .header { text-align: center; border-bottom: 3px solid #2D6A4F; padding-bottom: 16px; margin-bottom: 24px; }
    .logo-row { display: flex; align-items: center; justify-content: center; gap: 16px; margin-bottom: 8px; }
    .logo-placeholder { width: 60px; height: 60px; background: #2D6A4F; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; }
    h1 { font-size: 16px; font-weight: 700; color: #1a3a2a; }
    h2 { font-size: 13px; font-weight: 600; color: #2D6A4F; margin: 16px 0 8px; }
    .subtitle { font-size: 11px; color: #6b7280; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 20px; background: #f9fafb; padding: 12px; border-radius: 8px; border: 1px solid #e5e7eb; }
    .info-item { display: flex; flex-direction: column; gap: 2px; }
    .info-label { font-size: 10px; color: #6b7280; text-transform: uppercase; font-weight: 600; }
    .info-value { font-size: 12px; color: #1f2937; font-weight: 500; }
    .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 20px; }
    .stat-card { padding: 12px; border-radius: 8px; text-align: center; border: 1px solid; }
    .stat-card .num { font-size: 20px; font-weight: 700; }
    .stat-card .label { font-size: 10px; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
    th { background: #2D6A4F; color: white; padding: 8px; text-align: center; font-weight: 600; }
    .footer { margin-top: 32px; display: flex; justify-content: flex-end; }
    .ttd-box { text-align: center; }
    .ttd-name { font-weight: 700; text-decoration: underline; margin-top: 48px; }
    .rekomendasi { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 12px; margin-bottom: 20px; }
    .rekomendasi h3 { color: #92400e; font-size: 12px; margin-bottom: 8px; }
    .rekomendasi ul { padding-left: 16px; }
    .rekomendasi li { color: #78350f; font-size: 11px; margin-bottom: 4px; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>

  <!-- HEADER -->
  <div class="header">
    <div class="logo-row">
      <div class="logo-placeholder">🏥</div>
      <div>
        <h1>LAPORAN GIZI BALITA</h1>
        <h1>POSYANDU / PUSKESMAS</h1>
      </div>
    </div>
    <div class="subtitle">
      Kelurahan ${data.wilayah.kelurahan} &bull; Kecamatan ${data.wilayah.kecamatan}<br>
      ${data.wilayah.kabupaten} &bull; ${data.wilayah.provinsi}
    </div>
  </div>

  <!-- INFO LAPORAN -->
  <div class="info-grid">
    <div class="info-item">
      <span class="info-label">Periode Laporan</span>
      <span class="info-value">${data.periode}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Nama Kader</span>
      <span class="info-value">${data.kader.nama}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Wilayah</span>
      <span class="info-value">Kel. ${data.wilayah.kelurahan}, Kec. ${data.wilayah.kecamatan}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Tanggal Cetak</span>
      <span class="info-value">${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
    </div>
  </div>

  <!-- STATISTIK RINGKASAN -->
  <h2>📊 Ringkasan Status Gizi</h2>
  <div class="stat-grid">
    <div class="stat-card" style="background:#dcfce7;border-color:#86efac">
      <div class="num" style="color:#16a34a">${data.statistik.total_balita}</div>
      <div class="label" style="color:#15803d">Total Balita</div>
    </div>
    <div class="stat-card" style="background:#fee2e2;border-color:#fca5a5">
      <div class="num" style="color:#dc2626">${data.statistik.stunting + data.statistik.gizi_buruk}</div>
      <div class="label" style="color:#b91c1c">Stunting</div>
    </div>
    <div class="stat-card" style="background:#fef3c7;border-color:#fde68a">
      <div class="num" style="color:#d97706">${data.statistik.berisiko}</div>
      <div class="label" style="color:#b45309">Berisiko</div>
    </div>
    <div class="stat-card" style="background:#f3f4f6;border-color:#d1d5db">
      <div class="num" style="color:#dc2626">${data.statistik.persen_stunting}%</div>
      <div class="label" style="color:#6b7280">Prevalensi Stunting</div>
    </div>
  </div>

  <!-- TREN BULANAN -->
  ${data.tren.length > 0 ? `
  <h2>📈 Tren Stunting Bulanan</h2>
  <table>
    <thead>
      <tr>
        <th>Bulan</th>
        <th>Balita Diukur</th>
        <th>% Stunting</th>
      </tr>
    </thead>
    <tbody>${tabelTren}</tbody>
  </table>
  ` : ''}

  <!-- REKOMENDASI -->
  <div class="rekomendasi">
    <h3>⚠️ Rekomendasi Intervensi</h3>
    <ul>
      ${data.statistik.persen_stunting > 30 ? '<li><strong>Darurat:</strong> Prevalensi stunting >30% — butuh intervensi segera dari Puskesmas dan Dinas Kesehatan.</li>' : ''}
      ${data.statistik.persen_stunting > 15 ? '<li>Lakukan pemantauan intensif setiap bulan untuk balita berstatus berisiko.</li>' : ''}
      <li>Berikan PMT (Pemberian Makanan Tambahan) untuk balita stunting dan berisiko.</li>
      <li>Edukasi gizi kepada orang tua: MP-ASI bergizi, ASI eksklusif, higienitas.</li>
      <li>Koordinasi dengan Puskesmas untuk balita dengan status gizi buruk/wasting.</li>
      ${data.statistik.total_balita - data.statistik.total_diukur > 0 
        ? `<li>${data.statistik.total_balita - data.statistik.total_diukur} balita belum diukur — lakukan sweeping.</li>` 
        : ''}
    </ul>
  </div>

  <!-- TABEL DATA BALITA -->
  <h2>👶 Data Balita Individual</h2>
  <table>
    <thead>
      <tr>
        <th>No</th>
        <th>Nama Balita</th>
        <th>JK</th>
        <th>Usia</th>
        <th>BB (kg)</th>
        <th>TB (cm)</th>
        <th>Status Gizi</th>
        <th>Tgl Ukur</th>
      </tr>
    </thead>
    <tbody>${tabelBalita || '<tr><td colspan="8" style="text-align:center;padding:16px;color:#6b7280">Belum ada data pengukuran</td></tr>'}</tbody>
  </table>

  <!-- TANDA TANGAN -->
  <div class="footer">
    <div class="ttd-box">
      <div>${data.wilayah.kelurahan}, ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
      <div style="margin-top:4px;font-size:11px;color:#6b7280">Kader Posyandu,</div>
      <div class="ttd-name">${data.kader.nama}</div>
    </div>
  </div>

</body>
</html>
  `
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Tidak terautentikasi' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const body = await req.json()
    const { wilayah_id, periode_mulai, periode_akhir } = body

    if (!wilayah_id || !periode_mulai || !periode_akhir) {
      return new Response(
        JSON.stringify({ error: 'wilayah_id, periode_mulai, dan periode_akhir wajib diisi' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Ambil data wilayah
    const { data: wilayah } = await supabase
      .from('wilayah')
      .select('kelurahan, kecamatan, kabupaten, provinsi')
      .eq('id', wilayah_id)
      .single()

    // Ambil profil kader
    const { data: kaderProfile } = await supabase
      .from('profiles')
      .select('nama')
      .eq('id', user.id)
      .single()

    // Ambil statistik dari view
    const { data: statWilayah } = await supabase
      .from('v_statistik_wilayah')
      .select('*')
      .eq('wilayah_id', wilayah_id)
      .single()

    // Ambil data balita dengan pengukuran dalam periode
    const { data: balitaData } = await supabase
      .from('v_balita_dengan_status')
      .select('*')
      .eq('wilayah_id', wilayah_id)
      .gte('tanggal_ukur', periode_mulai)
      .lte('tanggal_ukur', periode_akhir)
      .order('nama')

    // Ambil tren bulanan
    const { data: trenData } = await supabase
      .from('v_tren_gizi_bulanan')
      .select('bulan, persen_stunting, total_diukur')
      .eq('wilayah_id', wilayah_id)
      .gte('bulan', new Date(new Date(periode_mulai).setMonth(new Date(periode_mulai).getMonth() - 5)).toISOString())
      .lte('bulan', periode_akhir)
      .order('bulan', { ascending: true })

    const periodeLabel = `${new Date(periode_mulai).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })} – ${new Date(periode_akhir).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`

    // Generate HTML
    const html = generateHTMLLaporan({
      wilayah: wilayah || { kelurahan: '-', kecamatan: '-', kabupaten: '-', provinsi: '-' },
      periode: periodeLabel,
      kader: { nama: kaderProfile?.nama || 'Kader Posyandu' },
      statistik: {
        total_balita: statWilayah?.total_balita || 0,
        total_diukur: statWilayah?.total_diukur || 0,
        normal: statWilayah?.jumlah_normal || 0,
        berisiko: statWilayah?.jumlah_berisiko || 0,
        stunting: statWilayah?.jumlah_stunting || 0,
        wasting: statWilayah?.jumlah_wasting || 0,
        gizi_buruk: statWilayah?.jumlah_gizi_buruk || 0,
        gizi_lebih: 0,
        persen_stunting: statWilayah?.persen_stunting || 0,
      },
      balita: (balitaData || []).map(b => ({
        nama: b.nama,
        tanggal_lahir: b.tanggal_lahir,
        jenis_kelamin: b.jenis_kelamin,
        usia_bulan: b.usia_bulan || 0,
        berat_badan_kg: b.berat_badan_kg || 0,
        tinggi_badan_cm: b.tinggi_badan_cm || 0,
        status_gizi: b.status_gizi || 'belum_diukur',
        tanggal_ukur: b.tanggal_ukur,
      })),
      tren: (trenData || []).map(t => ({
        bulan: t.bulan,
        persen_stunting: t.persen_stunting || 0,
        total_diukur: t.total_diukur || 0,
      })),
    })

    // Return HTML (frontend akan print/save sebagai PDF menggunakan window.print() atau library)
    return new Response(html, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'X-Laporan-Wilayah': wilayah?.kelurahan || '',
        'X-Laporan-Periode': periodeLabel,
      },
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', detail: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})