import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.24.0"

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader! } } })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { budget, city, childAge } = await req.json()

    // Ambil data makanan dari DB untuk context AI
    const { data: foods } = await supabase.from('nutrition_foods').select('name, calories_per_100g, protein_g, price_estimate_idr, category').limit(50)

    const anthropic = new Anthropic({ apiKey: Deno.env.get('CLAUDE_API_KEY')! })

    const response = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 1500,
      messages: [{
        role: "user",
        content: `Kamu adalah ahli gizi dan ekonomi rumah tangga Indonesia.

Buat rencana makan 1 hari untuk keluarga Indonesia dengan ketentuan:
- Budget total: Rp ${budget.toLocaleString('id-ID')}
- Kota: ${city}
- Usia anak (jika ada): ${childAge || 'tidak ada'} tahun

Database makanan tersedia (gunakan hanya dari daftar ini atau yang serupa):
${JSON.stringify(foods)}

Buat menu yang:
1. Memenuhi ~1800-2200 kkal untuk dewasa, ~1200-1500 untuk anak 2-5 tahun
2. Cukup protein minimal 45g/hari
3. Sesuai budget ketat
4. Mudah dibuat, bahan mudah ditemukan di pasar tradisional ${city}

Berikan HANYA JSON format berikut:
{
  "breakfast": { "menu": "...", "ingredients": [...], "price_idr": 0, "calories": 0, "protein_g": 0, "prep_time_min": 0 },
  "lunch": { "menu": "...", "ingredients": [...], "price_idr": 0, "calories": 0, "protein_g": 0, "prep_time_min": 0 },
  "dinner": { "menu": "...", "ingredients": [...], "price_idr": 0, "calories": 0, "protein_g": 0, "prep_time_min": 0 },
  "total_price_idr": 0,
  "total_calories": 0,
  "total_protein_g": 0,
  "nutrition_notes": "catatan kelebihan/kekurangan gizi hari ini"
}`
      }]
    })

    const mealPlan = JSON.parse(response.content[0].type === 'text' ? response.content[0].text : '{}')
    
    await supabase.from('meal_plans').insert({ user_id: user.id, budget_idr: budget, city, meals: mealPlan, total_calories: mealPlan.total_calories, total_protein_g: mealPlan.total_protein_g })

    return new Response(JSON.stringify({ success: true, data: mealPlan }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders })
  }
})