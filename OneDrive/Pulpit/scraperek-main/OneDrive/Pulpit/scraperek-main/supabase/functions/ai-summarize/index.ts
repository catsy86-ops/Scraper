import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, mode } = await req.json();

    if (!content || typeof content !== "string") {
      return new Response(
        JSON.stringify({ error: "Brak treści do podsumowania" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const truncated = content.slice(0, 12000);

    const systemPrompt = `Jesteś ekspertem od analizy treści webowych. Podajesz zwięzłe, ale wyczerpujące podsumowania w języku polskim.
Odpowiadaj w formacie JSON z polami:
- "summary": krótkie podsumowanie (2-3 zdania)
- "keyPoints": tablica 3-5 kluczowych punktów
- "sentiment": "pozytywny" | "neutralny" | "negatywny"
- "category": kategoria treści (np. "technologia", "e-commerce", "news", "blog")
- "wordCount": przybliżona liczba słów w oryginalnej treści`;

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `Tryb scrapowania: ${mode || "scrape"}\n\nTreść:\n${truncated}`,
            },
          ],
          temperature: 0.7,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Zbyt wiele zapytań, spróbuj ponownie za chwilę." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Brak środków na koncie AI. Doładuj kredyty w ustawieniach." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    
    // Handle OpenAI response format
    const content_text = data.choices?.[0]?.message?.content;

    if (!content_text) {
      throw new Error("No response from OpenAI");
    }

    // Parse JSON from the response
    let result;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content_text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        result = JSON.parse(content_text);
      }
    } catch {
      // If JSON parsing fails, create a basic response
      result = {
        summary: content_text.slice(0, 200),
        keyPoints: [content_text.slice(0, 100)],
        sentiment: "neutralny",
        category: "ogólne",
        wordCount: content_text.split(/\s+/).length,
      };
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-summarize error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Nieznany błąd",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
