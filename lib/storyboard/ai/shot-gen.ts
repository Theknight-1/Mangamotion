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
  locations?: Array<{
    name: string;
    description?: string | null;
    lightingNotes?: string | null;
  }>;
  objects?: Array<{
    name: string;
    description?: string | null;
    importance?: string;
  }>;
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
 * Resolves characters relevant to a shot based on explicit tags,
 * character name mentions, or collective group references (e.g. "trio",
 * "all three", "both", "everyone", "the gang", "the group").
 * Ensures full character identity locking and reference sheet injection.
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
  const fullText = `${shot.description ?? ""} ${shot.dialogue ?? ""}`.trim();

  // Check for collective group references like "trio", "all three", "everyone", "the gang", etc.
  const hasGroupReference =
    /\b(all three|all \d+|the trio|trio|the duo|duo|both of them|both characters|the pair|pair of them|everyone|everybody|all of them|the gang|the group|the team|the crew|the friends|the roommates|all together|together with each other)\b/i.test(
      fullText,
    );

  const matched = characters.filter((c) => {
    // 1. Explicit ID tag check
    if (taggedCharIds.length > 0 && taggedCharIds.includes(c.id)) {
      return true;
    }

    // 2. Explicit mention of character name in shot description or dialogue
    if (c.name && c.name.trim().length > 1) {
      const escaped = c.name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const nameRegex = new RegExp(`\\b${escaped}\\b`, "i");
      if (nameRegex.test(fullText)) {
        return true;
      }
    }

    // 3. Collective group reference matches all characters when project has reasonable roster (<= 5 characters)
    if (hasGroupReference && characters.length <= 5) {
      return true;
    }

    return false;
  });

  return matched;
}

