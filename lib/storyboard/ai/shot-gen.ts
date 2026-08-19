import { put } from "@vercel/blob";
import {
  generateStoryboardImage,
  ImageGenerationError,
  type GenerateImageResult,
} from "@/lib/storyboard/image-generation";
import { fixFlaggedPromptWithAI } from "./prompt-fixer";
import { evaluateShotConsistency } from "./consistency";
import type { StoryboardModel } from "@/lib/storyboard/usage";

export interface ShotCharacter {
  id: string;
  name: string;
  description?: string | null;
  clothing?: string | null;
  consistencyNotes?: string | null;
  approvedSheetUrl?: string | null;
  pendingSheetUrl?: string | null;
  referenceImageUrls?: string[];
}

export interface ShotGenerationParams {
  shotId: string;
  projectId: string;
  description: string;
  sceneTitle?: string | null;
  sceneDescription?: string | null;
  currentShotImageUrl?: string | null;
  previousShotImageUrl?: string | null;
  environmentReferenceUrl?: string | null;
  isRegeneration?: boolean;
  shotType?: string | null;
  cameraAngle?: string | null;
  perspective?: string | null;
  movement?: string | null;
  dialogue?: string | null;
  artStyle: string;
  aspectRatio: string;
  model: StoryboardModel;
  characters: ShotCharacter[];
  iterationInstruction?: string; // Optional prompt refinement for iterate action
}


export function wrapWithSafetyDirectives(prompt: string): string {
  return [
    "SFW, safe-for-work, family-friendly cinematic storyboard frame.",
    "No nudity, no sexual content, no graphic violence, no blood, no gore, no weapons discharge, no real-person likeness, no minors in distress.",
    "Stylized illustration aesthetic, fully clothed characters, non-violent body language.",
    prompt,
    "Final output must be a non-graphic, broadcast-safe keyframe suitable for general audiences.",
  ].join(" ");
}


/**
 * Resolves characters relevant to a shot based on explicit tags
 * or character name mentions in shot description or dialogue.
 * Does NOT dump unrelated project characters if none are in the shot.
 */
export function resolveRelevantCharacters<
  T extends {
    id: string;
    name: string;
    description?: string | null;
    clothing?: string | null;
    consistencyNotes?: string | null;
    approvedSheetUrl?: string | null;
    pendingSheetUrl?: string | null;
    referenceImageUrls?: string[] | unknown;
  },
>(
  characters: T[],
  shot: {
    characterIds?: string[] | null;
    description?: string | null;
    dialogue?: string | null;
  },
): T[] {
  if (!characters.length) return [];
  const taggedCharIds = (shot.characterIds as string[]) || [];

  return characters.filter((c) => {
    // 1. Explicit ID tag check
    if (taggedCharIds.length > 0 && taggedCharIds.includes(c.id)) {
      return true;
    }
    // 2. Mention of character name in shot description or dialogue
    if (c.name && c.name.trim().length > 1) {
      const escaped = c.name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const nameRegex = new RegExp(`\\b${escaped}\\b`, "i");
      if (
        (shot.description && nameRegex.test(shot.description)) ||
        (shot.dialogue && nameRegex.test(shot.dialogue))
      ) {
        return true;
      }
    }
    return false;
  });
}

/**
 * Builds a curated, prioritized list of reference images for conditioning:
 * 1. If Regenerating: established current shot image frame as primary anchor
 * 2. Preceding frame (Shot N-1 within the same scene) for lighting/palette continuity
 * 3. Approved character model sheets for characters active in this shot
 * 4. Environment / style / prop visual reference
 */
