// supabase/functions/hitung-zscore/index.ts
// FIXED: sesuai kolom schema asli (berat_kg, tinggi_cm, zscore_bbu, zscore_tbu, zscore_bbtb)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ── Tabel LMS WHO 2006 (BB/U Laki-laki) ──────────────────────
const WHO_BB_U_L: Record<number, { L: number; M: number; S: number }> = {
  0:{L:0.3487,M:3.3464,S:0.14602}, 1:{L:0.2297,M:4.4709,S:0.13395},
  2:{L:0.197,M:5.5675,S:0.12385},  3:{L:0.1738,M:6.3762,S:0.11727},
  4:{L:0.1553,M:7.0023,S:0.11316}, 5:{L:0.1395,M:7.5105,S:0.1107},
  6:{L:0.1257,M:7.934,S:0.10882},  7:{L:0.1134,M:8.297,S:0.10748},
  8:{L:0.1021,M:8.6151,S:0.10649}, 9:{L:0.0917,M:8.9014,S:0.10574},
  10:{L:0.082,M:9.1649,S:0.10518}, 11:{L:0.0729,M:9.4122,S:0.10477},
  12:{L:0.0643,M:9.6479,S:0.10452},18:{L:0.0313,M:10.939,S:0.1049},
  24:{L:0.0166,M:12.1391,S:0.108}, 30:{L:0.0105,M:13.2399,S:0.11105},
  36:{L:0.0065,M:14.2441,S:0.11356},42:{L:0.0029,M:15.2225,S:0.1159},
  48:{L:-0.0003,M:16.1717,S:0.11818},54:{L:-0.0034,M:17.1143,S:0.12051},
  60:{L:-0.0065,M:18.0661,S:0.12297},
}
// BB/U Perempuan
const WHO_BB_U_P: Record<number, { L: number; M: number; S: number }> = {
  0:{L:0.3809,M:3.2322,S:0.14171}, 1:{L:0.1714,M:4.1873,S:0.13724},
  2:{L:0.0962,M:5.1282,S:0.12579}, 3:{L:0.0402,M:5.8458,S:0.11976},
  4:{L:-0.005,M:6.4237,S:0.11659}, 5:{L:-0.043,M:6.8985,S:0.11435},
  6:{L:-0.0756,M:7.2981,S:0.11245},7:{L:-0.1039,M:7.6422,S:0.1112},
  8:{L:-0.1288,M:7.9487,S:0.11012},9:{L:-0.1507,M:8.2254,S:0.10939},
  10:{L:-0.17,M:8.48,S:0.10882},   11:{L:-0.1872,M:8.7192,S:0.10843},
  12:{L:-0.2026,M:8.9481,S:0.1082},18:{L:-0.2776,M:10.2163,S:0.11003},
  24:{L:-0.3387,M:11.4685,S:0.1147},30:{L:-0.3865,M:12.6422,S:0.11917},
  36:{L:-0.4264,M:13.9058,S:0.12474},42:{L:-0.4608,M:14.9612,S:0.12961},
  48:{L:-0.4907,M:15.9686,S:0.1342},54:{L:-0.517,M:16.9875,S:0.13878},
  60:{L:-0.5408,M:18.0634,S:0.14362},
}
// TB/U Laki-laki
const WHO_TB_U_L: Record<number, { L: number; M: number; S: number }> = {
  0:{L:1,M:49.8842,S:0.03795}, 1:{L:1,M:54.7244,S:0.03557},
  2:{L:1,M:58.4249,S:0.03424}, 3:{L:1,M:61.4292,S:0.03328},
  4:{L:1,M:63.886,S:0.03257},  5:{L:1,M:65.9026,S:0.03204},
  6:{L:1,M:67.6236,S:0.03165}, 7:{L:1,M:69.1645,S:0.0313},
  8:{L:1,M:70.5994,S:0.03099}, 9:{L:1,M:71.9687,S:0.03073},
  10:{L:1,M:73.2812,S:0.0305}, 11:{L:1,M:74.5388,S:0.03027},
  12:{L:1,M:75.7488,S:0.03006},18:{L:1,M:82.3,S:0.02891},
  24:{L:1,M:87.8,S:0.03022},   30:{L:1,M:92.7,S:0.03101},
  36:{L:1,M:96.1,S:0.03187},   42:{L:1,M:99.9,S:0.03222},
  48:{L:1,M:103.3,S:0.03258},  54:{L:1,M:106.4,S:0.03307},
  60:{L:1,M:109.2,S:0.03344},
}
// TB/U Perempuan
const WHO_TB_U_P: Record<number, { L: number; M: number; S: number }> = {
  0:{L:1,M:49.1477,S:0.0379},  1:{L:1,M:53.6872,S:0.03594},
  2:{L:1,M:57.0673,S:0.03477}, 3:{L:1,M:59.8029,S:0.03373},
  4:{L:1,M:62.0899,S:0.03289}, 5:{L:1,M:64.0301,S:0.03233},
  6:{L:1,M:65.7302,S:0.03187}, 7:{L:1,M:67.2872,S:0.03148},
  8:{L:1,M:68.7498,S:0.03113}, 9:{L:1,M:70.1435,S:0.03082},
  10:{L:1,M:71.4818,S:0.03054},11:{L:1,M:72.771,S:0.03031},
  12:{L:1,M:74.0,S:0.03009},   18:{L:1,M:80.7,S:0.02927},
  24:{L:1,M:86.4,S:0.03038},   30:{L:1,M:91.4,S:0.03112},
  36:{L:1,M:95.1,S:0.03187},   42:{L:1,M:98.7,S:0.0322},
  48:{L:1,M:102.0,S:0.03251},  54:{L:1,M:105.3,S:0.03307},
  60:{L:1,M:108.4,S:0.03358},
}

