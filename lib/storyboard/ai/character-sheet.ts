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

  const styleMap: Record<string, string> = {
    animation_3d: "3D animated studio character design (Pixar/DreamWorks aesthetic)",
    cinematic: "Cinematic photorealistic 35mm film character design",
    anime: "High-end anime character model sheet (Makoto Shinkai/Ufotable style)",
    dark_anime: "Dark seinen anime character model sheet (MAPPA style)",
    comic: "Western comic book character turnaround sheet",
    watercolor: "Fluid painterly watercolor character illustration",
    soft_pencil: "Graphite pencil concept character turnaround sketch",
    photo_commercial: "Commercial studio fashion & character reference",
    noir: "Vintage 1940s film noir character reference",
    graphic_novel: "Gritty graphic novel character design",
  };

  const styleLabel = styleMap[artStyle.toLowerCase()] || `${artStyle} style`;

  const parts = [
    `Official ${styleLabel} character model turnaround sheet for "${name}".`,
    `Character appearance: ${description || "Expressive character design"}.`,
    clothing ? `Signature outfit & clothing details: ${clothing}.` : "",
    consistencyNotes
      ? `Visual identity anchors: ${consistencyNotes}.`
      : "",
    "Layout: Multi-angle character model sheet displaying front full-body view, 3/4 angle view, and detailed facial expression portrait side-by-side on clean neutral background.",
    "Pristine linework, consistent anatomical proportions, high definition, masterwork production model sheet for identity locking.",
    "No text, no labels, no speech bubbles, no watermarks.",
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
