import { put } from "@vercel/blob";
import { generateStoryboardImage } from "@/lib/storyboard/image-generation";
import type { StoryboardModel } from "@/lib/storyboard/usage";

export interface GenerateCharacterSheetParams {
  name: string;
  description?: string | null;
  clothing?: string | null;
  consistencyNotes?: string | null;
  artStyle: string;
  referenceImageUrls?: string[];
  model?: StoryboardModel;
}

export function buildCharacterTurnaroundPrompt(params: {
  name: string;
  description?: string | null;
  clothing?: string | null;
  consistencyNotes?: string | null;
  artStyle: string;
}): string {
  const { name, description, clothing, consistencyNotes, artStyle } = params;

  const parts = [
    `Official ${artStyle}-style character model reference sheet for "${name}".`,
    `Character appearance: ${description || "Expressive character design"}.`,
    clothing ? `Costume and clothing details: ${clothing}.` : "",
    consistencyNotes
      ? `Visual identity anchors: ${consistencyNotes}.`
      : "",
    "Layout: Multi-angle character model sheet displaying front full-body view, 3/4 angle view, and detailed facial expression portrait side-by-side.",
    "Clean neutral studio background, pristine linework, consistent anatomy, high resolution, suitable as an identity conditioning reference.",
    "No text bubbles, no watermarks, masterwork studio character turnaround sheet.",
  ];

  return parts.filter(Boolean).join(" ");
}

export async function generateCharacterSheet(
  params: GenerateCharacterSheetParams,
): Promise<{ sheetUrl: string; modelUsed: string }> {
  const {
    name,
    description,
    clothing,
    consistencyNotes,
    artStyle,
    referenceImageUrls = [],
    model = "flux",
  } = params;

  const prompt = buildCharacterTurnaroundPrompt({
    name,
    description,
    clothing,
    consistencyNotes,
    artStyle,
  });

  const result = await generateStoryboardImage(model, {
    prompt,
    referenceImageUrls,
    aspectRatio: "16:9",
  });

  const filename = `storyboard/characters/${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now()}.png`;
  const blob = await put(filename, result.imageBuffer, {
    access: "public",
    contentType: result.contentType,
  });

  return {
    sheetUrl: blob.url,
    modelUsed: result.modelUsed,
  };
}
