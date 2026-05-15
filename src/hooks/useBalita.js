// src/hooks/useBalita.js — FIXED: sesuai schema asli + no infinite loop
import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// ─── BALITA LIST ──────────────────────────────────────────────
export function useBalitaList() {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const fetch = useCallback(async (filters = {}) => {
    setLoading(true)
    setError(null)
    try {
      let query = supabase
        .from('v_balita_dengan_status')
        .select('*')
        .order('nama')

      if (filters.wilayah_id)             query = query.eq('wilayah_id', filters.wilayah_id)
      if (filters.status_gizi)            query = query.eq('status_gizi', filters.status_gizi)
      if (filters.search)                 query = query.ilike('nama', `%${filters.search}%`)
      if (filters.usia_min !== undefined) query = query.gte('usia_bulan_sekarang', filters.usia_min)
      if (filters.usia_max !== undefined) query = query.lte('usia_bulan_sekarang', filters.usia_max)

      const { data: rows, error: err } = await query
      if (err) throw err
      setData(rows || [])
    } catch (e) {
      setError(e.message)
      setData([])
    } finally {
      setLoading(false)
    }
  }, []) // [] stabil — tidak berubah tiap render

  return { data, loading, error, fetch }
}

// ─── BALITA DETAIL ────────────────────────────────────────────
export function useBalitaDetail(id) {
  const [data, setData]       = useState(null)
  const [riwayat, setRiwayat] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const fetch = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const [{ data: balita, error: e1 }, { data: ukur, error: e2 }] = await Promise.all([
        supabase.from('v_balita_dengan_status').select('*').eq('id', id).single(),
        supabase.from('pengukuran')
          .select('*')
          .eq('balita_id', id)
          .order('tanggal_ukur', { ascending: false }),
      ])
      if (e1) throw e1
      if (e2) throw e2
      setData(balita)
      setRiwayat(ukur || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [id])

  return { data, riwayat, loading, error, fetch }
}

// ─── TAMBAH BALITA ────────────────────────────────────────────
export function useTambahBalita() {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const tambah = useCallback(async (payload) => {
    setLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      // Sesuaikan nama kolom dengan schema: nama_ortu, no_hp_ortu
      const { nama, nik, tanggal_lahir, jenis_kelamin,
              nama_orang_tua, no_hp_orang_tua, alamat,
              rt, rw, wilayah_id, posyandu_id } = payload

      const { data, error: err } = await supabase
        .from('balita')
        .insert({
          nama,
          nik:          nik || null,
          tanggal_lahir,
          jenis_kelamin,
          nama_ortu:    nama_orang_tua || null,  // kolom asli: nama_ortu
          no_hp_ortu:   no_hp_orang_tua || null, // kolom asli: no_hp_ortu
          alamat:       alamat || null,
          rt:           rt || null,
          rw:           rw || null,
          wilayah_id,
          posyandu_id:  posyandu_id || null,
          kader_id:     user.id,
        })
        .select()
        .single()

      if (err) throw err
      return { success: true, data }
    } catch (e) {
      setError(e.message)
      return { success: false, error: e.message }
    } finally {
      setLoading(false)
    }
  }, [])

  return { tambah, loading, error }
}

// ─── INPUT PENGUKURAN (via Edge Function hitung-zscore) ───────
export function useInputPengukuran() {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [result, setResult]   = useState(null)

  const simpan = useCallback(async (payload) => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const { data, error: err } = await supabase.functions.invoke('hitung-zscore', {
        body: payload,
      })
      if (err) throw new Error(err.message || 'Edge function error')
      if (data?.error) throw new Error(data.error)
      setResult(data)
      return { success: true, data }
    } catch (e) {
      setError(e.message)
      return { success: false, error: e.message }
    } finally {
      setLoading(false)
    }
  }, [])

  return { simpan, loading, error, result }
}

// ─── IMPORT EXCEL ─────────────────────────────────────────────
export function useImportBalita() {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [result, setResult]   = useState(null)

  const importData = useCallback(async ({ rows, wilayah_id, posyandu_id }) => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const { data, error: err } = await supabase.functions.invoke('import-balita-excel', {
        body: { rows, wilayah_id, posyandu_id },
      })
      if (err) throw new Error(err.message || 'Edge function error')
      if (data?.error) throw new Error(data.error)
      setResult(data.result)
      return { success: true, result: data.result }
    } catch (e) {
      setError(e.message)
      return { success: false, error: e.message }
    } finally {
      setLoading(false)
    }
  }, [])

  return { importData, loading, error, result }
}