function interpolaseLMS(
  tabel: Record<number, { L: number; M: number; S: number }>,
  usia: number
): { L: number; M: number; S: number } | null {
  const u = Math.min(Math.max(Math.round(usia), 0), 60)
  if (tabel[u]) return tabel[u]
  const keys = Object.keys(tabel).map(Number).sort((a, b) => a - b)
  let lo = keys[0], hi = keys[keys.length - 1]
  for (let i = 0; i < keys.length - 1; i++) {
    if (keys[i] <= u && keys[i + 1] >= u) { lo = keys[i]; hi = keys[i + 1]; break }
  }
  if (lo === hi) return tabel[lo] || null
  const t = (u - lo) / (hi - lo)
  const a = tabel[lo], b = tabel[hi]
  if (!a || !b) return null
  return { L: a.L + t*(b.L-a.L), M: a.M + t*(b.M-a.M), S: a.S + t*(b.S-a.S) }
}

function hitungZScore(nilai: number, lms: { L: number; M: number; S: number }): number {
  const { L, M, S } = lms
  let z = Math.abs(L) < 0.001
    ? Math.log(nilai / M) / S
    : (Math.pow(nilai / M, L) - 1) / (L * S)
  if (z > 3) {
    const SD3pos  = M * Math.pow(1 + L * S * 3, 1 / L)
    const SD23pos = SD3pos - M * Math.pow(1 + L * S * 2, 1 / L)
    z = 3 + (nilai - SD3pos) / SD23pos
  } else if (z < -3) {
    const SD3neg  = M * Math.pow(1 + L * S * (-3), 1 / L)
    const SD23neg = M * Math.pow(1 + L * S * (-2), 1 / L) - SD3neg
    z = -3 + (nilai - SD3neg) / SD23neg
  }
  return Math.round(z * 100) / 100
}

