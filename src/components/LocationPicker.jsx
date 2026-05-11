import { useState, useEffect } from 'react'

const BASE_URL = 'https://www.emsifa.com/api-wilayah-indonesia/api'

export default function LocationPicker({ onChange }) {
  const [provinsi, setProvinsi] = useState([])
  const [kabupaten, setKabupaten] = useState([])
  const [kecamatan, setKecamatan] = useState([])
  const [kelurahan, setKelurahan] = useState([])

  const [selectedProvinsi, setSelectedProvinsi] = useState('')
  const [selectedKabupaten, setSelectedKabupaten] = useState('')
  const [selectedKecamatan, setSelectedKecamatan] = useState('')
  const [selectedKelurahan, setSelectedKelurahan] = useState('')
  const [namaJalan, setNamaJalan] = useState('')

  const [namaProvinsi, setNamaProvinsi] = useState('')
  const [namaKabupaten, setNamaKabupaten] = useState('')
  const [namaKecamatan, setNamaKecamatan] = useState('')
  const [namaKelurahan, setNamaKelurahan] = useState('')

  // Load provinsi saat pertama
  useEffect(() => {
    fetch(`${BASE_URL}/provinces.json`)
      .then(r => r.json())
      .then(data => setProvinsi(data))
  }, [])

  // Load kabupaten saat provinsi dipilih
  useEffect(() => {
    if (!selectedProvinsi) return
    setKabupaten([])
    setKecamatan([])
    setKelurahan([])
    setSelectedKabupaten('')
    setSelectedKecamatan('')
    setSelectedKelurahan('')

    fetch(`${BASE_URL}/regencies/${selectedProvinsi}.json`)
      .then(r => r.json())
      .then(data => setKabupaten(data))
  }, [selectedProvinsi])

  // Load kecamatan saat kabupaten dipilih
  useEffect(() => {
    if (!selectedKabupaten) return
    setKecamatan([])
    setKelurahan([])
    setSelectedKecamatan('')
    setSelectedKelurahan('')

    fetch(`${BASE_URL}/districts/${selectedKabupaten}.json`)
      .then(r => r.json())
      .then(data => setKecamatan(data))
  }, [selectedKabupaten])

  // Load kelurahan saat kecamatan dipilih
  useEffect(() => {
    if (!selectedKecamatan) return
    setKelurahan([])
    setSelectedKelurahan('')

    fetch(`${BASE_URL}/villages/${selectedKecamatan}.json`)
      .then(r => r.json())
      .then(data => setKelurahan(data))
  }, [selectedKecamatan])

  // Kirim data lokasi ke parent setiap ada perubahan
  useEffect(() => {
    const bagian = [
      namaJalan,
      namaKelurahan,
      namaKecamatan,
      namaKabupaten,
      namaProvinsi
    ].filter(Boolean)

    const alamatLengkap = bagian.join(', ')

    onChange({
      alamat: alamatLengkap,
      provinsi: namaProvinsi,
      kabupaten: namaKabupaten,
      kecamatan: namaKecamatan,
      kelurahan: namaKelurahan,
      jalan: namaJalan
    })
  }, [namaJalan, namaKelurahan, namaKecamatan, namaKabupaten, namaProvinsi])

  const selectClass = "w-full px-4 py-3 rounded-xl border border-[#e8e4db] bg-[#faf9f7] text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] transition-all"
  const labelClass = "block text-xs font-medium text-[#4a4a3a] mb-1.5"

  return (
    <div className="space-y-3">

      {/* Provinsi */}
      <div>
        <label className={labelClass}>Provinsi</label>
        <select
          className={selectClass}
          value={selectedProvinsi}
          onChange={e => {
            const opt = e.target.options[e.target.selectedIndex]
            setSelectedProvinsi(e.target.value)
            setNamaProvinsi(opt.text)
          }}
        >
          <option value="">Pilih Provinsi</option>
          {provinsi.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Kabupaten/Kota */}
      <div>
        <label className={labelClass}>Kabupaten / Kota</label>
        <select
          className={selectClass}
          value={selectedKabupaten}
          onChange={e => {
            const opt = e.target.options[e.target.selectedIndex]
            setSelectedKabupaten(e.target.value)
            setNamaKabupaten(opt.text)
          }}
          disabled={!selectedProvinsi}
        >
          <option value="">
            {selectedProvinsi ? 'Pilih Kabupaten/Kota' : 'Pilih provinsi dulu'}
          </option>
          {kabupaten.map(k => (
            <option key={k.id} value={k.id}>{k.name}</option>
          ))}
        </select>
      </div>

      {/* Kecamatan */}
      <div>
        <label className={labelClass}>Kecamatan</label>
        <select
          className={selectClass}
          value={selectedKecamatan}
          onChange={e => {
            const opt = e.target.options[e.target.selectedIndex]
            setSelectedKecamatan(e.target.value)
            setNamaKecamatan(opt.text)
          }}
          disabled={!selectedKabupaten}
        >
          <option value="">
            {selectedKabupaten ? 'Pilih Kecamatan' : 'Pilih kabupaten dulu'}
          </option>
          {kecamatan.map(k => (
            <option key={k.id} value={k.id}>{k.name}</option>
          ))}
        </select>
      </div>

      {/* Kelurahan/Desa */}
      <div>
        <label className={labelClass}>Kelurahan / Desa</label>
        <select
          className={selectClass}
          value={selectedKelurahan}
          onChange={e => {
            const opt = e.target.options[e.target.selectedIndex]
            setSelectedKelurahan(e.target.value)
            setNamaKelurahan(opt.text)
          }}
          disabled={!selectedKecamatan}
        >
          <option value="">
            {selectedKecamatan ? 'Pilih Kelurahan/Desa' : 'Pilih kecamatan dulu'}
          </option>
          {kelurahan.map(k => (
            <option key={k.id} value={k.id}>{k.name}</option>
          ))}
        </select>
      </div>

      {/* Nama Jalan */}
      <div>
        <label className={labelClass}>Nama Jalan / Detail Alamat</label>
        <input
          type="text"
          value={namaJalan}
          onChange={e => setNamaJalan(e.target.value)}
          placeholder="contoh: Jl. Sudirman No. 10"
          className={selectClass}
        />
      </div>

      {/* Preview Alamat */}
      {namaKabupaten && (
        <div className="bg-[#f0faf4] rounded-xl p-3 border border-[#b7e4cc]">
          <p className="text-xs text-[#5a7a6a] font-medium mb-1">
            📍 Preview alamat:
          </p>
          <p className="text-xs text-[#2D6A4F]">
            {[namaJalan, namaKelurahan, namaKecamatan, namaKabupaten, namaProvinsi]
              .filter(Boolean)
              .join(', ')}
          </p>
        </div>
      )}
    </div>
  )
}