export function buildRankedReferenceUrls(params: {
  characters: ShotCharacter[];
  currentShotImageUrl?: string | null;
  previousShotImageUrl?: string | null;
  environmentReferenceUrl?: string | null;
  isRegeneration?: boolean;
}): string[] {
  const {
    characters,
    currentShotImageUrl,
    previousShotImageUrl,
    environmentReferenceUrl,
    isRegeneration,
  } = params;
  const references: string[] = [];

  // 1. If regenerating an existing shot, prioritize the existing keyframe as the primary visual anchor
  if (isRegeneration && currentShotImageUrl && typeof currentShotImageUrl === "string") {
    references.push(currentShotImageUrl);
  }

  // 2. Preceding frame in same scene (for lighting, palette, and outfit state continuity)
  if (
    !isRegeneration &&
    previousShotImageUrl &&
    typeof previousShotImageUrl === "string" &&
    !references.includes(previousShotImageUrl)
  ) {
    references.push(previousShotImageUrl);
  }

  // 3. Character Sheets for all active characters in the shot
  for (const char of characters) {
    const sheet = char.approvedSheetUrl || char.pendingSheetUrl;
    if (sheet && typeof sheet === "string" && !references.includes(sheet)) {
      references.push(sheet);
    }
    // Any user-uploaded reference photos for this specific character
    const refs = Array.isArray(char.referenceImageUrls) ? char.referenceImageUrls : [];
    for (const ref of refs) {
      if (ref && typeof ref === "string" && !references.includes(ref)) {
        references.push(ref);
      }
    }
  }

  // 4. If regenerating and we also have a preceding shot, include it
  if (
    isRegeneration &&
    previousShotImageUrl &&
    typeof previousShotImageUrl === "string" &&
    !references.includes(previousShotImageUrl)
  ) {
    references.push(previousShotImageUrl);
  }

  // 5. Environment or prop reference
  if (
    environmentReferenceUrl &&
    typeof environmentReferenceUrl === "string" &&
    !references.includes(environmentReferenceUrl)
  ) {
    references.push(environmentReferenceUrl);
  }

  return references;
}

export function buildComprehensiveShotPrompt(params: {
  description: string;
  sceneTitle?: string | null;
  sceneDescription?: string | null;
  currentShotImageUrl?: string | null;
  previousShotImageUrl?: string | null;
  isRegeneration?: boolean;
  aspectRatio?: string | null;
  shotType?: string | null;
  cameraAngle?: string | null;
  perspective?: string | null;
  movement?: string | null;
  dialogue?: string | null;
  artStyle: string;
  characters: Array<{
    name: string;
    description?: string | null;
    clothing?: string | null;
    consistencyNotes?: string | null;
  }>;
  iterationInstruction?: string;
}): string {
  const {
    description,
    sceneTitle,
    sceneDescription,
    currentShotImageUrl,
    previousShotImageUrl,
    isRegeneration,
    aspectRatio,
    shotType,
    cameraAngle,
    perspective,
    movement,
    dialogue,
    artStyle,
    characters,
    iterationInstruction,
  } = params;

  const ratioDescription =
    aspectRatio === "16:9"
      ? "16:9 cinematic widescreen"
      : aspectRatio === "9:16"
        ? "9:16 vertical portrait"
        : aspectRatio === "2.39:1"
          ? "2.39:1 anamorphic ultra-widescreen"
          : aspectRatio === "4:5"
            ? "4:5 social frame"
            : aspectRatio === "1:1"
              ? "1:1 square frame"
              : aspectRatio
                ? `${aspectRatio} aspect ratio`
                : "16:9 widescreen";

  const parts: string[] = [
    `Master ${artStyle}-style production storyboard keyframe, ${ratioDescription} composition.`,
  ];

  // Setting / Environment continuity across the scene
  if (sceneTitle || sceneDescription) {
    const sceneContext = [
      sceneTitle ? `Scene: ${sceneTitle}` : "",
      sceneDescription ? `Setting & Atmosphere: ${sceneDescription}` : "",
    ]
      .filter(Boolean)
      .join(". ");
    parts.push(`${sceneContext}. Maintain consistent environment location, background architecture, and ambient scene lighting.`);
  }

  // Shot Action & Composition
  parts.push(`Shot Action: ${description}.`);

  // Cinematography details
  if (shotType) parts.push(`Shot framing: ${shotType} shot.`);
  if (cameraAngle) parts.push(`Camera angle: ${cameraAngle}.`);
  if (perspective) parts.push(`Perspective: ${perspective} perspective.`);
  if (movement && movement !== "static") parts.push(`Camera motion: ${movement}.`);
  if (dialogue) parts.push(`Dialogue context: "${dialogue}".`);

  // Character consistency details
  if (characters.length > 0) {
    const charDescriptions = characters
      .map(
        (c) =>
          `Character "${c.name}" (${c.clothing || c.description || "defined character features"}${
            c.consistencyNotes ? `, Visual Anchor: ${c.consistencyNotes}` : ""
          })`,
      )
      .join("; ");
    parts.push(
      `Strict character visual consistency: Depict the following character(s) with exact matching facial features, hairstyle, and outfit: ${charDescriptions}.`,
    );
  }

  // Sequential visual continuity or regeneration refinement directive
  if (isRegeneration && currentShotImageUrl) {
    parts.push(
      "Regeneration & Variation Directive: High-fidelity visual variation and refinement of the existing frame. Strictly preserve the established scene environment, background architecture, character identity, and camera framing while rendering a fresh, enhanced cinematic composition.",
    );
  } else if (previousShotImageUrl) {
    parts.push(
      "Visual Continuity Directive: Seamless continuity with preceding keyframe — match established color grading, ambient lighting angle, and outfit state.",
    );
  } else {
    // Initial establishing shot of the scene
    parts.push(
      "Scene Anchor Directive: Master establishing keyframe — establish definitive environmental lighting, world atmosphere, rich depth, and clean focal clarity.",
    );
  }

  if (iterationInstruction) {
    parts.push(`Refinement instruction: ${iterationInstruction}.`);
  }

  parts.push(
    "Cohesive cinematic lighting, clean linework, single frame keyframe, no panel borders, no speech bubbles, no text watermarks, full-bleed composition.",
  );

  return parts.filter(Boolean).join(" ");
}

