// supabase/functions/export-laporan-pdf/index.ts
// Edge Function: Generate laporan PDF Posyandu
// Deploy: supabase functions deploy export-laporan-pdf

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    normal: 'Normal',
    gizi_kurang: 'Gizi Kurang',
    gizi_buruk: 'Gizi Buruk',
    gizi_lebih: 'Gizi Lebih',
    stunting: 'Stunting',
    stunting_berat: 'Stunting Berat',
    wasting: 'Wasting',
    wasting_berat: 'Wasting Berat',
    overweight: 'Overweight',
    obesitas: 'Obesitas',
  }
  return map[status] || status
}

function statusColor(status: string): string {
  if (['stunting_berat', 'gizi_buruk', 'wasting_berat'].includes(status)) return '#dc2626'
  if (['stunting', 'wasting', 'gizi_kurang'].includes(status)) return '#d97706'
  if (['overweight', 'obesitas', 'gizi_lebih'].includes(status)) return '#7c3aed'
  return '#16a34a'
}

function formatTanggal(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
}

function hitungUmur(tanggalLahir: string, tanggalUkur?: string): string {
  const lahir = new Date(tanggalLahir)
  const ukur = tanggalUkur ? new Date(tanggalUkur) : new Date()
  const bulan = Math.floor(
    (ukur.getFullYear() - lahir.getFullYear()) * 12 +
    (ukur.getMonth() - lahir.getMonth())
  )
  if (bulan < 12) return `${bulan} bln`
  const thn = Math.floor(bulan / 12)
  const sisa = bulan % 12
  return sisa > 0 ? `${thn} thn ${sisa} bln` : `${thn} thn`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    })
    const { data: { user } } = await supabaseUser.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Token tidak valid' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const body = await req.json()
    const { wilayah_id, bulan_mulai, bulan_selesai, posyandu_id } = body

    // Ambil profil kader
    const { data: profile } = await supabase
      .from('profiles')
      .select('nama, kota, provinsi, kabupaten, kelurahan')
      .eq('id', user.id)
      .single()

    // Ambil data wilayah
    const { data: wilayah } = wilayah_id
      ? await supabase.from('wilayah').select('*').eq('id', wilayah_id).single()
      : { data: null }

    // Ambil data balita + pengukuran terakhir
    let balitaQuery = supabase
      .from('balita')
      .select(`
        id, nama, tanggal_lahir, jenis_kelamin, rt, rw, nama_ortu,
        pengukuran (
          id, tanggal_ukur, berat_kg, tinggi_cm,
          zscore_bbu, zscore_tbu, zscore_bbtb,
          status_gizi, created_at
        )
      `)
      .order('nama')

    if (wilayah_id) balitaQuery = balitaQuery.eq('wilayah_id', wilayah_id)
    if (posyandu_id) balitaQuery = balitaQuery.eq('posyandu_id', posyandu_id)

    const { data: balitaList } = await balitaQuery

    // Ambil tren bulanan
    const { data: tren } = await supabase.rpc('get_tren_gizi', {
      p_wilayah_id: wilayah_id || null,
      p_bulan_mulai: bulan_mulai || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      p_bulan_selesai: bulan_selesai || new Date().toISOString().split('T')[0],
    })

    // Hitung ringkasan
    const totalBalita = balitaList?.length || 0
    let totalStunting = 0, totalWasting = 0, totalGiziBuruk = 0, totalNormal = 0

    const balitaWithLatest = (balitaList || []).map((b: Record<string, unknown>) => {
      const pengukuranArr = (b.pengukuran as Record<string, unknown>[]) || []
      const latest = pengukuranArr.sort((a, b) =>
        new Date(b.tanggal_ukur as string).getTime() - new Date(a.tanggal_ukur as string).getTime()
      )[0]

      if (latest) {
        const s = latest.status_gizi as string
        if (['stunting', 'stunting_berat'].includes(s)) totalStunting++
        else if (['wasting', 'wasting_berat'].includes(s)) totalWasting++
        else if (s === 'gizi_buruk') totalGiziBuruk++
        else if (s === 'normal') totalNormal++
      }

      return { ...b, pengukuran_terakhir: latest }
    })

    const periodeLabel = bulan_mulai && bulan_selesai
      ? `${formatTanggal(bulan_mulai)} – ${formatTanggal(bulan_selesai)}`
      : `s/d ${formatTanggal(new Date().toISOString().split('T')[0])}`

    const namaWilayah = wilayah?.nama_kelurahan || profile?.kelurahan || profile?.kota || 'Semua Wilayah'
    const namaKader = profile?.nama || 'Kader Posyandu'

    // ─────────────────────────────────────────
    // Generate HTML untuk PDF
    // ─────────────────────────────────────────
    const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Laporan Posyandu – ${namaWilayah}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Arial', sans-serif; font-size: 11px; color: #1a1a1a; background: #fff; }
  
  .header { 
    background: linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%);
    color: white; padding: 24px 32px; display: flex;
    align-items: center; justify-content: space-between;
  }
  .header-left h1 { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
  .header-left p { font-size: 11px; opacity: 0.85; }
  .header-right { text-align: right; font-size: 10px; opacity: 0.85; }
  
  .kop { padding: 16px 32px; border-bottom: 2px solid #2D6A4F; margin-bottom: 16px; }
  .kop h2 { font-size: 15px; color: #1B4332; }
  .kop p { font-size: 10px; color: #555; margin-top: 2px; }
  
  .summary { 
    display: grid; grid-template-columns: repeat(4, 1fr); 
    gap: 12px; padding: 0 32px 20px; 
  }
  .summary-card {
    border: 1.5px solid #e0e0e0; border-radius: 8px;
    padding: 12px; text-align: center;
  }
  .summary-card .num { font-size: 24px; font-weight: 700; }
  .summary-card .lbl { font-size: 9px; color: #666; margin-top: 2px; }
  .num-green { color: #16a34a; }
  .num-red { color: #dc2626; }
  .num-yellow { color: #d97706; }
  .num-blue { color: #2563eb; }
  
  .section { padding: 0 32px 20px; }
  .section h3 { font-size: 12px; font-weight: 700; color: #1B4332; 
    border-left: 3px solid #2D6A4F; padding-left: 8px; margin-bottom: 12px; }
  
  table { width: 100%; border-collapse: collapse; font-size: 10px; }
  th { background: #1B4332; color: white; padding: 7px 8px; text-align: left; font-weight: 600; }
  td { padding: 6px 8px; border-bottom: 1px solid #f0f0f0; }
  tr:nth-child(even) td { background: #f9fafb; }
  
  .badge {
    display: inline-block; padding: 2px 8px; border-radius: 99px;
    font-size: 9px; font-weight: 600; color: white;
  }
  
  .tren-table th { background: #2D6A4F; }
  
  .footer {
    margin-top: 24px; padding: 16px 32px;
    border-top: 1px solid #e0e0e0;
    display: flex; justify-content: space-between;
    font-size: 9px; color: #888;
  }
  .ttd { text-align: right; }
  .ttd p { font-size: 10px; color: #333; }
  .ttd .garis { margin-top: 48px; border-top: 1px solid #333; width: 160px; margin-left: auto; padding-top: 4px; }
  
  @media print {
    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    .page-break { page-break-before: always; }
  }
</style>
</head>
<body>

<!-- HEADER -->
<div class="header">
  <div class="header-left">
    <h1>🏥 LAPORAN POSYANDU</h1>
    <p>Sistem Pemantauan Gizi Balita Terintegrasi</p>
  </div>
  <div class="header-right">
    <p>Dicetak: ${formatTanggal(new Date().toISOString().split('T')[0])}</p>
    <p>Periode: ${periodeLabel}</p>
    <p>Wilayah: ${namaWilayah}</p>
  </div>
</div>

<!-- INFO LAPORAN -->
<div class="kop">
  <h2>Laporan Pemantauan Gizi Balita – ${namaWilayah}</h2>
  <p>Kecamatan: ${wilayah?.nama_kecamatan || '-'} | Kabupaten: ${wilayah?.nama_kabupaten || profile?.kabupaten || '-'} | Provinsi: ${profile?.provinsi || '-'}</p>
  <p>Dibuat oleh: ${namaKader} | Periode: ${periodeLabel}</p>
</div>

<!-- RINGKASAN STATS -->
<div class="summary">
  <div class="summary-card">
    <div class="num num-blue">${totalBalita}</div>
    <div class="lbl">Total Balita</div>
  </div>
  <div class="summary-card">
    <div class="num num-green">${totalNormal}</div>
    <div class="lbl">Status Normal</div>
  </div>
  <div class="summary-card">
    <div class="num num-red">${totalStunting}</div>
    <div class="lbl">Stunting</div>
  </div>
  <div class="summary-card">
    <div class="num num-yellow">${totalWasting + totalGiziBuruk}</div>
    <div class="lbl">Wasting / Gizi Buruk</div>
  </div>
</div>

<!-- TABEL DATA BALITA -->
<div class="section">
  <h3>Data Rekap Balita</h3>
  <table>
    <thead>
      <tr>
        <th>No</th>
        <th>Nama Balita</th>
        <th>L/P</th>
        <th>Umur</th>
        <th>Tgl Ukur</th>
        <th>BB (kg)</th>
        <th>TB (cm)</th>
        <th>Z-BBU</th>
        <th>Z-TBU</th>
        <th>Z-BBTB</th>
        <th>Status Gizi</th>
        <th>RT/RW</th>
      </tr>
    </thead>
    <tbody>
      ${balitaWithLatest.map((b, i) => {
        const p = b.pengukuran_terakhir as Record<string, unknown> | undefined
        const status = p ? (p.status_gizi as string) : '-'
        const color = p ? statusColor(status) : '#888'
        return `
        <tr>
          <td>${i + 1}</td>
          <td><strong>${b.nama}</strong>${b.nama_ortu ? `<br><span style="color:#888;font-size:9px">${b.nama_ortu}</span>` : ''}</td>
          <td>${b.jenis_kelamin}</td>
          <td>${hitungUmur(b.tanggal_lahir as string, p?.tanggal_ukur as string)}</td>
          <td>${p ? formatTanggal(p.tanggal_ukur as string) : '-'}</td>
          <td>${p ? p.berat_kg : '-'}</td>
          <td>${p ? p.tinggi_cm : '-'}</td>
          <td>${p?.zscore_bbu ?? '-'}</td>
          <td>${p?.zscore_tbu ?? '-'}</td>
          <td>${p?.zscore_bbtb ?? '-'}</td>
          <td>${p ? `<span class="badge" style="background:${color}">${statusLabel(status)}</span>` : '-'}</td>
          <td>${b.rt ? `${b.rt}/${b.rw}` : '-'}</td>
        </tr>`
      }).join('')}
    </tbody>
  </table>
</div>

<!-- TREN BULANAN -->
${tren && tren.length > 0 ? `
<div class="section page-break">
  <h3>Tren Gizi Bulanan</h3>
  <table class="tren-table">
    <thead>
      <tr>
        <th>Bulan</th>
        <th>Total Pengukuran</th>
        <th>Normal</th>
        <th>Stunting</th>
        <th>Wasting</th>
        <th>% Stunting</th>
      </tr>
    </thead>
    <tbody>
      ${tren.map((t: Record<string, unknown>) => `
      <tr>
        <td>${t.bulan}</td>
        <td>${t.total_pengukuran}</td>
        <td style="color:#16a34a;font-weight:600">${t.total_normal}</td>
        <td style="color:#dc2626;font-weight:600">${t.total_stunting}</td>
        <td style="color:#d97706;font-weight:600">${t.total_wasting}</td>
        <td>
          <span style="color:${Number(t.persen_stunting) >= 30 ? '#dc2626' : Number(t.persen_stunting) >= 15 ? '#d97706' : '#16a34a'};font-weight:700">
            ${t.persen_stunting}%
          </span>
        </td>
      </tr>`).join('')}
    </tbody>
  </table>
</div>
` : ''}

<!-- REKOMENDASI -->
<div class="section">
  <h3>Rekomendasi Intervensi</h3>
  <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:12px;font-size:10px;line-height:1.8">
    ${totalGiziBuruk > 0 ? `<p>🔴 <strong>PRIORITAS TINGGI:</strong> Terdapat <strong>${totalGiziBuruk} balita gizi buruk</strong> — segera rujuk ke Puskesmas untuk penanganan intensif dan pemberian PMT (Pemberian Makanan Tambahan) khusus.</p>` : ''}
    ${totalStunting > 0 ? `<p>🟡 <strong>STUNTING:</strong> ${totalStunting} balita terdeteksi stunting (${Math.round(totalStunting/Math.max(totalBalita,1)*100)}%) — lakukan konseling gizi, pemantauan ketat bulanan, dan koordinasi dengan tenaga kesehatan Puskesmas.</p>` : ''}
    ${totalWasting > 0 ? `<p>🟠 <strong>WASTING:</strong> ${totalWasting} balita dengan status wasting — tingkatkan asupan kalori, pantau BB setiap 2 minggu, dan pertimbangkan pemberian PMT.</p>` : ''}
    ${totalNormal === totalBalita ? `<p>🟢 <strong>BAIK:</strong> Seluruh balita dalam status gizi normal. Pertahankan dengan pemantauan rutin dan edukasi MPASI bergizi.</p>` : ''}
    <p>📋 Laporkan data ini ke Puskesmas setempat dan koordinasikan program intervensi gizi sesuai standar Kemenkes RI.</p>
  </div>
</div>

<!-- FOOTER -->
<div class="footer">
  <div>
    <p>Dokumen ini dibuat otomatis oleh Sistem Informasi Gizi Balita</p>
    <p>Standar WHO Child Growth Standards 2006 | Kemenkes RI</p>
  </div>
  <div class="ttd">
    <p>Mengetahui, Kader Posyandu</p>
    <div class="garis">${namaKader}</div>
  </div>
</div>

</body>
</html>`

    // Return HTML (frontend akan convert ke PDF dengan print/window.print atau Puppeteer)
    // Untuk produksi, bisa gunakan Puppeteer via browser.deno.dev
    return new Response(html, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'X-Laporan-Wilayah': namaWilayah,
        'X-Total-Balita': String(totalBalita),
      }
    })

  } catch (err) {
    console.error('Export error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error', detail: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})