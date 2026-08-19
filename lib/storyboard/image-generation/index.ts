// lib/storyboard/image-generation/index.ts
import { generateWithFlux } from "./flux";
import { generateWithNanoBanana } from "./nano-banana";
import type { GenerateImageInput, GenerateImageResult } from "./types";
import type { StoryboardModel } from "@/lib/storyboard/usage";

export * from "./types";

export async function generateStoryboardImage(
  model: StoryboardModel,
  input: GenerateImageInput,
): Promise<GenerateImageResult> {
  if (model === "nano-banana") {
    return generateWithNanoBanana(input);
  }
  return generateWithFlux(input);
}

/**
 * Builds the generation prompt from a shot's structured fields.
 * Kept as a pure function so the exact prompt template can be iterated
 * on independently of the route/pipeline code.
 */
export function buildShotPrompt(params: {
  description: string;
  shotType?: string | null;
  cameraAngle?: string | null;
  artStyle: string;
  characterNames?: string[];
}): string {
  const { description, shotType, cameraAngle, artStyle, characterNames } = params;

  const parts = [
    `${artStyle}-style storyboard illustration.`,
    description,
  ];

  if (shotType) parts.push(`Shot type: ${shotType}.`);
  if (cameraAngle) parts.push(`Camera angle: ${cameraAngle}.`);
  if (characterNames?.length) {
    parts.push(
      `Depict these characters consistently with their reference images: ${characterNames.join(", ")}.`,
    );
  }
  parts.push(
    "Clean line art, single frame, no panel borders, no text or speech bubbles.",
  );

  return parts.join(" ");
}

export function buildCharacterSheetPrompt(params: {
  name: string;
  description?: string | null;
  artStyle: string;
}): string {
  const { name, description, artStyle } = params;
  return [
    `${artStyle}-style character reference sheet for "${name}".`,
    description ?? "",
    "Full body, neutral pose, front-facing, clean background, consistent",
    "proportions suitable for reuse as a visual reference across multiple",
    "future illustrations of this same character.",
  ]
    .filter(Boolean)
    .join(" ");
}