// Klasifikasi sesuai nilai CHECK di schema:
// normal, gizi_kurang, gizi_buruk, gizi_lebih, obesitas,
// stunting, stunting_berat, wasting, wasting_berat, overweight
function klasifikasi(zBBU: number|null, zTBU: number|null, zBBTB: number|null): string {
  if (zBBU !== null && zBBU < -3)   return 'gizi_buruk'
  if (zBBTB !== null && zBBTB < -3) return 'wasting_berat'
  if (zBBTB !== null && zBBTB < -2) return 'wasting'
  if (zTBU !== null && zTBU < -3)   return 'stunting_berat'
  if (zTBU !== null && zTBU < -2)   return 'stunting'
  if (zBBU !== null && zBBU < -2)   return 'gizi_kurang'
  if (zBBTB !== null && zBBTB > 3)  return 'obesitas'
  if (zBBTB !== null && zBBTB > 2)  return 'overweight'
  if (zBBU !== null && zBBU > 2)    return 'gizi_lebih'
  return 'normal'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    const { data: { user } } = await supabase.auth.getUser(authHeader?.replace('Bearer ', ''))
    if (!user) return new Response(
      JSON.stringify({ error: 'Tidak terautentikasi' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
    )

    const body = await req.json()
    const { balita_id, tanggal_ukur, berat_badan_kg, tinggi_badan_cm,
            lingkar_kepala_cm, catatan } = body

    if (!balita_id || !berat_badan_kg || !tinggi_badan_cm) return new Response(
      JSON.stringify({ error: 'balita_id, berat_badan_kg, tinggi_badan_cm wajib diisi' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )

    // Ambil data balita
    const { data: balita, error: bErr } = await supabase
      .from('balita').select('tanggal_lahir, jenis_kelamin').eq('id', balita_id).single()
    if (bErr || !balita) return new Response(
      JSON.stringify({ error: 'Balita tidak ditemukan' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
    )

    const tglLahir  = new Date(balita.tanggal_lahir)
    const tglUkur   = tanggal_ukur ? new Date(tanggal_ukur) : new Date()
    const usiaBulan = Math.floor(
      (tglUkur.getFullYear() - tglLahir.getFullYear()) * 12 +
      (tglUkur.getMonth()   - tglLahir.getMonth())
    )

    const isL = balita.jenis_kelamin === 'L'
    const lmsBBU = interpolaseLMS(isL ? WHO_BB_U_L : WHO_BB_U_P, usiaBulan)
    const lmsTBU = interpolaseLMS(isL ? WHO_TB_U_L : WHO_TB_U_P, usiaBulan)

    const zBBU  = lmsBBU ? hitungZScore(berat_badan_kg, lmsBBU) : null
    const zTBU  = lmsTBU ? hitungZScore(tinggi_badan_cm, lmsTBU) : null
    const zBBTB = zBBU !== null && zTBU !== null
      ? Math.round((zBBU - zTBU * 0.5) * 100) / 100
      : null

    const statusGizi = klasifikasi(zBBU, zTBU, zBBTB)

    // Insert ke pengukuran — sesuai nama kolom schema asli
    const { data: pengukuran, error: insErr } = await supabase
      .from('pengukuran')
      .insert({
        balita_id,
        tanggal_ukur:      tglUkur.toISOString().split('T')[0],
        berat_badan_kg:    berat_badan_kg,   
        tinggi_badan_cm:   tinggi_badan_cm,  
        lingkar_kepala_cm: lingkar_kepala_cm || null,
        zscore_bb_u:       zBBU,             
        zscore_tb_u:       zTBU,             
        zscore_bb_tb:      zBBTB,            
        status_gizi:       statusGizi,
        catatan:           catatan || null,
        kader_id:          user.id,
      })
      .select().single()

    if (insErr) return new Response(
      JSON.stringify({ error: 'Gagal simpan pengukuran', detail: insErr.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )

    return new Response(
      JSON.stringify({
        success: true,
        pengukuran,
        zscore:      { bb_u: zBBU, tb_u: zTBU, bb_tb: zBBTB },
        status_gizi: statusGizi,
        usia_bulan:  usiaBulan,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal server error', detail: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})