import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const HARI = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu']

export default function PrediksiSisa({ userId }) {
  const [donasi, setDonasi] = useState([])
  const [prediksi, setPrediksi] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAndAnalyze()
  }, [])

  async function fetchAndAnalyze() {
    const { data } = await supabase
      .from('donasi')
      .select('*')
      .eq('donor_id', userId)
      .order('created_at', { ascending: false })
      .limit(60)

    setDonasi(data || [])
    analyzePola(data || [])
    setLoading(false)
  }

  function analyzePola(data) {
    if (data.length < 3) { setPrediksi([]); return }

    const byHari = {}
    data.forEach(d => {
      const hari = HARI[new Date(d.created_at).getDay() === 0 ? 6 : new Date(d.created_at).getDay() - 1]
      if (!byHari[hari]) byHari[hari] = []
      byHari[hari].push(d.jumlah_porsi || 0)
    })

    const result = Object.entries(byHari).map(([hari, porsiArr]) => {
      const avg = porsiArr.reduce((a, b) => a + b, 0) / porsiArr.length
      const min = Math.min(...porsiArr)
      const max = Math.max(...porsiArr)
      const rekomendasi = Math.round(avg * 0.7)
      return { hari, avg: Math.round(avg), min, max, rekomendasi, count: porsiArr.length }
    }).sort((a, b) => b.avg - a.avg)

    setPrediksi(result)
  }

  const cukupData = donasi.length >= 5

  return (
    <div>
      {/* Info Banner */}
      <div className="bg-[#f0faf4] rounded-2xl p-4 mb-5 border border-[#b7e4cc]">
        <div className="flex items-start gap-3">
          <span className="text-xl">🤖</span>
          <div>
            <p className="text-xs font-semibold text-[#2D6A4F] mb-1">AI Prediksi Sisa Makanan</p>
            <p className="text-xs text-[#5a7a6a] leading-relaxed">
              AI menganalisis pola donasi harianmu untuk memprediksi berapa sisa makanan yang biasanya ada, sehingga kamu bisa masak lebih efisien dan mengurangi food waste.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <div className="text-3xl animate-bounce mb-2">🤖</div>
          <p className="text-xs text-[#9a9a8a]">Menganalisis pola donasimu...</p>
        </div>
      ) : !cukupData ? (
        <div className="text-center py-10 bg-white rounded-2xl border border-[#e8e4db]">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-sm font-medium text-[#4a4a3a]">Data belum cukup</p>
          <p className="text-xs text-[#9a9a8a] mt-2 leading-relaxed px-4">
            AI membutuhkan minimal 5 riwayat donasi untuk mulai belajar pola harianmu.
            Saat ini kamu punya <span className="font-semibold text-[#F4A261]">{donasi.length}</span> donasi.
          </p>
          <div className="mt-4 mx-auto w-32">
            <div className="flex justify-between text-xs text-[#9a9a8a] mb-1">
              <span>{donasi.length}</span><span>5</span>
            </div>
            <div className="bg-[#f0ece4] rounded-full h-2">
              <div
                className="h-2 bg-[#F4A261] rounded-full"
                style={{ width: `${Math.min((donasi.length / 5) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Data Donasi', value: donasi.length, icon: '📋' },
              { label: 'Hari Teranalisis', value: prediksi.length, icon: '📅' },
              { label: 'Potensi Hemat', value: `${Math.round(prediksi.reduce((a,b) => a + (b.avg - b.rekomendasi), 0))} porsi`, icon: '💰' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-[#e8e4db] p-3 text-center">
                <div className="text-xl mb-1">{s.icon}</div>
                <div className="text-sm font-bold text-[#1a3a2a]">{s.value}</div>
                <div className="text-xs text-[#9a9a8a] mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Prediksi per hari */}
          <div className="space-y-3">
            {prediksi.map(p => (
              <div key={p.hari} className="bg-white rounded-2xl border border-[#e8e4db] p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-bold text-[#1a3a2a]">{p.hari}</p>
                    <p className="text-xs text-[#9a9a8a]">Dari {p.count} data donasi</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-[#F4A261]">{p.avg}</div>
                    <div className="text-xs text-[#9a9a8a]">rata-rata porsi</div>
                  </div>
                </div>

                {/* Bar visual */}
                <div className="relative h-2 bg-[#f0ece4] rounded-full mb-3 overflow-hidden">
                  <div className="absolute h-2 bg-red-200 rounded-full"
                    style={{ width: `${Math.min((p.max / (prediksi[0]?.max || 1)) * 100, 100)}%` }} />
                  <div className="absolute h-2 bg-[#F4A261] rounded-full"
                    style={{ width: `${Math.min((p.avg / (prediksi[0]?.max || 1)) * 100, 100)}%` }} />
                  <div className="absolute h-2 bg-[#2D6A4F] rounded-full"
                    style={{ width: `${Math.min((p.rekomendasi / (prediksi[0]?.max || 1)) * 100, 100)}%` }} />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-red-50 rounded-xl p-2">
                    <div className="text-xs font-bold text-red-500">{p.max}</div>
                    <div className="text-[10px] text-[#9a9a8a]">Maks sisa</div>
                  </div>
                  <div className="bg-[#fef3e7] rounded-xl p-2">
                    <div className="text-xs font-bold text-[#F4A261]">{p.avg}</div>
                    <div className="text-[10px] text-[#9a9a8a]">Rata-rata</div>
                  </div>
                  <div className="bg-[#f0faf4] rounded-xl p-2">
                    <div className="text-xs font-bold text-[#2D6A4F]">{p.rekomendasi}</div>
                    <div className="text-[10px] text-[#9a9a8a]">Rekomendasi masak</div>
                  </div>
                </div>

                <div className="mt-3 bg-[#f0faf4] rounded-xl p-2.5 border border-[#b7e4cc]">
                  <p className="text-xs text-[#2D6A4F]">
                    💡 Hari {p.hari} biasanya ada sisa {p.min}-{p.max} porsi.
                    Coba masak <span className="font-bold">{p.rekomendasi} porsi</span> saja
                    untuk kurangi food waste ~{p.avg - p.rekomendasi} porsi.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}