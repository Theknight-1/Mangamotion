import { GoogleGenerativeAI } from "@google/generative-ai";

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

/**
 * Uses an LLM (Gemini with OpenRouter fallback) to intelligently rewrite
 * a flagged storyboard prompt into a 100% safe, policy-compliant, cinematic
 * visual keyframe description while preserving the dramatic intent.
 */
export async function fixFlaggedPromptWithAI(params: {
  prompt: string;
  artStyle: string;
  characters?: string[];
  sceneContext?: string | null;
}): Promise<string> {
  const { prompt, artStyle, characters = [], sceneContext } = params;

  const systemInstruction = `You are a world-class Hollywood storyboard director, cinematographer, and AI prompt engineer.
A storyboard keyframe generation prompt was flagged by an AI image safety/content moderation filter.
Your task is to REWRITE the prompt into a 100% safe, family-friendly, high-fidelity cinematic keyframe visual description.

RULES:
1. Eliminate all trigger words (violence, blood, weapons, killing, nudity, gore, horror extremes).
2. Convert literary action into concrete, frozen-in-time visual states (describe lighting, character poses, environmental architecture, facial expressions).
3. Do NOT use temporal words like "Suddenly", "quick cuts", "later", "meanwhile".
4. Retain character consistency: keep ${characters.join(", ") || "the main characters"} and the scene atmosphere intact.
5. Style: ${artStyle}-style production storyboard keyframe art.
${sceneContext ? `6. Scene Setting Context: ${sceneContext}` : ""}

Return ONLY the rewritten prompt text. No explanations, no markdown formatting, no quotes.`;

  // Layer 1: Gemini
  if (process.env.GEMINI_API_KEY) {
    try {
      const model = genai.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 300,
        },
      });

      const response = await model.generateContent([
        { text: systemInstruction },
        { text: `ORIGINAL FLAGGED PROMPT:\n"""${prompt}"""\n\nREWRITTEN SAFE KEYFRAME PROMPT:` },
      ]);

      const rewritten = response.response.text()?.trim();
      if (rewritten && rewritten.length > 20) {
        console.log("[fixFlaggedPromptWithAI] Gemini successfully rewritten flagged prompt.");
        return rewritten.replace(/^["']|["']$/g, "");
      }
    } catch (geminiErr: any) {
      console.warn("[fixFlaggedPromptWithAI] Gemini fallback:", geminiErr.message);
    }
  }

  // Layer 2: OpenRouter
  if (process.env.OPENROUTER_API_KEY) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          models: ["openai/gpt-4o-mini", "meta-llama/llama-3.3-70b-instruct"],
          messages: [
            { role: "system", content: systemInstruction },
            {
              role: "user",
              content: `ORIGINAL FLAGGED PROMPT:\n"""${prompt}"""\n\nREWRITTEN SAFE KEYFRAME PROMPT:`,
            },
          ],
          temperature: 0.4,
          max_tokens: 300,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content?.trim();
        if (content && content.length > 20) {
          console.log("[fixFlaggedPromptWithAI] OpenRouter successfully rewritten flagged prompt.");
          return content.replace(/^["']|["']$/g, "");
        }
      }
    } catch (orErr: any) {
      console.error("[fixFlaggedPromptWithAI] OpenRouter failed:", orErr.message);
    }
  }

  // Fallback: rule-based cleanup if AI services are unreachable
  return prompt
    .replace(/\b(blood|bloody|gore)\b/gi, "crimson glow")
    .replace(/\b(kill|murder|execute|slay)\b/gi, "confront")
    .replace(/\b(corpse|dead body)\b/gi, "fallen figure")
    .replace(/\b(knife|dagger|gun|pistol|weapon)\b/gi, "cinematic prop")
    .replace(/\b(suddenly|quick cuts)\b/gi, "")
    .trim();
}