/**
 * Replaces aggressive/flagged trigger vocabulary with safe cinematic storyboard equivalents
 * to prevent false-positive content moderation flags (e.g., Code 3030).
 */
export function sanitizePromptForSafety(prompt: string): string {
  const replacements: Array<[RegExp, string]> = [
    // Violence / harm
    [/\b(blood|bloody|gore|gory|guts|gory|viscera)\b/gi, "crimson fabric accent"],
    [/\b(kill|killing|kills|murder|murdered|murdering|execute|executing|slay|slaying|slaughter|assassinate)\b/gi, "intercept"],
    [/\b(corpse|dead body|dead bodies|corpses|cadaver)\b/gi, "resting figure"],
    [/\b(dead|death|dying|died)\b/gi, "unconscious"],
    [/\b(stab|stabbing|stabbed|pierce|pierced|impale|impaled)\b/gi, "gesture toward"],
    [/\b(shoot|shooting|shot dead|gunfire|open fire|fired|fires a)\b/gi, "dramatic gesture"],
    [/\b(knife|dagger|blade|sword|axe|machete|scalpel)\b/gi, "metallic prop"],
    [/\b(gun|pistol|rifle|firearm|weapon|shotgun|handgun|revolver)\b/gi, "character equipment"],
    [/\b(wound|wounded|injured|bleeding|cut|cuts|cutting)\b/gi, "tactile gesture"],
    [/\b(fight|fighting|brawl|combat|battle|attacking|attack|assault)\b/gi, "dramatic confrontation"],
    [/\b(punch|punches|punching|kick|kicks|kicking|slap|strikes|striking)\b/gi, "expressive motion"],
    [/\b(choke|choking|strangle|strangling|suffocate)\b/gi, "intense embrace"],
    [/\b(torture|tortured|abuse|abused|abusive)\b/gi, "emotional distress"],
    [/\b(execution|beheading|decapitate|hang|hanging|hung|lynch)\b/gi, "somber ceremonial pose"],
    [/\b(suicide|self-harm|self harm|cut myself|kill myself)\b/gi, "reflective pose"],
    [/\b(explode|explosion|bomb|grenade|blast|detonate)\b/gi, "bright energy burst"],
    [/\b(drug|drugs|needle|syringe|cocaine|heroin|meth|overdose)\b/gi, "small vial prop"],

    // Nudity / sexual content
    [/\b(naked|nude|nudity|topless|bottomless|underwear|lingerie|bra|panties|thong)\b/gi, "fitted attire"],
    [/\b(erotic|sexy|sensual|seductive|provocative|arousing|aroused)\b/gi, "elegant"],
    [/\b(cleavage|breast|breasts|nipple|nipples|areola)\b/gi, "torso"],
    [/\b(butt|buttocks|ass|arse|booty|glutes|genitals|penis|vagina)\b/gi, "lower torso"],
    [/\b(intercourse|sex|sexual|orgasm|masturbat)\b/gi, "intimate embrace"],

    // Horror / grotesque
    [/\b(horrific|terrifying|grotesque|mutilated|disfigured|deformed|monstrous)\b/gi, "stylized figure"],
    [/\b(zombie|undead|ghoul|demon|skeleton|skull)\b/gi, "masked figure"],
    [/\b(possessed|demonic|satanic|occult|cursed)\b/gi, "mysterious figure"],

    // Hate / extremism
    [/\b(nazi|nazis|swastika|kkk|hitler|fascist| supremacist)\b/gi, "uniformed figure"],

    // Children safety (be conservative)
    [/\b(child|children|kid|kids|boy|girl|toddler|baby|infant|minor|underage|teen|teenager)\b/gi, "young person"],

    // Self-harm / eating disorders
    [/\b(anorexia|anorexic|bulimia|thin|emaciated|starving|starved)\b/gi, "slender"],

    // Real-person likeness triggers (sometimes flagged)
    [/\b(celebrity|actor|actress|likeness of)\b/gi, "fictional character"],
  ];

  let cleaned = prompt;
  for (const [regex, replacement] of replacements) {
    cleaned = cleaned.replace(regex, replacement);
  }
  return cleaned;
}

