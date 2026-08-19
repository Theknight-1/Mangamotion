// lib/storyboard/image-generation/flux.ts
//
// Budget-tier provider (Free/Starter routing). Uses fal.ai's synchronous
// REST endpoint directly rather than a client SDK, to keep this adapter
// symmetric with the Nano Banana adapter (both plain fetch calls) and
// avoid adding an unnecessary dependency for a single endpoint.
//
// - No reference image  -> flux/schnell (fast, cheap, pure text-to-image)
// - One reference image -> flux-pro/kontext (single-image conditioning;
//   Flux does not support true multi-reference identity locking the way
//   Nano Banana does, so we only pass the first reference image here)

import { GenerateImageInput, GenerateImageResult, ImageGenerationError } from "./types";

const FAL_TEXT_TO_IMAGE_URL = "https://fal.run/fal-ai/flux/schnell";
const FAL_KONTEXT_URL = "https://fal.run/fal-ai/flux-pro/kontext";

export async function generateWithFlux(
  input: GenerateImageInput,
): Promise<GenerateImageResult> {
  const apiKey = process.env.FAL_API_KEY;
  if (!apiKey) {
    throw new ImageGenerationError("FAL_API_KEY not configured", "flux");
  }

  const hasReference = Boolean(input.referenceImageUrls?.length);
  const url = hasReference ? FAL_KONTEXT_URL : FAL_TEXT_TO_IMAGE_URL;

  const aspectMap: Record<string, string> = {
    "16:9": "landscape_16_9",
    "9:16": "portrait_16_9",
    "1:1": "square_hd",
    "4:5": "portrait_4_3",
    "2.39:1": "landscape_16_9",
  };
  const image_size = (input.aspectRatio && aspectMap[input.aspectRatio]) || "landscape_16_9";

  const body = hasReference
    ? {
        prompt: input.prompt,
        image_url: input.referenceImageUrls![0],
        image_size,
        aspect_ratio: input.aspectRatio || "16:9",
      }
    : {
        prompt: input.prompt,
        image_size,
        aspect_ratio: input.aspectRatio || "16:9",
      };

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Key ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    throw new ImageGenerationError("Flux request failed to send", "flux", error);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    const isSafety =
      text.includes("3030") ||
      /flagged|safety|nsfw|moderation|content policy|policy violation/i.test(text);
    const isRateLimit = response.status === 429 || /rate limit|quota/i.test(text);

    throw new ImageGenerationError(
      `Flux API error ${response.status}: ${text.slice(0, 300)}`,
      "flux",
      undefined,
      { isSafetyFlag: isSafety, isRateLimit },
    );
  }

  const json = await response.json();
  const imageUrl: string | undefined = json?.images?.[0]?.url;

  if (!imageUrl) {
    throw new ImageGenerationError(
      "Flux response did not include an image URL",
      "flux",
    );
  }

  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new ImageGenerationError(
      "Failed to download generated Flux image",
      "flux",
    );
  }

  const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
  const contentType = imageResponse.headers.get("content-type") ?? "image/jpeg";

  return { imageBuffer, contentType, modelUsed: "flux" };
}