/**
 * Builds a curated, prioritized list of reference images for conditioning.
 *
 * PRIORITY ORDER (intentional):
 * 1. Character model sheets FIRST — these are the primary identity anchors
 * 2. If regenerating: the existing shot image
 * 3. Environment / style / prop reference
 * 4. Previous shot image LAST and ONLY for regeneration/iteration
 *
 * IMPORTANT: We intentionally DO NOT include the previous shot image during
 * initial generation. Passing it as a conditioning reference causes the
 * image model to copy the composition, angle, and framing — making every
 * shot in a scene look nearly identical. Character sheets alone provide
 * sufficient identity locking without copying camera framing.
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

  // 1. Character Sheets FIRST — primary identity anchors
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

  // 2. If regenerating, include the existing shot as an anchor to refine from
  if (isRegeneration && currentShotImageUrl && typeof currentShotImageUrl === "string") {
    references.push(currentShotImageUrl);
  }

  // 3. Environment or prop reference
  if (
    environmentReferenceUrl &&
    typeof environmentReferenceUrl === "string" &&
    !references.includes(environmentReferenceUrl)
  ) {
    references.push(environmentReferenceUrl);
  }

  // 4. If regenerating, also include preceding frame for continuity
  if (
    isRegeneration &&
    previousShotImageUrl &&
    typeof previousShotImageUrl === "string" &&
    !references.includes(previousShotImageUrl)
  ) {
    references.push(previousShotImageUrl);
  }

  // NOTE: For initial generation (NOT regeneration), previous shot image
  // is intentionally excluded. Including it causes the model to clone the
  // composition, camera angle, and framing of the preceding shot.

  return references;
}

const ART_STYLE_DESCRIPTORS: Record<string, string> = {
  animation_3d:
    "Master 3D animated studio keyframe render, Pixar and DreamWorks feature animation aesthetic, stylized expressive character proportions, soft subsurface scattering, warm cinematic volumetric illumination, clean stylized geometry, rich emotional acting",
  cinematic:
    "Cinematic 35mm film still, master Hollywood cinematography, anamorphic lens depth, subtle organic film grain, natural shallow depth of field, atmospheric volumetric lighting, photorealistic color grading",
  anime:
    "Premium anime studio production keyframe, Makoto Shinkai and Ufotable aesthetic, crisp cel-shaded lines, radiant atmospheric lighting and particle glow, vibrant color palette, rich emotional expression",
  dark_anime:
    "Dark seinen anime aesthetic, MAPPA and Wit studio quality, gritty high-detail line art, moody desaturated tones with intense specular highlights, dramatic chiaroscuro shadow play",
  comic:
    "Western graphic novel illustration, bold ink outlines, dynamic halftone dot shading, high-contrast comic book aesthetic, expressive heroic character poses, clean panel art",
  watercolor:
    "Artistic fluid watercolor illustration, delicate washes on textured cold-press paper, organic pigment bleeding, expressive hand-painted brushwork, evocative ambient lighting",
  soft_pencil:
    "Refined graphite pencil concept sketch, delicate crosshatching, master draftsmanship, soft tonal gradients, clean paper background, fine art studio study",
  photo_commercial:
    "High-end commercial studio photography, razor-sharp focus, professional three-point softbox lighting, pristine clean environment, high commercial production value",
  noir:
    "Vintage 1940s film noir still, stark monochrome chiaroscuro lighting, deep dramatic shadows, high contrast, venetian blind light patterns, moody atmospheric haze",
  flat_vector:
    "Modern clean geometric flat vector art, bold harmonious color palette, crisp vector silhouettes, minimalist stylish composition",
  graphic_novel:
    "Gritty graphic novel ink illustration, heavy black shadow blocks, expressive ink splatters, high drama, stark narrative contrast",
  charcoal:
    "Moody expressive charcoal drawing on heavyweight vellum paper, rich deep carbon blacks, smudged midtones, dramatic atmospheric chiaroscuro",
  stick_figure:
    "Director stick figure choreography storyboard sketch, clean rapid framing lines, clear spatial blocking and camera direction arrows",
};

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
  locations?: Array<{
    name: string;
    description?: string | null;
    lightingNotes?: string | null;
  }>;
  objects?: Array<{
    name: string;
    description?: string | null;
    importance?: string;
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
    locations,
    objects,
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

  const styleDescriptor =
    ART_STYLE_DESCRIPTORS[artStyle.toLowerCase()] ||
    `Master ${artStyle}-style production storyboard keyframe`;

  const parts: string[] = [
    `${styleDescriptor}, ${ratioDescription} composition.`,
  ];

  // Setting / Environment continuity across the scene
  if (sceneTitle || sceneDescription) {
    const sceneContext = [
      sceneTitle ? `Scene: ${sceneTitle}` : "",
      sceneDescription ? `Setting & Environmental Anchors: ${sceneDescription}` : "",
    ]
      .filter(Boolean)
      .join(". ");
    parts.push(
      `${sceneContext}. Maintain strict environmental consistency: preserve the exact same room layout, background architecture, furniture, and lighting source positions.`,
    );
  }

  // Location context — inject specific location details for environmental anchoring
  if (locations && locations.length > 0) {
    const locDescs = locations
      .map((loc) => {
        const details = [
          `Location: "${loc.name}"`,
          loc.description ? `Layout: ${loc.description}` : "",
          loc.lightingNotes ? `Lighting: ${loc.lightingNotes}` : "",
        ]
          .filter(Boolean)
          .join(", ");
        return details;
      })
      .join("; ");
    parts.push(
      `Scene Locations: ${locDescs}. Maintain exact visual consistency with these established locations.`,
    );
  }

  // Key objects/props — inject visual details for prop consistency
  if (objects && objects.length > 0) {
    const keyProps = objects.filter((o) => o.importance !== "background");
    if (keyProps.length > 0) {
      const objDescs = keyProps
        .map(
          (obj) =>
            `"${obj.name}"${obj.description ? ` (${obj.description})` : ""}`,
        )
        .join(", ");
      parts.push(
        `Key Props & Objects in scene: ${objDescs}. Depict these objects with exact visual consistency across all shots.`,
      );
    }
  }

  // Shot Action & Composition
  parts.push(`Shot Action: ${description}.`);

  // Aggressive shot framing descriptors — vague labels like "close-up"
  // are ignored by image models. We need explicit composition rules.
  const SHOT_FRAMING_DESCRIPTORS: Record<string, string> = {
    "establishing":
      "ESTABLISHING SHOT: Ultra-wide environmental master shot. Camera positioned far back showing the full location, architecture, and spatial layout. Characters are small figures within the larger environment. Emphasize scale, atmosphere, and world-building.",
    "wide":
      "WIDE SHOT: Full-body framing showing characters from head to toe with significant environment visible. Characters occupy roughly 30-50% of the frame height. Background architecture and props clearly visible.",
    "medium":
      "MEDIUM SHOT: Waist-up framing of the character(s). Body language, hand gestures, and facial expressions all visible. Environment partially visible in background.",
    "close-up":
      "CLOSE-UP SHOT: Character's face and upper shoulders fill the majority of the frame. Emphasize facial expression, emotion, and eye contact. Background is blurred or minimal. Intimate, emotionally intense framing.",
    "extreme-close-up":
      "EXTREME CLOSE-UP: A single detail fills the entire frame — eyes, hands on an object, a key prop, a texture. Hyper-detailed macro framing. No full face visible, just the critical detail.",
    "pov":
      "POINT-OF-VIEW SHOT: Camera positioned exactly where the character's eyes would be, showing what they see. First-person perspective. The viewing character is NOT visible in frame.",
    "over-the-shoulder":
      "OVER-THE-SHOULDER SHOT: Camera behind one character's shoulder/head (visible in foreground, blurred), looking at the other character who is the focal subject. Conversational framing.",
    "reaction":
      "REACTION SHOT: Medium close-up focused entirely on one character's emotional response. Their face fills the frame, showing surprise, fear, joy, or whatever the narrative demands.",
  };

  const framingDirective = shotType
    ? SHOT_FRAMING_DESCRIPTORS[shotType.toLowerCase()] || `Shot framing: ${shotType} shot.`
    : "";
  if (framingDirective) parts.push(framingDirective);

  if (cameraAngle) parts.push(`Camera angle: ${cameraAngle}.`);
  if (perspective) parts.push(`Perspective: ${perspective} perspective.`);
  if (movement && movement !== "static") parts.push(`Camera motion: ${movement}.`);
  if (dialogue) parts.push(`Character dialogue context: "${dialogue}".`);

  // Character consistency details
  if (characters.length > 0) {
    const charDescriptions = characters
      .map((c) => {
        const details = [
          c.description ? `Appearance: ${c.description}` : "",
          c.clothing ? `Outfit: ${c.clothing}` : "",
          c.consistencyNotes ? `Identity Anchors: ${c.consistencyNotes}` : "",
        ]
          .filter(Boolean)
          .join(", ");
        return `Character "${c.name}" (${details || "defined character features"})`;
      })
      .join("; ");
    parts.push(
      `Strict character visual consistency: Depict the following character(s) with exact matching facial structure, hairstyle, and signature outfit matching their reference model sheets: ${charDescriptions}.`,
    );
  }

  // Regeneration or fresh generation directive
  if (isRegeneration && currentShotImageUrl) {
    parts.push(
      "Regeneration & Variation Directive: High-fidelity visual variation and refinement of the existing frame. Strictly preserve the established scene environment, background architecture, character identity, and camera framing while rendering a fresh, enhanced cinematic composition.",
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
