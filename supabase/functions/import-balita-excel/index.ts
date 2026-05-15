// supabase/functions/import-balita-excel/index.ts
// UPDATED: support kolom provinsi/kabupaten/kecamatan/kelurahan dari Excel
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BalitaRow {
  nama: string
  nik?: string
  tanggal_lahir: string
  jenis_kelamin: string
  nama_orang_tua?: string
  no_hp_orang_tua?: string
  // Kolom wilayah dari Excel (opsional)
  provinsi?: string
  kabupaten?: string
  kecamatan?: string
  kelurahan?: string
  alamat_jalan?: string
  rt?: string
  rw?: string
  // Pengukuran awal (opsional)
  berat_badan_kg?: number
  tinggi_badan_cm?: number
  tanggal_ukur?: string
}

function normalisasiTanggal(input: string): string | null {
  if (!input) return null
  const s = String(input).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  const m1 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (m1) return `${m1[3]}-${m1[2].padStart(2,'0')}-${m1[1].padStart(2,'0')}`
  const m2 = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/)
  if (m2) return `${m2[3]}-${m2[2].padStart(2,'0')}-${m2[1].padStart(2,'0')}`
  const serial = Number(s)
  if (!isNaN(serial) && serial > 40000) {
    const d = new Date(new Date(1899,11,30).getTime() + serial * 86400000)
    return d.toISOString().split('T')[0]
  }
  return null
}

function normalisasiJK(input: string): 'L' | 'P' | null {
  const v = String(input || '').trim().toUpperCase()
  if (['L','LAKI','LAKI-LAKI','LAKILAKI','M','MALE','BOY'].includes(v)) return 'L'
  if (['P','PEREMPUAN','WANITA','F','FEMALE','GIRL'].includes(v)) return 'P'
  return null
}

function validasi(row: BalitaRow): string | null {
  if (!row.nama || String(row.nama).trim().length < 2)
    return 'Nama balita tidak valid (minimal 2 karakter)'
  const tgl = normalisasiTanggal(String(row.tanggal_lahir))
  if (!tgl) return 'Format tanggal lahir tidak valid (gunakan DD/MM/YYYY)'
  const usia = (Date.now() - new Date(tgl).getTime()) / (1000*60*60*24*365.25)
  if (usia < 0) return 'Tanggal lahir tidak boleh di masa depan'
  if (usia > 5) return 'Balita harus berusia 0–5 tahun'
  if (!normalisasiJK(String(row.jenis_kelamin)))
    return 'Jenis kelamin tidak valid (isi L atau P)'
  if (row.berat_badan_kg) {
    const bb = Number(row.berat_badan_kg)
    if (isNaN(bb) || bb < 0.5 || bb > 40) return 'Berat badan tidak valid (0.5–40 kg)'
  }
  if (row.tinggi_badan_cm) {
    const tb = Number(row.tinggi_badan_cm)
    if (isNaN(tb) || tb < 30 || tb > 130) return 'Tinggi badan tidak valid (30–130 cm)'
  }
  return null
}

// Cache wilayah_id agar tidak query berulang untuk baris yang sama
const wilayahCache: Record<string, string> = {}

