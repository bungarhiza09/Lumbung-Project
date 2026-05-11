// supabase/functions/check-deficiency/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }

// Standar WHO untuk anak 2-5 tahun
const WHO_STANDARDS = {
  calories: 1300, protein_g: 20, iron_mg: 7, vitamin_a_mcg: 400, calcium_mg: 600
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const authHeader = req.headers.get('Authorization')
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader! } } })
  const { data: { user } } = await supabase.auth.getUser()
  const { childId } = await req.json()

  // Ambil data 3 hari terakhir
  const threeDaysAgo = new Date(); threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
  const { data: tracking } = await supabase
    .from('food_tracking')
    .select('*')
    .eq('child_id', childId)
    .gte('tracked_date', threeDaysAgo.toISOString().split('T')[0])

  if (!tracking || tracking.length === 0) return new Response(JSON.stringify({ alerts: [] }), { headers: corsHeaders })

  // Hitung rata-rata per hari
  const avgIron = tracking.reduce((s: number, t: any) => s + (t.iron_mg || 0), 0) / 3
  const avgCalcium = tracking.reduce((s: number, t: any) => s + (t.calcium_mg || 0), 0) / 3
  const avgProtein = tracking.reduce((s: number, t: any) => s + (t.protein_g || 0), 0) / 3

  const alerts = []
  
  if (avgIron < WHO_STANDARDS.iron_mg) {
    alerts.push({
      type: 'iron_deficiency',
      severity: avgIron < WHO_STANDARDS.iron_mg * 0.5 ? 'red' : 'yellow',
      message: `Anak kamu kekurangan zat besi 3 hari ini (rata-rata ${avgIron.toFixed(1)} mg/hari, butuh ${WHO_STANDARDS.iron_mg} mg).`,
      suggestion: 'Tambahkan hati ayam, bayam, atau ikan teri hari ini.',
      foods_recommended: ['hati ayam', 'bayam rebus', 'ikan teri', 'kacang merah']
    })
  }

  if (avgProtein < WHO_STANDARDS.protein_g) {
    alerts.push({
      type: 'protein_deficiency',
      severity: 'yellow',
      message: `Asupan protein kurang (${avgProtein.toFixed(1)}g/hari, butuh ${WHO_STANDARDS.protein_g}g).`,
      suggestion: 'Tambahkan tempe, tahu, atau telur di makan berikutnya.',
      foods_recommended: ['tempe goreng', 'telur rebus', 'tahu', 'ikan lele']
    })
  }

  return new Response(JSON.stringify({ alerts, summary: { avgIron, avgCalcium, avgProtein } }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
})