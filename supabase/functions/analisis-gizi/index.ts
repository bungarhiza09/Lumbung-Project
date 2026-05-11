import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.24.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Upload base64 ke Supabase Storage
async function uploadToSupabase(base64: string, mimeType: string): Promise<string> {
  const SUPABASE_URL = Deno.env.get('PROJECT_URL')
  const SERVICE_KEY = Deno.env.get('SERVICE_ROLE_KEY')

  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error('ENV Supabase belum diset')
  }

  const ext = mimeType?.includes('png') ? 'png' : 'jpg'
  const fileName = `uploads/${crypto.randomUUID()}.${ext}`

  const binary = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))

  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/food-images/${fileName}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': mimeType || 'image/jpeg',
      },
      body: binary,
    }
  )

  if (!res.ok) {
    const err = await res.text()
    console.error('UPLOAD ERROR:', err)
    throw new Error('Upload gambar gagal: ' + err)
  }

  return `${SUPABASE_URL}/storage/v1/object/public/food-images/${fileName}`
}

// Kirim ke Groq dengan model vision llama-4-scout
async function analyzeWithGroq(imageUrl: string): Promise<string> {
  const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')

  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY belum diset')
  }

  const prompt = `Anda adalah ahli gizi Indonesia. Analisis gambar makanan ini.

WAJIB:
- Output HARUS JSON valid saja
- Tanpa markdown, tanpa backtick, tanpa teks tambahan apapun
- Langsung mulai dengan karakter {

Format output:
{
  "makanan_terdeteksi": ["nama makanan 1", "nama makanan 2"],
  "estimasi_porsi": "deskripsi porsi misal: 1 piring sedang sekitar 250g",
  "gizi": {
    "kalori": 350,
    "protein_gram": 15,
    "karbohidrat_gram": 45,
    "lemak_gram": 10
  },
  "catatan": "penjelasan singkat tentang kandungan gizi dan saran"
}`

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
      max_tokens: 1024,
      temperature: 0.2, // rendah supaya output lebih konsisten/deterministik
    }),
  })

  const data = await response.json()
  console.log('FULL GROQ RESPONSE:', JSON.stringify(data, null, 2))

  if (!response.ok) {
    const errMsg = data.error?.message || JSON.stringify(data)
    throw new Error('Groq API error: ' + errMsg)
  }

  const text = data.choices?.[0]?.message?.content
  if (!text) {
    throw new Error('Groq tidak mengembalikan konten')
  }

  return text
}

// Parse teks jadi JSON, dengan fallback
function parseResult(raw: string) {
  // Bersihkan markdown jika ada (```json ... ```)
  const cleaned = raw
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/gi, '')
    .trim()

  // Ambil blok JSON pertama
  const match = cleaned.match(/\{[\s\S]*\}/)

  if (!match) {
    console.error('Tidak ada JSON ditemukan di:', raw)
    return {
      makanan_terdeteksi: [],
      estimasi_porsi: '-',
      gizi: { kalori: 0, protein_gram: 0, karbohidrat_gram: 0, lemak_gram: 0 },
      catatan: 'Format tidak valid dari AI',
      raw,
    }
  }

  try {
    return JSON.parse(match[0])
  } catch (e) {
    console.error('JSON parse error:', e.message, '| Raw:', raw)
    return {
      makanan_terdeteksi: [],
      estimasi_porsi: '-',
      gizi: { kalori: 0, protein_gram: 0, karbohidrat_gram: 0, lemak_gram: 0 },
      catatan: 'Gagal parsing respons AI',
      raw,
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { base64Image, mimeType } = await req.json()

    if (!base64Image) {
      return new Response(
        JSON.stringify({ error: 'base64Image tidak ditemukan di body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Bersihkan prefix data URL jika ada (misal: "data:image/jpeg;base64,...")
    const cleanBase64 = base64Image.includes(',')
      ? base64Image.split(',')[1]
      : base64Image

    // 1. Upload ke Supabase Storage supaya dapat public URL
    const imageUrl = await uploadToSupabase(cleanBase64, mimeType || 'image/jpeg')
    console.log('Image URL:', imageUrl)

    // 2. Kirim URL gambar ke Groq untuk dianalisis
    const rawText = await analyzeWithGroq(imageUrl)
    console.log('GROQ RAW TEXT:', rawText)

    // 3. Parse JSON dari respons
    const result = parseResult(rawText)

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error.message)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})