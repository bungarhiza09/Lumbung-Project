import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const SYSTEM_PROMPT = `Kamu adalah asisten gizi ahli untuk platform LUMBUNG Indonesia.
Kamu memahami konteks gizi lokal Indonesia: harga bahan makanan di pasar tradisional,
makanan lokal seperti tempe, tahu, ikan asin, bayam, singkong, dll.
Jawab dengan bahasa Indonesia yang ramah dan mudah dipahami ibu-ibu.
Berikan saran konkret berbasis data gizi, bukan jawaban generik.
Selalu pertimbangkan budget keluarga menengah ke bawah Indonesia.
Jawaban maksimal 3-4 paragraf, pakai bahasa sehari-hari.`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { messages, session_id } = await req.json();

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const userMsg = messages[messages.length - 1];

    // Simpan pesan user
    await supabase.from("ai_chat_messages").insert({
      session_id,
      role: "user", 
      content: userMsg.content,
    })

    // Panggil Groq API
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages.map((m: any) => ({
            role: m.role,
            content: m.content,
          })),
        ],
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    const groqData = await groqResponse.json();
    console.log("Groq response:", JSON.stringify(groqData));

    const assistantReply = groqData.choices?.[0]?.message?.content;

    if (!assistantReply) {
      throw new Error("Groq tidak memberikan jawaban: " + JSON.stringify(groqData));
    }

    // Simpan balasan AI
    await supabase.from("ai_chat_messages").insert({
      session_id,
      role: "assistant",
      content: assistantReply,
    })

    return new Response(
      JSON.stringify({ reply: assistantReply }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});