// lib/storyboard/image-generation/nano-banana.ts
//
// Image generation via Google's Gemini API (model: gemini-2.5-flash-image,
// codenamed "nano-banana"). This adapter:
//   1. validates configuration
//   2. sends the prompt/reference images to the Gemini API
//   3. converts the Gemini response into GenerateImageResult

import {
  GenerateImageInput,
  GenerateImageResult,
  ImageGenerationError,
} from "./types";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_IMAGE_MODEL =
  process.env.GEMINI_IMAGE_MODEL ?? "gemini-3.1-flash-lite-image";
const GEMINI_API_BASE =
  process.env.GEMINI_API_BASE_URL ??
  "https://generativelanguage.googleapis.com/v1beta";

const MAX_REFERENCE_IMAGES = 10;

// Aspect ratios currently accepted by Gemini's image_config.aspect_ratio.
// Anything outside this set is dropped rather than sent, so we don't get a
// 400 from an unsupported value.
const SUPPORTED_ASPECT_RATIOS = new Set([
  "1:1",
  "2:3",
  "3:2",
  "3:4",
  "4:3",
  "4:5",
  "5:4",
  "9:16",
  "16:9",
  "21:9",
]);

interface GeminiInlineDataPart {
  inline_data: {
    mime_type: string;
    data: string; // base64
  };
}

interface GeminiTextPart {
  text: string;
}

type GeminiPart = GeminiTextPart | GeminiInlineDataPart;

async function fetchReferenceImageAsInlinePart(
  url: string,
): Promise<GeminiInlineDataPart> {
  let res: Response;

  try {
    res = await fetch(url);
  } catch (error) {
    throw new ImageGenerationError(
      `Failed to fetch reference image: ${url}`,
      "nano-banana",
      error,
    );
  }

  if (!res.ok) {
    throw new ImageGenerationError(
      `Reference image fetch returned ${res.status}: ${url}`,
      "nano-banana",
    );
  }

  const mimeType = res.headers.get("content-type")?.split(";")[0] ?? "image/png";
  const buffer = Buffer.from(await res.arrayBuffer());

  return {
    inline_data: {
      mime_type: mimeType,
      data: buffer.toString("base64"),
    },
  };
}

export async function generateWithNanoBanana(
  input: GenerateImageInput,
): Promise<GenerateImageResult> {
  if (!GEMINI_API_KEY) {
    throw new ImageGenerationError(
      "GEMINI_API_KEY not configured",
      "nano-banana",
    );
  }

  const referenceImageUrls = (input.referenceImageUrls ?? []).slice(
    0,
    MAX_REFERENCE_IMAGES,
  );

  let referenceParts: GeminiInlineDataPart[];

  try {
    referenceParts = await Promise.all(
      referenceImageUrls.map(fetchReferenceImageAsInlinePart),
    );
  } catch (error) {
    if (error instanceof ImageGenerationError) throw error;
    throw new ImageGenerationError(
      "Failed to prepare reference images",
      "nano-banana",
      error,
    );
  }

  const parts: GeminiPart[] = [{ text: input.prompt }, ...referenceParts];

  const generationConfig: Record<string, unknown> = {
    responseModalities: ["IMAGE"],
  };

  if (input.aspectRatio && SUPPORTED_ASPECT_RATIOS.has(input.aspectRatio)) {
    generationConfig.imageConfig = { aspectRatio: input.aspectRatio };
  }

  const endpoint = `${GEMINI_API_BASE}/models/${GEMINI_IMAGE_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  let response: Response;

  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig,
      }),
    });
  } catch (error) {
    throw new ImageGenerationError(
      "Gemini image generation request failed to send",
      "nano-banana",
      error,
    );
  }

  const rawText = await response.text();

  if (!response.ok) {
    const isSafety =
      /safety|blocked|flagged|prohibited|policy/i.test(rawText);
    const isRateLimit =
      response.status === 429 || /rate limit|quota|resource_exhausted/i.test(rawText);

    throw new ImageGenerationError(
      `Gemini image API error ${response.status}: ${rawText.slice(0, 300)}`,
      "nano-banana",
      undefined,
      { isSafetyFlag: isSafety, isRateLimit },
    );
  }

  let json: any;

  try {
    json = JSON.parse(rawText);
  } catch (error) {
    throw new ImageGenerationError(
      "Gemini image API returned non-JSON response",
      "nano-banana",
      error,
    );
  }

  // Prompt-level block (e.g. safety filter tripped before generation even ran)
  const blockReason = json?.promptFeedback?.blockReason;
  if (blockReason) {
    throw new ImageGenerationError(
      `Gemini blocked the prompt: ${blockReason}`,
      "nano-banana",
      undefined,
      { isSafetyFlag: true },
    );
  }

  const candidate = json?.candidates?.[0];
  const finishReason = candidate?.finishReason;

  if (finishReason && finishReason !== "STOP") {
    const isSafety = /SAFETY|PROHIBITED|BLOCKED/i.test(finishReason);
    throw new ImageGenerationError(
      `Gemini did not complete generation: ${finishReason}`,
      "nano-banana",
      undefined,
      { isSafetyFlag: isSafety },
    );
  }

  const imagePart = candidate?.content?.parts?.find(
    (part: any) => part.inlineData || part.inline_data,
  );

  const inlineData = imagePart?.inlineData ?? imagePart?.inline_data;

  if (!inlineData?.data) {
    throw new ImageGenerationError(
      "Gemini response did not contain image data",
      "nano-banana",
    );
  }

  const imageBuffer = Buffer.from(inlineData.data, "base64");

  if (!imageBuffer.length) {
    throw new ImageGenerationError(
      "Gemini returned an empty image buffer",
      "nano-banana",
    );
  }

  const contentType = inlineData.mimeType ?? inlineData.mime_type ?? "image/png";

  return {
    imageBuffer,
    contentType,
    modelUsed: "nano-banana",
  };
}