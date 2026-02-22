import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// System prompt for intent classification
const INTENT_CLASSIFICATION_PROMPT = `You are a smart logging assistant. Analyze the user's input and classify their intent.

Return ONLY a valid JSON object with these fields:
{
  "intent": "food" | "water" | "weight",
  "confidence": <number 0.0-1.0>,
  
  // For food intent:
  "search_term": "<food name to search>",
  "servings": <number>,
  
  // For water intent:
  "amount": <number>,
  "unit": "oz" | "ml" | "cups" | "liters" | "gallons" | "glass" | "glasses" | "bottle" | "bottles",
  
  // For weight intent:
  "weight": <number>,
  "unit": "lbs" | "lb" | "kg" | "stone" | "pounds"
}

Examples:
- "I had 2 scrambled eggs" → {"intent": "food", "confidence": 0.95, "search_term": "scrambled eggs", "servings": 2}
- "Drank 16oz of water" → {"intent": "water", "confidence": 0.98, "amount": 16, "unit": "oz"}
- "I weigh 180 lbs" → {"intent": "weight", "confidence": 0.95, "weight": 180, "unit": "lbs"}
- "My weight is 82kg" → {"intent": "weight", "confidence": 0.95, "weight": 82, "unit": "kg"}
- "Had a glass of water" → {"intent": "water", "confidence": 0.90, "amount": 1, "unit": "glass"}
- "Drank 2 bottles of water" → {"intent": "water", "confidence": 0.90, "amount": 2, "unit": "bottles"}
- "Ate an apple" → {"intent": "food", "confidence": 0.95, "search_term": "apple", "servings": 1}

Do not include markdown, code blocks, or any other text.`;

// System prompt for estimating nutrition when food not found
const NUTRITION_ESTIMATE_PROMPT = `You are a nutrition estimation assistant. Estimate the typical nutrition values for the given food item per standard serving. Return ONLY a valid JSON object with these exact keys:
{
  "name": "string (food name, capitalized)",
  "brand": "string or null",
  "serving_size": "number (typical serving size, e.g., 1 for eggs, 28 for crackers in grams)",
  "serving_unit": "string (g, oz, cup, piece, tbsp, etc.)",
  "calories": "number (per serving)",
  "protein": "number (grams per serving)",
  "carbs": "number (grams per serving)",
  "fat": "number (grams per serving)"
}
Do not include markdown, code blocks, or any other text. Use reasonable estimates based on typical nutritional data.`;

// Unit conversion constants
const WATER_CONVERSIONS: Record<string, number> = {
  oz: 29.5735,
  ml: 1,
  cups: 236.588,
  liters: 1000,
  litres: 1000,
  gallons: 3785.41,
  glass: 240,  // Standard glass ~8oz
  glasses: 240,
  bottle: 500, // Standard bottle ~16.9oz
  bottles: 500
};

const WEIGHT_CONVERSIONS: Record<string, number> = {
  lbs: 0.453592,
  lb: 0.453592,
  pounds: 0.453592,
  kg: 1,
  stone: 6.35029
};

// Helper function to call AI provider
async function callAI(provider: string, apiKey: string, modelName: string, systemPrompt: string, userMessage: string): Promise<string> {
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
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage }
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
          system: systemPrompt,
          messages: [
            { role: "user", content: userMessage }
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
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: userMessage }] }],
          generationConfig: { 
            responseMimeType: "application/json"
          }
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

  return rawResponse;
}

// Clean and parse JSON response
function parseJsonResponse(rawResponse: string): object {
  const cleanJsonString = rawResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
  return JSON.parse(cleanJsonString);
}

// Convert water amount to ml
function convertWaterToMl(amount: number, unit: string): number {
  const normalizedUnit = unit.toLowerCase().trim();
  const conversionRate = WATER_CONVERSIONS[normalizedUnit];
  
  if (!conversionRate) {
    // Default to oz if unit not recognized
    return amount * WATER_CONVERSIONS.oz;
  }
  
  return amount * conversionRate;
}

