import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { base64Image, mimeType } = await req.json()

    if (!base64Image) {
      return new Response(
        JSON.stringify({ error: 'base64Image wajib diisi' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')

    if (!OPENROUTER_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'API key tidak ditemukan di server' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const prompt = `Kamu adalah ahli gizi Indonesia. Analisis makanan dalam foto ini.
Identifikasi semua makanan/bahan yang terlihat, lalu hitung estimasi kandungan gizi totalnya.
Fokus pada makanan lokal Indonesia (nasi, tempe, tahu, sayuran, ikan, dll).

Balas HANYA dalam format JSON ini, tanpa teks lain apapun, tanpa markdown:
{
  "makanan_terdeteksi": ["nama makanan 1", "nama makanan 2"],
  "estimasi_porsi": "deskripsi singkat porsi",
  "gizi": {
    "kalori": 0,
    "protein_gram": 0,
    "karbohidrat_gram": 0,
    "lemak_gram": 0,
    "zat_besi_mg": 0,
    "vitamin_a_mcg": 0,
    "kalsium_mg": 0
  },
  "penilaian": "baik",
  "catatan": "penjelasan singkat 1-2 kalimat",
  "saran": "saran perbaikan gizi jika ada"
}`

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://lumbung.vercel.app',
        'X-Title': 'LUMBUNG App'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-thinking-exp:free',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType || 'image/jpeg'};base64,${base64Image}`
                }
              },
              {
                type: 'text',
                text: prompt
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 1000
      })
    })

    const data = await response.json()
    console.log('OpenRouter response:', JSON.stringify(data))

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: data.error?.message || 'OpenRouter API Error',
          detail: data
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const text = data.choices?.[0]?.message?.content || ''
    console.log('Raw text dari AI:', text)

    if (!text || text.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'AI mengembalikan response kosong' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Cari JSON di dalam response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return new Response(
        JSON.stringify({ error: 'Format response tidak valid', raw: text }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const hasil = JSON.parse(jsonMatch[0])

    return new Response(
      JSON.stringify(hasil),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})