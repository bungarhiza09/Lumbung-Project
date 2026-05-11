// supabase/functions/import-balita-excel/index.ts
// Edge Function: Import data balita dari file Excel (.xlsx/.csv)
// Deploy: supabase functions deploy import-balita-excel

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as XLSX from 'https://esm.sh/xlsx@0.18.5'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ─────────────────────────────────────────
// Mapping kolom Excel yang fleksibel
// (mendukung header bahasa Indonesia/Inggris)
// ─────────────────────────────────────────
const KOLOM_MAP: Record<string, string[]> = {
  nama:          ['nama', 'name', 'nama balita', 'nama anak'],
  tanggal_lahir: ['tanggal lahir', 'tgl lahir', 'birth date', 'tgl_lahir', 'tanggal_lahir', 'dob'],
  jenis_kelamin: ['jenis kelamin', 'jk', 'gender', 'kelamin', 'sex', 'jenis_kelamin'],
  berat_kg:      ['berat', 'bb', 'berat badan', 'weight', 'bb (kg)', 'berat (kg)', 'berat_kg'],
  tinggi_cm:     ['tinggi', 'tb', 'tinggi badan', 'height', 'tb (cm)', 'tinggi (cm)', 'tinggi_cm', 'panjang', 'pb'],
  nama_ortu:     ['nama ortu', 'nama ibu', 'nama ayah', 'orang tua', 'nama_ortu', 'ibu'],
  no_hp_ortu:    ['no hp', 'no. hp', 'hp', 'telp', 'phone', 'no_hp', 'no hp ortu'],
  nik:           ['nik', 'no nik', 'nomor nik'],
  rt:            ['rt'],
  rw:            ['rw'],
  alamat:        ['alamat', 'address'],
}

function normalizeHeader(header: string): string {
  return header.toLowerCase().trim().replace(/\s+/g, ' ')
}

function mapKolom(headers: string[]): Record<string, number> {
  const normalized = headers.map(normalizeHeader)
  const result: Record<string, number> = {}

  for (const [field, aliases] of Object.entries(KOLOM_MAP)) {
    for (const alias of aliases) {
      const idx = normalized.indexOf(alias)
      if (idx !== -1) {
        result[field] = idx
        break
      }
    }
  }

  return result
}

