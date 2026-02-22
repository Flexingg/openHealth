import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// System prompt for extracting food name and quantity
const SYSTEM_PROMPT = "You are a nutrition extraction assistant. Extract the food name and quantity from the user's text. Return ONLY a valid JSON object with the exact keys: 'search_term' (string) and 'servings' (number). Do not include markdown, code blocks, or any other text.";

// System prompt for estimating nutrition when food not found
const NUTRITION_ESTIMATE_PROMPT = `You are a nutrition estimation assistant. Estimate the typical nutrition values for the given food item per standard serving. Return ONLY a valid JSON object with these exact keys:
{
  "name": "string (food name, capitalized)",
  "brand": "string or null",
  "serving_size": "number (typical serving size, e.g., 1 for eggs, 28 for crackers in grams)",
  "serving_unit": "string (g, oz, cup, piece, tbsp, etc.)",
  "serving_grams": "number (grams per serving for weight-based calculation)",
  "calories": "number (per serving)",
  "protein": "number (grams per serving)",
  "carbs": "number (grams per serving)",
  "fat": "number (grams per serving)",
  "calories_per_100g": "number (calories per 100g)",
  "protein_per_100g": "number (protein grams per 100g)",
  "carbs_per_100g": "number (carbs grams per 100g)",
  "fat_per_100g": "number (fat grams per 100g)",
  "common_servings": [
    { "name": "string (e.g., 'small', 'medium', 'large', 'cup', 'piece')", "grams": "number (grams for this serving)" }
  ]
}
Do not include markdown, code blocks, or any other text. Use reasonable estimates based on typical nutritional data. Include 3-5 common serving sizes for the food.`;

// Helper function to call AI provider for nutrition estimation
async function estimateNutrition(provider: string, apiKey: string, modelName: string, foodName: string): Promise<object> {
  let rawResponse = "";
  
  switch (provider.toLowerCase()) {
    case 'openai': {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelName,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: NUTRITION_ESTIMATE_PROMPT },
            { role: "user", content: `Estimate nutrition for: ${foodName}` }
          ]
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      rawResponse = data.choices[0].message.content;
      break;
    }

    case 'anthropic': {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelName,
          max_tokens: 500,
          system: NUTRITION_ESTIMATE_PROMPT,
          messages: [
            { role: "user", content: `Estimate nutrition for: ${foodName}` }
          ]
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      rawResponse = data.content[0].text;
      break;
    }

    case 'gemini': {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: NUTRITION_ESTIMATE_PROMPT }] },
          contents: [{ parts: [{ text: `Estimate nutrition for: ${foodName}` }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      rawResponse = data.candidates[0].content.parts[0].text;
      break;
    }

    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }

  // Clean and parse the response
  const cleanJsonString = rawResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
  return JSON.parse(cleanJsonString);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Grab the dynamic parameters sent from your frontend's IndexedDB
    const { provider, ai_api_key, model_name, user_input, date, meal_time } = await req.json()

    if (!provider || !ai_api_key || !model_name) {
        throw new Error("Missing AI configuration (provider, api key, or model).");
    }

    let rawAiResponseText = "";

    // 2. Route the request based on the selected AI Provider
    switch (provider.toLowerCase()) {
      case 'openai': {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${ai_api_key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model_name, // e.g., "gpt-4o-mini"
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: user_input }
            ]
          })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        rawAiResponseText = data.choices[0].message.content;
        break;
      }

      case 'anthropic': {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': ai_api_key,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model_name, // e.g., "claude-3-haiku-20240307"
            max_tokens: 300,
            system: SYSTEM_PROMPT,
            messages: [
              { role: "user", content: user_input }
            ]
          })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        rawAiResponseText = data.content[0].text;
        break;
      }

      case 'gemini': {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model_name}:generateContent?key=${ai_api_key}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: [{ parts: [{ text: user_input }] }],
            generationConfig: { responseMimeType: "application/json" } // Forces native JSON output
          })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        rawAiResponseText = data.candidates[0].content.parts[0].text;
        break;
      }

      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }

    // 3. Clean and parse the AI response
    // Sometimes LLMs still wrap JSON in markdown block tags despite instructions. This strips them.
    const cleanJsonString = rawAiResponseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const { search_term, servings } = JSON.parse(cleanJsonString);

    if (!search_term || !servings) {
        throw new Error("AI failed to extract search_term and servings correctly.");
    }

    // 4. Initialize Supabase Client with the user's Auth token for RLS
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // 5. Search the foods table
    const { data: foods, error: searchError } = await supabaseClient
      .from('foods')
      .select('id, name')
      .ilike('name', `%${search_term}%`)
      .limit(1)

    if (searchError) {
      throw new Error(`Database search error: ${searchError.message}`)
    }

    // 6. If food not found, estimate nutrition and return for user verification
    if (!foods || foods.length === 0) {
      try {
        const estimatedNutrition = await estimateNutrition(provider, ai_api_key, model_name, search_term);
        
        return new Response(
          JSON.stringify({
            food_not_found: true,
            search_term,
            servings,
            estimated_nutrition: estimatedNutrition
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } catch (estimateError) {
        throw new Error(`Could not find "${search_term}" in database and failed to estimate nutrition: ${estimateError.message}`)
      }
    }

    // 7. Insert the log
    const { error: insertError } = await supabaseClient
      .from('logs')
      .insert({
        food_id: foods[0].id,
        servings_consumed: servings,
        date: date,
        meal_time: meal_time
      })

    if (insertError) throw insertError

    // 8. Return success to frontend
    return new Response(
      JSON.stringify({ success: true, logged_food: foods[0].name, servings: servings }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
