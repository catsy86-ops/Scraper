import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Body {
  title?: string;
  category?: string;
  condition?: string;
  description?: string;
  conditionFilter?: string; // override condition used for narrowing dataset
}

interface ComparableListing {
  title: string;
  price: number;
  condition: string;
  location: string | null;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function statisticalSuggestion(prices: number[]) {
  if (prices.length === 0) return null;
  const med = median(prices);
  const sorted = [...prices].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)] ?? med;
  const q3 = sorted[Math.floor(sorted.length * 0.75)] ?? med;
  return {
    suggested: Math.round(med),
    min: Math.round(q1),
    max: Math.round(q3),
    sampleSize: prices.length,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as Body;
    const title = (body.title || "").trim();
    const category = (body.category || "").trim();
    const condition = (body.condition || "").trim();
    const description = (body.description || "").trim();
    const conditionFilter = (body.conditionFilter ?? body.condition ?? "").trim();

    if (!title || title.length < 3) {
      return new Response(
        JSON.stringify({ error: "Podaj tytuł (min. 3 znaki)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch comparable listings: same category, fall back to keyword search if too few
    const keywords = title
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2)
      .slice(0, 4);

    let { data: comparables } = await supabase
      .from("listings")
      .select("title, price, condition, location")
      .eq("is_active", true)
      .eq("category", category || "__none__")
      .order("created_at", { ascending: false })
      .limit(60);

    comparables = (comparables || []) as ComparableListing[];

    // Filter by keyword overlap to find closer matches
    const closeMatches = (comparables as ComparableListing[]).filter((l) => {
      const t = l.title.toLowerCase();
      return keywords.some((k) => t.includes(k));
    });

    const dataset: ComparableListing[] =
      closeMatches.length >= 3 ? closeMatches : (comparables as ComparableListing[]);

    const allPrices = dataset.map((l) => Number(l.price)).filter((p) => p > 0 && p < 1_000_000);
    const overallStats = statisticalSuggestion(allPrices);

    // Per-condition statistics for the whole keyword-narrowed dataset
    const byCondition: Record<string, { stats: ReturnType<typeof statisticalSuggestion>; count: number }> = {};
    for (const l of dataset) {
      const c = (l.condition || "nieznany").toLowerCase();
      (byCondition[c] ||= { stats: null, count: 0 }).count += 1;
    }
    for (const c of Object.keys(byCondition)) {
      const prices = dataset
        .filter((l) => (l.condition || "").toLowerCase() === c)
        .map((l) => Number(l.price))
        .filter((p) => p > 0 && p < 1_000_000);
      byCondition[c].stats = statisticalSuggestion(prices);
    }

    // Choose the dataset/stats actually used for the suggestion
    const filterCond = conditionFilter.toLowerCase();
    const filteredDataset = filterCond
      ? dataset.filter((l) => (l.condition || "").toLowerCase() === filterCond)
      : dataset;
    // Require at least 3 condition-matched samples to use them; otherwise fall back to all
    const useFiltered = filterCond && filteredDataset.length >= 3;
    const activeDataset = useFiltered ? filteredDataset : dataset;
    const activePrices = activeDataset.map((l) => Number(l.price)).filter((p) => p > 0 && p < 1_000_000);
    const stats = statisticalSuggestion(activePrices);

    // Build quartile summary (for boxplot) of the active (filtered) dataset
    const sortedActive = [...activePrices].sort((a, b) => a - b);
    const quartiles = sortedActive.length
      ? {
          min: Math.round(sortedActive[0]),
          q1: Math.round(sortedActive[Math.floor(sortedActive.length * 0.25)] ?? sortedActive[0]),
          median: Math.round(median(sortedActive)),
          q3: Math.round(sortedActive[Math.floor(sortedActive.length * 0.75)] ?? sortedActive[sortedActive.length - 1]),
          max: Math.round(sortedActive[sortedActive.length - 1]),
        }
      : null;

    // Build comparables sample (up to 12) returned to client for transparency
    const comparablesSample = activeDataset.slice(0, 12).map((l) => ({
      title: l.title.slice(0, 100),
      price: Number(l.price),
      condition: l.condition,
      location: l.location ?? null,
    }));

    // Call Lovable AI to refine suggestion using context
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    let aiSuggestion: { suggested: number; min: number; max: number; reasoning: string } | null = null;
    let aiDetails: string | null = null;

    if (LOVABLE_API_KEY) {
      const sample = activeDataset.slice(0, 12).map((l) => ({
        title: l.title.slice(0, 80),
        price: Number(l.price),
        condition: l.condition,
      }));

      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content:
                "Jesteś ekspertem od wyceny używanych przedmiotów na polskim rynku (jak Vinted/OLX). Analizujesz dane porównawcze i sugerujesz uczciwą cenę w PLN. Zawsze zwracaj wynik przez tool call.",
            },
            {
              role: "user",
              content: JSON.stringify({
                przedmiot: { title, category, condition, description: description.slice(0, 400) },
                filtr_stanu: filterCond || null,
                statystyki_kategorii: overallStats,
                statystyki_per_stan: byCondition,
                statystyki_dla_filtra: stats,
                podobne_oferty: sample,
              }),
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "suggest_price",
                description: "Sugerowana cena dla używanego przedmiotu",
                parameters: {
                  type: "object",
                  properties: {
                    suggested: { type: "number", description: "Rekomendowana cena w zł (liczba całkowita)" },
                    min: { type: "number", description: "Dolna granica rozsądnego przedziału w zł" },
                    max: { type: "number", description: "Górna granica rozsądnego przedziału w zł" },
                    reasoning: { type: "string", description: "Krótkie uzasadnienie po polsku (max 2 zdania)" },
                    details: { type: "string", description: "Dłuższe uzasadnienie po polsku (3-6 zdań): jak mediana, kwartyle Q1/Q3, liczba podobnych ofert oraz stan wpłynęły na wycenę. Wskaż, co podniosło lub obniżyło cenę." },
                  },
                  required: ["suggested", "min", "max", "reasoning", "details"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "suggest_price" } },
        }),
      });

      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Zbyt wiele zapytań. Spróbuj ponownie za chwilę." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({ error: "Brak środków AI w workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (aiResp.ok) {
        const data = await aiResp.json();
        const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
        if (toolCall?.function?.arguments) {
          try {
            const parsed = JSON.parse(toolCall.function.arguments);
            aiSuggestion = {
              suggested: parsed.suggested,
              min: parsed.min,
              max: parsed.max,
              reasoning: parsed.reasoning,
            };
            aiDetails = typeof parsed.details === "string" ? parsed.details : null;
          } catch (e) {
            console.error("Failed to parse AI tool call args:", e);
          }
        }
      } else {
        console.error("AI gateway error:", aiResp.status, await aiResp.text());
      }
    }

    const result = aiSuggestion ?? (stats
      ? { suggested: stats.suggested, min: stats.min, max: stats.max, reasoning: "Wycena oparta na medianie podobnych aktywnych ogłoszeń." }
      : null);

    if (!result) {
      return new Response(
        JSON.stringify({ error: "Brak danych porównawczych dla tej kategorii." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        ...result,
        sampleSize: stats?.sampleSize ?? 0,
        source: aiSuggestion ? "ai" : "statistics",
        details: aiDetails,
        comparables: comparablesSample,
        appliedConditionFilter: useFiltered ? filterCond : null,
        requestedConditionFilter: filterCond || null,
        overallStats,
        byCondition,
        prices: sortedActive.map((p) => Math.round(p)),
        quartiles,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("suggest-price error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