function parseDate(val: unknown): string | null {
  if (!val) return null
  
  // Excel serial date number
  if (typeof val === 'number') {
    const date = XLSX.SSF.parse_date_code(val)
    if (date) {
      return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`
    }
  }
  
  // String formats
  if (typeof val === 'string') {
    const cleaned = val.trim()
    
    // DD/MM/YYYY atau DD-MM-YYYY
    const ddmmyyyy = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
    if (ddmmyyyy) {
      return `${ddmmyyyy[3]}-${String(ddmmyyyy[2]).padStart(2, '0')}-${String(ddmmyyyy[1]).padStart(2, '0')}`
    }
    
    // YYYY-MM-DD (sudah ISO)
    const isoDate = cleaned.match(/^\d{4}-\d{2}-\d{2}$/)
    if (isoDate) return cleaned
    
    // Coba parse natural
    const parsed = new Date(cleaned)
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0]
    }
  }
  
  return null
}

function parseGender(val: unknown): 'L' | 'P' | null {
  if (!val) return null
  const v = String(val).toLowerCase().trim()
  if (['l', 'laki', 'laki-laki', 'male', 'm', '1'].includes(v)) return 'L'
  if (['p', 'perempuan', 'female', 'f', 'wanita', 'pr', '2'].includes(v)) return 'P'
  return null
}

function parseNumber(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null
  const n = parseFloat(String(val).replace(',', '.'))
  return isNaN(n) ? null : n
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Ambil token user dari header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verifikasi user
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    })
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token tidak valid' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse form data (file upload)
    const formData = await req.formData()
    const file = formData.get('file') as File
    const wilayahId = formData.get('wilayah_id') as string
    const posyanduId = formData.get('posyandu_id') as string | null

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'File tidak ditemukan. Kirim file dengan field name "file"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!wilayahId) {
      return new Response(
        JSON.stringify({ error: 'wilayah_id wajib diisi' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Baca file
    const buffer = await file.arrayBuffer()
    const uint8 = new Uint8Array(buffer)
    
    let rows: Record<string, unknown>[] = []

    // Parse berdasarkan tipe file
    const fileName = file.name.toLowerCase()
    
    if (fileName.endsWith('.csv')) {
      // Parse CSV
      const text = new TextDecoder().decode(uint8)
      const workbook = XLSX.read(text, { type: 'string' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      // Parse Excel
      const workbook = XLSX.read(uint8, { type: 'array', cellDates: false })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: true })
    } else {
      return new Response(
        JSON.stringify({ error: 'Format file tidak didukung. Gunakan .xlsx, .xls, atau .csv' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (rows.length === 0) {
      return new Response(
        JSON.stringify({ error: 'File kosong atau tidak ada data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Deteksi mapping kolom dari header baris pertama
    const headers = Object.keys(rows[0])
    const kolomMap = mapKolom(headers)

    // Validasi kolom wajib ada
    const required = ['nama', 'tanggal_lahir', 'jenis_kelamin']
    const missing = required.filter(k => kolomMap[k] === undefined)
    if (missing.length > 0) {
      return new Response(
        JSON.stringify({
          error: `Kolom wajib tidak ditemukan: ${missing.join(', ')}`,
          kolom_terdeteksi: headers,
          petunjuk: 'Pastikan file memiliki kolom: Nama, Tanggal Lahir, Jenis Kelamin'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ─────────────────────────────────────────
    // Proses tiap baris
    // ─────────────────────────────────────────
    const berhasil: unknown[] = []
    const gagal: { baris: number; nama: string; alasan: string }[] = []
    const balitaToInsert: Record<string, unknown>[] = []
    const pengukuranToProcess: {
      balita_idx: number
      berat_kg: number
      tinggi_cm: number
    }[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const baris = i + 2 // +2 karena baris 1 = header

      const getVal = (field: string) => {
        const idx = kolomMap[field]
        if (idx === undefined) return ''
        const headerName = headers[idx]
        return row[headerName]
      }

      const nama = String(getVal('nama') || '').trim()
      if (!nama) {
        gagal.push({ baris, nama: '-', alasan: 'Nama kosong' })
        continue
      }

      const tanggalLahir = parseDate(getVal('tanggal_lahir'))
      if (!tanggalLahir) {
        gagal.push({ baris, nama, alasan: 'Format tanggal lahir tidak valid' })
        continue
      }

      const jenisKelamin = parseGender(getVal('jenis_kelamin'))
      if (!jenisKelamin) {
        gagal.push({ baris, nama, alasan: 'Jenis kelamin tidak dikenali (gunakan L/P)' })
        continue
      }

      const beratKg = parseNumber(getVal('berat_kg'))
      const tinggiCm = parseNumber(getVal('tinggi_cm'))

      // Validasi berat/tinggi jika ada
      if (beratKg !== null && (beratKg < 0.5 || beratKg > 50)) {
        gagal.push({ baris, nama, alasan: `Berat badan tidak wajar: ${beratKg} kg` })
        continue
      }
      if (tinggiCm !== null && (tinggiCm < 30 || tinggiCm > 130)) {
        gagal.push({ baris, nama, alasan: `Tinggi badan tidak wajar: ${tinggiCm} cm` })
        continue
      }

      balitaToInsert.push({
        nama,
        tanggal_lahir: tanggalLahir,
        jenis_kelamin: jenisKelamin,
        nik: String(getVal('nik') || '').trim() || null,
        nama_ortu: String(getVal('nama_ortu') || '').trim() || null,
        no_hp_ortu: String(getVal('no_hp_ortu') || '').trim() || null,
        rt: String(getVal('rt') || '').trim() || null,
        rw: String(getVal('rw') || '').trim() || null,
        alamat: String(getVal('alamat') || '').trim() || null,
        wilayah_id: wilayahId,
        posyandu_id: posyanduId || null,
        kader_id: user.id,
      })

      // Jika ada data berat & tinggi, tandai untuk diproses pengukuran
      if (beratKg !== null && tinggiCm !== null) {
        pengukuranToProcess.push({
          balita_idx: balitaToInsert.length - 1,
          berat_kg: beratKg,
          tinggi_cm: tinggiCm,
        })
      }
    }

    if (balitaToInsert.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'Tidak ada data valid untuk diimport',
          gagal,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ─────────────────────────────────────────
    // Insert balita ke database (batch)
    // ─────────────────────────────────────────
    const { data: insertedBalita, error: insertError } = await supabase
      .from('balita')
      .insert(balitaToInsert)
      .select('id, nama')

    if (insertError) {
      return new Response(
        JSON.stringify({
          error: 'Gagal menyimpan data balita',
          detail: insertError.message,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    berhasil.push(...(insertedBalita || []))

    // ─────────────────────────────────────────
    // Proses pengukuran untuk balita yang punya data BB/TB
    // Panggil Edge Function hitung-zscore untuk tiap balita
    // ─────────────────────────────────────────
    const pengukuranResults = []
    for (const pm of pengukuranToProcess) {
      const balitaId = insertedBalita?.[pm.balita_idx]?.id
      if (!balitaId) continue

      // Hitung z-score langsung menggunakan Postgres function
      const { data: zscore } = await supabase.rpc('hitung_zscore_dan_simpan', {
        p_balita_id: balitaId,
        p_berat_kg: pm.berat_kg,
        p_tinggi_cm: pm.tinggi_cm,
        p_kader_id: user.id,
      })

      pengukuranResults.push({ balita_id: balitaId, zscore })
    }

    return new Response(
      JSON.stringify({
        success: true,
        ringkasan: {
          total_baris: rows.length,
          berhasil: berhasil.length,
          dengan_pengukuran: pengukuranResults.length,
          gagal: gagal.length,
        },
        data_berhasil: berhasil,
        data_gagal: gagal,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Import error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error', detail: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})