async function getWilayahId(
  supabase: any,
  row: BalitaRow,
  defaultWilayahId: string
): Promise<string> {
  const kel = String(row.kelurahan || '').trim()
  const kec = String(row.kecamatan || '').trim()

  // Kalau tidak ada kolom kelurahan/kecamatan → pakai default
  if (!kel || !kec) return defaultWilayahId

  const cacheKey = `${kel.toLowerCase()}|${kec.toLowerCase()}`
  if (wilayahCache[cacheKey]) return wilayahCache[cacheKey]

  // Pakai PostgreSQL function upsert_wilayah
  // Ganti bagian ini:
    const { data, error } = await supabase.rpc('upsert_wilayah', {
      p_kelurahan: kel,
      p_kecamatan: kec,
      p_kabupaten: String(row.kabupaten || '').trim() || null,
      p_provinsi:  String(row.provinsi  || '').trim() || null,
    })

    // Tambahkan error handling:
    if (error) {
      console.error('upsert_wilayah error:', error.message)
      return defaultWilayahId  // fallback ke default
    }

    const id = data || defaultWilayahId
  wilayahCache[cacheKey] = id
  return id
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    const { data: { user } } = await supabase.auth.getUser(authHeader?.replace('Bearer ',''))
    if (!user) return new Response(
      JSON.stringify({ error: 'Tidak terautentikasi' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
    )

    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()
    if (!profile || profile.role !== 'kader') return new Response(
      JSON.stringify({ error: 'Hanya kader yang bisa import data balita' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
    )

    const body = await req.json()
    const { rows, wilayah_id: defaultWilayahId, posyandu_id } = body

    if (!rows || !Array.isArray(rows) || rows.length === 0)
      return new Response(JSON.stringify({ error: 'Data kosong' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
    if (!defaultWilayahId)
      return new Response(JSON.stringify({ error: 'wilayah_id default wajib diisi' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
    if (rows.length > 500)
      return new Response(JSON.stringify({ error: 'Maksimal 500 data per import' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })

    const result = {
      total: rows.length, berhasil: 0, gagal: 0,
      errors: [] as { baris: number; nama: string; pesan: string }[],
      inserted_ids: [] as string[],
    }

    for (let i = 0; i < rows.length; i++) {
      const row   = rows[i]
      const baris = i + 2

      const errMsg = validasi(row)
      if (errMsg) {
        result.gagal++
        result.errors.push({ baris, nama: row.nama || `Baris ${baris}`, pesan: errMsg })
        continue
      }

      try {
        // Resolve wilayah — dari kolom Excel atau pakai default
        const wilayahId = await getWilayahId(supabase, row, defaultWilayahId)

        // Susun alamat lengkap dari kolom Excel
        const alamat = [
          String(row.alamat_jalan || '').trim(),
          row.rt ? `RT ${String(row.rt).trim()}` : '',
          row.rw ? `RW ${String(row.rw).trim()}` : '',
          String(row.kelurahan || '').trim(),
          String(row.kecamatan || '').trim(),
          String(row.kabupaten || '').trim(),
          String(row.provinsi  || '').trim(),
        ].filter(Boolean).join(', ')

        const { data: baru, error: insErr } = await supabase
          .from('balita')
          .insert({
            nama:          String(row.nama).trim(),
            nik:           row.nik ? String(row.nik).trim() : null,
            tanggal_lahir: normalisasiTanggal(String(row.tanggal_lahir)),
            jenis_kelamin: normalisasiJK(String(row.jenis_kelamin)),
            nama_ortu:     row.nama_orang_tua  ? String(row.nama_orang_tua).trim()  : null,
            no_hp_ortu:    row.no_hp_orang_tua ? String(row.no_hp_orang_tua).trim() : null,
            alamat:        alamat || null,
            rt:            row.rt ? String(row.rt).trim() : null,
            rw:            row.rw ? String(row.rw).trim() : null,
            wilayah_id:    wilayahId,
            posyandu_id:   posyandu_id || null,
            kader_id:      user.id,
          })
          .select('id')
          .single()

        if (insErr) {
          result.gagal++
          result.errors.push({ baris, nama: row.nama,
            pesan: insErr.code === '23505' ? 'NIK sudah terdaftar' : `Gagal: ${insErr.message}` })
          continue
        }

        // Insert pengukuran awal jika BB & TB tersedia
        if (row.berat_badan_kg && row.tinggi_badan_cm && baru) {
          const tglUkur = row.tanggal_ukur
            ? normalisasiTanggal(String(row.tanggal_ukur))
            : new Date().toISOString().split('T')[0]
          const tglLahir  = new Date(normalisasiTanggal(String(row.tanggal_lahir))!)
          const tglUkurD  = new Date(tglUkur!)
          const usiaBulan = Math.floor(
            (tglUkurD.getFullYear() - tglLahir.getFullYear()) * 12 +
            (tglUkurD.getMonth()   - tglLahir.getMonth())
          )
          await supabase.from('pengukuran').insert({
            balita_id:    baru.id,
            tanggal_ukur: tglUkur,
            berat_kg:     Number(row.berat_badan_kg),
            tinggi_cm:    Number(row.tinggi_badan_cm),
            kader_id:     user.id,
          })
        }

        result.berhasil++
        result.inserted_ids.push(baru!.id)
      } catch (e) {
        result.gagal++
        result.errors.push({ baris, nama: row.nama, pesan: `Error: ${e.message}` })
      }
    }

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal server error', detail: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})