import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.24.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Verifikasi user login via JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Tidak ada token autentikasi')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('User tidak valid')

    // 2. Ambil gambar dari request (base64)
    const { imageBase64, mediaType, childId } = await req.json()
    
    // 3. Inisialisasi Claude — API key aman di sini, tidak pernah ke browser!
    const anthropic = new Anthropic({
      apiKey: Deno.env.get('CLAUDE_API_KEY')!,
    })

    // 4. Kirim ke Claude Vision dengan prompt khusus makanan Indonesia
    const response = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType || "image/jpeg",
                data: imageBase64,
              },
            },
            {
              type: "text",
              text: `Kamu adalah ahli gizi yang spesialis makanan Indonesia. Analisis gambar makanan ini.

Identifikasi semua bahan makanan yang terlihat dan estimasi kandungan gizinya.
Fokus pada makanan lokal Indonesia seperti tempe, tahu, nasi, sayuran lokal, ikan, dll.

Berikan response HANYA dalam format JSON berikut (tanpa teks lain):
{
  "foods_detected": [
    {
      "name": "nama makanan dalam bahasa Indonesia",
      "estimated_portion_gram": 100,
      "calories": 0,
      "protein_g": 0,
      "carbs_g": 0,
      "fat_g": 0,
      "iron_mg": 0,
      "vitamin_a_mcg": 0,
      "calcium_mg": 0
    }
  ],
  "total": {
    "calories": 0,
    "protein_g": 0,
    "carbs_g": 0,
    "fat_g": 0,
    "iron_mg": 0,
    "vitamin_a_mcg": 0,
    "calcium_mg": 0
  },
  "confidence": "high/medium/low",
  "notes": "catatan tambahan jika ada"
}`
            }
          ],
        }
      ],
    })

    // 5. Parse hasil Claude
    const rawText = response.content[0].type === 'text' ? response.content[0].text : ''
    let nutritionData
    try {
      nutritionData = JSON.parse(rawText)
    } catch {
      throw new Error('Gagal parse response AI')
    }

    // 6. Simpan ke database (tracking harian)
    const trackingRecord = {
      user_id: user.id,
      child_id: childId || null,
      food_name: nutritionData.foods_detected.map((f: any) => f.name).join(', '),
      calories: nutritionData.total.calories,
      protein_g: nutritionData.total.protein_g,
      iron_mg: nutritionData.total.iron_mg,
      vitamin_a_mcg: nutritionData.total.vitamin_a_mcg,
      calcium_mg: nutritionData.total.calcium_mg,
      ai_analysis: nutritionData,
    }

    await supabase.from('food_tracking').insert(trackingRecord)

    return new Response(
      JSON.stringify({ success: true, data: nutritionData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})