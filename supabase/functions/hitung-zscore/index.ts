// supabase/functions/hitung-zscore/index.ts
// Edge Function: Hitung Z-score WHO + klasifikasi status gizi
// Deploy: supabase functions deploy hitung-zscore

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ─────────────────────────────────────────
// Tabel referensi WHO LMS (sample values)
// Dalam produksi, data ini tersimpan di tabel who_reference Supabase
// ─────────────────────────────────────────
interface WHORef {
  L: number; M: number; S: number
}

// Fungsi hitung z-score menggunakan LMS method
function hitungZscore(x: number, ref: WHORef): number {
  const { L, M, S } = ref
  let z: number
  if (L === 0) {
    z = Math.log(x / M) / S
  } else {
    z = ((x / M) ** L - 1) / (L * S)
  }
  // Cap di ±6
  return Math.max(-6, Math.min(6, Math.round(z * 100) / 100))
}

// Klasifikasi status gizi berdasarkan z-score
function klasifikasiStatusGizi(zBBU: number | null, zTBU: number | null, zBBTB: number | null) {
  const flags: string[] = []
  let statusUtama = 'normal'

  // BB/U classification
  if (zBBU !== null) {
    if (zBBU < -3) flags.push('gizi_buruk')
    else if (zBBU < -2) flags.push('gizi_kurang')
    else if (zBBU > 2) flags.push('gizi_lebih')
    else flags.push('normal_bbu')
  }

  // TB/U classification (stunting)
  if (zTBU !== null) {
    if (zTBU < -3) flags.push('stunting_berat')
    else if (zTBU < -2) flags.push('stunting')
    else flags.push('normal_tbu')
  }

  // BB/TB classification (wasting)
  if (zBBTB !== null) {
    if (zBBTB < -3) flags.push('wasting_berat')
    else if (zBBTB < -2) flags.push('wasting')
    else if (zBBTB > 3) flags.push('obesitas')
    else if (zBBTB > 2) flags.push('overweight')
    else flags.push('normal_bbtb')
  }

  // Prioritas status utama
  if (flags.includes('gizi_buruk') || flags.includes('wasting_berat')) statusUtama = 'gizi_buruk'
  else if (flags.includes('wasting')) statusUtama = 'wasting'
  else if (flags.includes('stunting_berat')) statusUtama = 'stunting_berat'
  else if (flags.includes('stunting')) statusUtama = 'stunting'
  else if (flags.includes('gizi_kurang')) statusUtama = 'gizi_kurang'
  else if (flags.includes('obesitas')) statusUtama = 'obesitas'
  else if (flags.includes('overweight')) statusUtama = 'overweight'

  return {
    status_utama: statusUtama,
    flags,
    is_stunting: flags.includes('stunting') || flags.includes('stunting_berat'),
    is_wasting: flags.includes('wasting') || flags.includes('wasting_berat'),
    is_gizi_buruk: flags.includes('gizi_buruk'),
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const body = await req.json()
    const {
      balita_id,
      tanggal_ukur,
      berat_kg,
      tinggi_cm,
      lingkar_kepala_cm,
      catatan,
      kader_id,
    } = body

    // Validasi input
    if (!balita_id || !berat_kg || !tinggi_cm) {
      return new Response(
        JSON.stringify({ error: 'balita_id, berat_kg, tinggi_cm wajib diisi' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Ambil data balita (tanggal lahir, jenis kelamin)
    const { data: balita, error: balitaError } = await supabase
      .from('balita')
      .select('tanggal_lahir, jenis_kelamin')
      .eq('id', balita_id)
      .single()

    if (balitaError || !balita) {
      return new Response(
        JSON.stringify({ error: 'Balita tidak ditemukan' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const tglUkur = tanggal_ukur ? new Date(tanggal_ukur) : new Date()
    const tglLahir = new Date(balita.tanggal_lahir)
    const umurBulan = Math.floor(
      (tglUkur.getFullYear() - tglLahir.getFullYear()) * 12 +
      (tglUkur.getMonth() - tglLahir.getMonth())
    )
    const gender = balita.jenis_kelamin // 'L' atau 'P'
    const genderSuffix = gender === 'L' ? 'boys' : 'girls'

    // ─────────────────────────────────────────
    // Ambil referensi WHO dari database
    // ─────────────────────────────────────────

    // Z-score BB/U (wfa = weight-for-age)
    const { data: refBBU } = await supabase
      .from('who_reference')
      .select('l_value, m_value, s_value')
      .eq('indicator', `wfa_${genderSuffix}`)
      .eq('age_months', Math.min(umurBulan, 60)) // max 60 bulan
      .single()

    // Z-score TB/U (lhfa = length/height-for-age)
    const { data: refTBU } = await supabase
      .from('who_reference')
      .select('l_value, m_value, s_value')
      .eq('indicator', `lhfa_${genderSuffix}`)
      .eq('age_months', Math.min(umurBulan, 60))
      .single()

    // Z-score BB/TB (wflh = weight-for-length/height)
    const tinggiRound = Math.round(tinggi_cm * 10) / 10
    const { data: refBBTB } = await supabase
      .from('who_reference')
      .select('l_value, m_value, s_value')
      .eq('indicator', `wflh_${genderSuffix}`)
      .eq('measurement', tinggiRound)
      .single()

    // Hitung Z-score
    let zBBU: number | null = null
    let zTBU: number | null = null
    let zBBTB: number | null = null

    if (refBBU) {
      zBBU = hitungZscore(berat_kg, { L: refBBU.l_value, M: refBBU.m_value, S: refBBU.s_value })
    }
    if (refTBU) {
      zTBU = hitungZscore(tinggi_cm, { L: refTBU.l_value, M: refTBU.m_value, S: refTBU.s_value })
    }
    if (refBBTB) {
      zBBTB = hitungZscore(berat_kg, { L: refBBTB.l_value, M: refBBTB.m_value, S: refBBTB.s_value })
    }

    // Klasifikasi status
    const statusDetail = klasifikasiStatusGizi(zBBU, zTBU, zBBTB)

    // Simpan pengukuran ke database
    const { data: pengukuran, error: insertError } = await supabase
      .from('pengukuran')
      .insert({
        balita_id,
        tanggal_ukur: tglUkur.toISOString().split('T')[0],
        berat_kg,
        tinggi_cm,
        lingkar_kepala_cm: lingkar_kepala_cm || null,
        zscore_bbu: zBBU,
        zscore_tbu: zTBU,
        zscore_bbtb: zBBTB,
        status_gizi: statusDetail.status_utama,
        status_detail: statusDetail,
        catatan: catatan || null,
        kader_id,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return new Response(
        JSON.stringify({ error: 'Gagal menyimpan pengukuran', detail: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          ...pengukuran,
          umur_bulan: umurBulan,
          status_detail: statusDetail,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error', detail: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})