// ─── STATISTIK WILAYAH (heatmap) ──────────────────────────────
export function useStatistikWilayah() {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: rows, error: err } = await supabase
        .from('v_statistik_wilayah')
        .select('*')
      if (err) throw err
      setData(rows || [])
    } catch (e) {
      setError(e.message)
      setData([])
    } finally {
      setLoading(false)
    }
  }, [])

  return { data, loading, error, fetch }
}

// ─── TREN GIZI BULANAN ────────────────────────────────────────
export function useTrenGizi() {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const fetch = useCallback(async (wilayahId = null) => {
    setLoading(true)
    setError(null)
    try {
      let query = supabase
        .from('v_tren_gizi_bulanan')
        .select('*')
        .order('bulan', { ascending: true })
        .limit(12)

      if (wilayahId) query = query.eq('wilayah_id', wilayahId)

      const { data: rows, error: err } = await query
      if (err) throw err
      setData(rows || [])
    } catch (e) {
      setError(e.message)
      setData([])
    } finally {
      setLoading(false)
    }
  }, [])

  return { data, loading, error, fetch }
}

// ─── ALERT CLUSTER ────────────────────────────────────────────
export function useAlertCluster() {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: rows, error: err } = await supabase
        .from('alert_cluster')
        .select(`
          *,
          wilayah (
            nama_kelurahan,
            nama_kecamatan,
            nama_kabupaten
          )
        `)
        .eq('status', 'aktif')
        .order('created_at', { ascending: false })
      if (err) throw err
      // Normalisasi: map nama_kelurahan → kelurahan agar komponen tidak perlu tahu detail kolom
      const normalized = (rows || []).map(r => ({
        ...r,
        wilayah: r.wilayah ? {
          kelurahan: r.wilayah.nama_kelurahan,
          kecamatan: r.wilayah.nama_kecamatan,
          kabupaten: r.wilayah.nama_kabupaten,
        } : null,
      }))
      setData(normalized)
    } catch (e) {
      setError(e.message)
      setData([])
    } finally {
      setLoading(false)
    }
  }, [])

  const tandaiDitangani = useCallback(async (alertId, catatan) => {
    try {
      const { error: err } = await supabase
        .from('alert_cluster')
        .update({
          status:                'ditangani',
          catatan_tindak_lanjut: catatan,  // kolom asli: catatan_tindak_lanjut
          updated_at:            new Date().toISOString(),
        })
        .eq('id', alertId)
      if (err) throw err
      return { success: true }
    } catch (e) {
      return { success: false, error: e.message }
    }
  }, [])

  return { data, loading, error, fetch, tandaiDitangani }
}

// ─── WILAYAH ──────────────────────────────────────────────────
export function useWilayah() {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(false)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const { data: rows, error: err } = await supabase
        .from('wilayah')
        .select('id, nama_kelurahan, nama_kecamatan, nama_kabupaten, nama_provinsi, lat, lng')
        .order('nama_kelurahan')
      if (!err) {
        // Normalisasi nama kolom agar komponen pakai .kelurahan dll
        const normalized = (rows || []).map(w => ({
          ...w,
          kelurahan: w.nama_kelurahan,
          kecamatan: w.nama_kecamatan,
          kabupaten: w.nama_kabupaten,
          provinsi:  w.nama_provinsi,
        }))
        setData(normalized)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  return { data, loading, fetch }
}

// ─── EXPORT LAPORAN PDF ───────────────────────────────────────
export function useExportLaporan() {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const exportPDF = useCallback(async ({ wilayah_id, periode_mulai, periode_akhir }) => {
    setLoading(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) throw new Error('Sesi login tidak ditemukan, silakan login ulang')

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const res = await window.fetch(
        `${supabaseUrl}/functions/v1/generate-laporan-pdf`,
        {
          method: 'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${token}`,
            'apikey':        import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ wilayah_id, periode_mulai, periode_akhir }),
        }
      )

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        throw new Error(errBody.error || `HTTP ${res.status}`)
      }

      const html = await res.text()
      const printWindow = window.open('', '_blank')
      if (!printWindow) throw new Error('Pop-up diblokir browser. Izinkan pop-up untuk site ini.')
      printWindow.document.write(html)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => printWindow.print(), 800)

      return { success: true }
    } catch (e) {
      setError(e.message)
      return { success: false, error: e.message }
    } finally {
      setLoading(false)
    }
  }, [])

  return { exportPDF, loading, error }
}