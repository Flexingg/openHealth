import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `You are a precision nutrition label data extractor. Analyze the provided image of a nutrition label or food packaging. 
Extract the following exact keys and return ONLY a valid JSON object. Do NOT use markdown formatting.
{
  "name": "string (Guess the food name from packaging if visible, otherwise return 'Unknown Food')",
  "brand": "string (Extract brand if visible, otherwise null)",
  "serving_size": "number (Extract just the numeric value, e.g., 28)",
  "serving_unit": "string (Extract the unit, e.g., 'g', 'oz', 'tbsp', 'cup')",
  "calories": "number",
  "protein": "number (in grams)",
  "carbs": "number (in grams)",
  "fat": "number (in grams)",
  "micronutrients": "object (Extract any visible vitamins/minerals as key-value pairs, e.g., {'sodium_mg': 150, 'fiber_g': 2})"
}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Grab data from frontend. Note: imageBase64 should NOT include "data:image/jpeg;base64," prefix
    const { provider, ai_api_key, model_name, imageBase64, mimeType = "image/jpeg" } = await req.json()

    if (!provider || !ai_api_key || !model_name || !imageBase64) {
        throw new Error("Missing configuration or image data.");
    }

    let rawAiResponseText = "";

    // 2. Route the Vision request based on the selected AI Provider
    switch (provider.toLowerCase()) {
      case 'openai': {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${ai_api_key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model_name, // e.g., "gpt-4o"
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: [
                  { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } }
                ] 
              }
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
            model: model_name, // e.g., "claude-3-5-sonnet-20240620"
            max_tokens: 1000,
            system: SYSTEM_PROMPT,
            messages: [
              { role: "user", content: [
                  { type: "image", source: { type: "base64", media_type: mimeType, data: imageBase64 } }
                ] 
              }
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
            contents: [{ parts: [
              { inlineData: { mimeType: mimeType, data: imageBase64 } }
            ] }],
            generationConfig: { responseMimeType: "application/json" }
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
    const cleanJsonString = rawAiResponseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const extractedNutrition = JSON.parse(cleanJsonString);

    // 4. Return the extracted data to the frontend for the user to verify
    return new Response(
      JSON.stringify({ success: true, data: extractedNutrition }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
