// lib/openrouter.ts
//
// Primary vision analysis path (OpenRouter has free credits available and
// isn't blocked by Google's free-tier quota=0 account issue).
// Gemini is now the secondary fallback — see analyze-panel/route.ts.
//
// Env var needed: OPENROUTER_API_KEY (https://openrouter.ai/keys — free, no card)

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

// Ordered by OCR/text-in-image accuracy first (manga relies heavily on reading
// speech bubbles correctly), then general vision quality as fallback.
// Qwen2.5-VL benchmarks ~75% on document/text OCR tasks — best free vision
// model for this use case as of testing. Source: GetOmni OCR benchmark.
const OPENROUTER_MODEL_CHAIN = [
  "qwen/qwen2.5-vl-72b-instruct",
  "qwen/qwen2.5-vl-72b-instruct:free",
  "meta-llama/llama-4-maverick:free",
  "meta-llama/llama-3.2-11b-vision-instruct:free",
] as const;

interface OpenRouterResult {
  text: string;
  modelUsed: string;
}

/**
 * Send an image + prompt to OpenRouter. Tries the primary model in the chain
 * and passes the REST of the chain via `models` so OpenRouter retries
 * server-side automatically on that single request if the primary 429s/404s/
 * is temporarily down — this is faster than looping client-side per model.
 */
export async function analyzeImageWithOpenRouter(
  base64Image: string,
  mimeType: string,
  prompt: string,
): Promise<OpenRouterResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY not configured");
  }

  const dataUri = `data:${mimeType};base64,${base64Image}`;
  const [primaryModel, ...fallbackModels] = OPENROUTER_MODEL_CHAIN;

  const res = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer":
        process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      "X-Title": "MangaMotion",
    },
    body: JSON.stringify({
      model: primaryModel,
      models: fallbackModels, // OpenRouter's built-in server-side failover within this single request
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: dataUri } },
          ],
        },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${errBody}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content?.trim();
  const modelUsed = data.model ?? primaryModel; // OpenRouter echoes which model actually answered

  if (!text) throw new Error("OpenRouter returned empty content");

  console.log(`[openrouter] ✓ ${modelUsed}`);
  return { text, modelUsed };
}