// Convert weight to kg
function convertWeightToKg(weight: number, unit: string): number {
  const normalizedUnit = unit.toLowerCase().trim();
  const conversionRate = WEIGHT_CONVERSIONS[normalizedUnit];
  
  if (!conversionRate) {
    // Default to lbs if unit not recognized
    return weight * WEIGHT_CONVERSIONS.lbs;
  }
  
  return weight * conversionRate;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Log the request for debugging
    console.log('Request received, method:', req.method)
    console.log('Authorization header present:', !!req.headers.get('Authorization'))
    
    // 1. Get parameters from frontend
    const body = await req.json()
    console.log('Request body keys:', Object.keys(body))
    
    const { provider, ai_api_key, model_name, user_input, date, meal_time } = body

    if (!provider || !ai_api_key || !model_name) {
      console.log('Missing AI config:', { provider: !!provider, api_key: !!ai_api_key, model_name: !!model_name })
      return new Response(
        JSON.stringify({ error: "Missing AI configuration (provider, api key, or model)." }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (!user_input) {
      return new Response(
        JSON.stringify({ error: "Missing user input." }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log('Calling AI for intent classification...')
    
    // 2. Classify intent using AI
    const intentResponse = await callAI(provider, ai_api_key, model_name, INTENT_CLASSIFICATION_PROMPT, user_input);
    console.log('AI response received:', intentResponse.substring(0, 100))
    
    const intentData = parseJsonResponse(intentResponse) as {
      intent: string;
      confidence: number;
      search_term?: string;
      servings?: number;
      amount?: number;
      unit?: string;
      weight?: number;
    };

    const { intent, confidence } = intentData;
    console.log('Classified intent:', intent, 'confidence:', confidence)

    // 3. Initialize Supabase Client with the user's Auth token for RLS
    const authHeader = req.headers.get('Authorization')
    console.log('Auth header:', authHeader ? 'present' : 'missing')
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader ?? '' } } }
    )

    // 4. Handle based on intent
    switch (intent) {
      case 'water': {
        const amount = intentData.amount || 1;
        const unit = intentData.unit || 'oz';
        const amountMl = convertWaterToMl(amount, unit);
        
        // Calculate display values
        const displayAmount = unit === 'ml' || unit === 'liters' || unit === 'litres' 
          ? (unit === 'ml' ? amountMl : amountMl / 1000)
          : amountMl / WATER_CONVERSIONS.oz; // Default to oz for display
        
        const displayUnit = unit === 'ml' ? 'ml' : unit === 'liters' || unit === 'litres' ? 'L' : 'oz';

        return new Response(
          JSON.stringify({
            logType: 'water',
            amount_ml: Math.round(amountMl),
            display_amount: Math.round(displayAmount * 10) / 10,
            display_unit: displayUnit,
            original_amount: amount,
            original_unit: unit,
            confidence
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'weight': {
        const weight = intentData.weight || 0;
        const unit = intentData.unit || 'lbs';
        const weightKg = convertWeightToKg(weight, unit);
        
        // Calculate display values (default to lbs for display)
        const displayWeight = unit === 'kg' ? weight : weightKg / WEIGHT_CONVERSIONS.lbs;
        const displayUnit = unit === 'kg' ? 'kg' : 'lbs';

        return new Response(
          JSON.stringify({
            logType: 'weight',
            weight_kg: Math.round(weightKg * 100) / 100,
            display_weight: Math.round(displayWeight * 10) / 10,
            display_unit: displayUnit,
            original_weight: weight,
            original_unit: unit,
            confidence
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'food':
      default: {
        const searchTerm = intentData.search_term || user_input;
        const servings = intentData.servings || 1;

        // Search the foods table
        const { data: foods, error: searchError } = await supabaseClient
          .from('foods')
          .select('id, name, calories, protein, carbs, fat, serving_size, serving_unit')
          .ilike('name', `%${searchTerm}%`)
          .limit(1)

        if (searchError) {
          throw new Error(`Database search error: ${searchError.message}`)
        }

        // If food not found, estimate nutrition
        if (!foods || foods.length === 0) {
          try {
            const nutritionResponse = await callAI(provider, ai_api_key, model_name, NUTRITION_ESTIMATE_PROMPT, `Estimate nutrition for: ${searchTerm}`);
            const estimatedNutrition = parseJsonResponse(nutritionResponse);

            return new Response(
              JSON.stringify({
                logType: 'food',
                food_not_found: true,
                search_term: searchTerm,
                servings,
                estimated_nutrition: estimatedNutrition,
                confidence
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          } catch (estimateError) {
            throw new Error(`Could not find "${searchTerm}" in database and failed to estimate nutrition: ${estimateError.message}`);
          }
        }

        // Food found - return for confirmation (don't auto-log)
        const food = foods[0];
        return new Response(
          JSON.stringify({
            logType: 'food',
            food_not_found: false,
            food_id: food.id,
            foodName: food.name,
            servings,
            calories: food.calories * servings,
            protein: food.protein * servings,
            carbs: food.carbs * servings,
            fat: food.fat * servings,
            serving_size: food.serving_size,
            serving_unit: food.serving_unit,
            confidence
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

  } catch (error) {
    console.error('Error in smart-log:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