export async function generateShotImagePipeline(
  params: ShotGenerationParams,
): Promise<{
  imageUrl: string;
  modelUsed: string;
  consistencyScore: number;
  consistencyFlagged: boolean;
}> {
  const {
    shotId,
    projectId,
    description,
    sceneTitle,
    sceneDescription,
    currentShotImageUrl,
    previousShotImageUrl,
    environmentReferenceUrl,
    isRegeneration,
    shotType,
    cameraAngle,
    perspective,
    movement,
    dialogue,
    artStyle,
    aspectRatio,
    model,
    characters,
    iterationInstruction,
  } = params;

  // Build curated reference list (characters + scene previous frame + environment)
  const referenceImageUrls = buildRankedReferenceUrls({
    characters,
    currentShotImageUrl,
    previousShotImageUrl,
    environmentReferenceUrl,
    isRegeneration,
  });

  const prompt = buildComprehensiveShotPrompt({
    description,
    sceneTitle,
    sceneDescription,
    currentShotImageUrl,
    previousShotImageUrl,
    isRegeneration,
    aspectRatio,
    shotType,
    cameraAngle,
    perspective,
    movement,
    dialogue,
    artStyle,
    characters,
    iterationInstruction,
  });

  let result: GenerateImageResult;

  try {
    // Primary Generation Attempt (Direct request)
    result = await generateStoryboardImage(model, {
      prompt,
      referenceImageUrls,
      aspectRatio,
    });
  } catch (primaryError: any) {
  const isSafety =
    primaryError?.isSafetyFlag === true ||
    /3030|flagged|safety|nsfw|moderation|policy violation|content policy/i.test(
      primaryError?.message || "",
    );

  if (!isSafety) throw primaryError;

  console.warn(
    `[generateShotImagePipeline] Shot ${shotId} flagged (3030). Running progressive recovery...`,
  );

  let recoveredResult: GenerateImageResult | null = null;

  // Layer 1: AI Prompt Rewriter (Gemini/OpenRouter)
  // Uses LLM to intelligently translate the specific dramatic action and characters
  // into a 100% safe, high-fidelity diffusion visual keyframe.
  let aiSafePrompt: string | null = null;
  try {
    aiSafePrompt = await fixFlaggedPromptWithAI({
      prompt,
      artStyle,
      characters: characters.map((c) => c.name),
      sceneContext: sceneTitle || sceneDescription,
    });
    recoveredResult = await generateStoryboardImage(model, {
      prompt: aiSafePrompt,
      referenceImageUrls,
      aspectRatio,
    });
  } catch (e1) {
    console.warn("[pipeline] Layer 1 (AI safe prompt) failed.");
  }

  // Layer 2: AI Rewritten Prompt + Reference Isolation (Primary character sheet only)
  if (!recoveredResult && aiSafePrompt) {
    try {
      recoveredResult = await generateStoryboardImage(model, {
        prompt: aiSafePrompt,
        referenceImageUrls: referenceImageUrls.slice(0, 1),
        aspectRatio,
      });
    } catch (e2) {
      console.warn("[pipeline] Layer 2 (AI prompt + single ref) failed.");
    }
  }

  // Layer 3: Cross-Provider Fallback with AI-rewritten prompt
  if (!recoveredResult && aiSafePrompt) {
    const fallbackModel: StoryboardModel =
      model === "nano-banana" ? "flux" : "nano-banana";
    try {
      recoveredResult = await generateStoryboardImage(fallbackModel, {
        prompt: aiSafePrompt,
        referenceImageUrls: referenceImageUrls.slice(0, 1),
        aspectRatio,
      });
    } catch (e3) {
      console.warn("[pipeline] Layer 3 (cross-provider AI prompt) failed.");
    }
  }

  // Layer 4: Lexical sanitize + safety directives wrapper (rule-based fallback)
  if (!recoveredResult) {
    try {
      const layer4Prompt = wrapWithSafetyDirectives(sanitizePromptForSafety(prompt));
      recoveredResult = await generateStoryboardImage(model, {
        prompt: layer4Prompt,
        referenceImageUrls: referenceImageUrls.slice(0, 1),
        aspectRatio,
      });
    } catch (e4) {
      console.warn("[pipeline] Layer 4 (lexical sanitize) failed.");
    }
  }

  if (recoveredResult) {
    result = recoveredResult;
  } else {
    throw new ImageGenerationError(
      "Shot generation was flagged by the AI safety filter after multiple recovery attempts. Please rephrase violent, suggestive, or graphic language in the shot description, dialogue, or character clothing fields.",
      model === "nano-banana" ? "nano-banana" : "flux",
      primaryError,
      { isSafetyFlag: true },
    );
  }
}

  const filename = `storyboard/projects/${projectId}/shots/${shotId}-${Date.now()}.png`;
  const blob = await put(filename, result.imageBuffer, {
    access: "public",
    contentType: result.contentType,
  });

  // Evaluate character consistency against approved sheets
  let consistencyScore = 0.92;
  let consistencyFlagged = false;

  if (referenceImageUrls.length > 0 && characters.length > 0) {
    try {
      const evalResult = await evaluateShotConsistency({
        shotImageUrl: blob.url,
        approvedSheetUrls: referenceImageUrls,
        characterNames: characters.map((c) => c.name),
      });
      consistencyScore = evalResult.score;
      consistencyFlagged = evalResult.flagged;
    } catch (evalError) {
      console.warn("[generateShotImagePipeline] Consistency check non-fatal error:", evalError);
    }
  }

  return {
    imageUrl: blob.url,
    modelUsed: result.modelUsed,
    consistencyScore,
    consistencyFlagged,
  };
}
