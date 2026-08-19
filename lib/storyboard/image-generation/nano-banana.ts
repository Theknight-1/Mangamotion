// lib/storyboard/image-generation/nano-banana.ts
//
// Image generation through our Cloudflare Worker.
//
// The Worker is responsible for talking to the underlying image model.
// This adapter only:
//   1. validates configuration
//   2. sends the prompt/reference images to the Worker
//   3. converts the Worker response into GenerateImageResult

import {
  GenerateImageInput,
  GenerateImageResult,
  ImageGenerationError,
} from "./types";

const CLOUDFLARE_WORKER_URL = process.env.CLOUDFLARE_IMAGE_WORKER_URL;
const CLOUDFLARE_WORKER_SECRET = process.env.CLOUDFLARE_IMAGE_WORKER_SECRET;

const MAX_REFERENCE_IMAGES = 10;

export async function generateWithNanoBanana(
  input: GenerateImageInput,
): Promise<GenerateImageResult> {
  if (!CLOUDFLARE_WORKER_URL) {
    throw new ImageGenerationError(
      "CLOUDFLARE_IMAGE_WORKER_URL not configured",
      "nano-banana",
    );
  }

  if (!CLOUDFLARE_WORKER_SECRET) {
    throw new ImageGenerationError(
      "CLOUDFLARE_IMAGE_WORKER_SECRET not configured",
      "nano-banana",
    );
  }

  const referenceImageUrls = (input.referenceImageUrls ?? []).slice(
    0,
    MAX_REFERENCE_IMAGES,
  );

  let response: Response;

  try {
    response = await fetch(CLOUDFLARE_WORKER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CLOUDFLARE_WORKER_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: input.prompt,
        referenceImageUrls,
        aspectRatio: input.aspectRatio,
        aspect_ratio: input.aspectRatio,
      }),
    });
  } catch (error) {
    throw new ImageGenerationError(
      "Cloudflare image generation request failed to send",
      "nano-banana",
      error,
    );
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    const isSafety =
      text.includes("3030") ||
      /flagged|safety|nsfw|moderation|content policy|policy violation/i.test(text);
    const isRateLimit = response.status === 429 || /rate limit|quota/i.test(text);

    throw new ImageGenerationError(
      `Cloudflare image Worker API error ${response.status}: ${text.slice(
        0,
        300,
      )}`,
      "nano-banana",
      undefined,
      { isSafetyFlag: isSafety, isRateLimit },
    );
  }

  const imageBuffer = Buffer.from(await response.arrayBuffer());

  if (!imageBuffer.length) {
    throw new ImageGenerationError(
      "Cloudflare image Worker returned an empty response",
      "nano-banana",
    );
  }

  const contentType =
    response.headers.get("content-type")?.split(";")[0] ?? "image/png";

  return {
    imageBuffer,
    contentType,
    modelUsed: "nano-banana",
  };
}