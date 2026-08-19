// lib/storyboard/tier-limits.ts
// Pure data & constants for Storyboarder AI Studio

export type StoryboardModel =  "nano-banana"|"flux" 
export type StoryboardTierKey = "free" | "creator" | "pro";

export interface StoryboardTierLimits {
  maxProjects: number;
  maxGenerationsPerMonth: number;
  maxCharactersPerProject: number;
  maxPdfPages: number;
  allowedModels: StoryboardModel[];
  canGenerateVoice: boolean;
}

export const STORYBOARD_LIMITS: Record<StoryboardTierKey, StoryboardTierLimits> = {
  free: {
    maxProjects: 2,
    maxGenerationsPerMonth: 25,
    maxCharactersPerProject: 4,
    maxPdfPages: 5,
    allowedModels: ["nano-banana","flux"],
    canGenerateVoice: true,
  },
  creator: {
    maxProjects: 5,
    maxGenerationsPerMonth: 200,
    maxCharactersPerProject: 10,
    maxPdfPages: 10,
    allowedModels: ["flux", "nano-banana"],
    canGenerateVoice: true,
  },
  pro: {
    maxProjects: 20,
    maxGenerationsPerMonth: 800,
    maxCharactersPerProject: 20,
    maxPdfPages: 20,
    allowedModels: ["flux", "nano-banana"],
    canGenerateVoice: true,
  },
};

export const MODEL_LABELS: Record<StoryboardModel, string> = {
  flux: "Flux Schnell — Fast Concept Sketches",
  "nano-banana": "Gemini Nano Pro — Turnaround Consistency",
};

export const GENRE_LIST = [
  {
    id: "Action",
    label: "Action & Combat",
    icon: "Flame",
    desc: "Kinetic movement, dynamic framing, explosive visual rhythm",
    imageUrl:
      "https://static.motionrecap.com/images/genres/action-and-Combat.webp",
  },

  {
    id: "Animation",
    label: "Animated Stylized",
    icon: "Sparkles",
    desc: "Expressive characters, imaginative worlds, bold visual language",
    imageUrl:
      "https://static.motionrecap.com/images/genres/animated-stylized.webp",
  },

  {
    id: "Comedy",
    label: "Comedy & Satire",
    icon: "Smile",
    desc: "Expressive reactions, playful framing, precise comedic timing",
    imageUrl:
      "https://static.motionrecap.com/images/genres/Comedy.webp",
  },

  {
    id: "Commercial",
    label: "Commercial & Ad",
    icon: "Tv",
    desc: "Hero compositions, polished lighting, premium product framing",
    imageUrl:
      "https://static.motionrecap.com/images/genres/Commercial.webp",
  },

  {
    id: "Documentary",
    label: "Documentary & Realism",
    icon: "Video",
    desc: "Observational framing, natural light, authentic human moments",
    imageUrl:
      "https://static.motionrecap.com/images/genres/Documentary.webp",
  },

  {
    id: "Drama",
    label: "Cinematic Drama",
    icon: "HeartHandshake",
    desc: "Intimate compositions, emotional tension, restrained camera movement",
    imageUrl:
      "https://static.motionrecap.com/images/genres/Cinematic.webp",
  },

  {
    id: "Educational",
    label: "Educational & Explainers",
    icon: "GraduationCap",
    desc: "Clear visual hierarchy, structured information, intentional pacing",
    imageUrl:
      "https://static.motionrecap.com/images/genres/Educational.webp",
  },

  {
    id: "Fantasy",
    label: "Epic Fantasy",
    icon: "Wand2",
    desc: "Mythical landscapes, grand scale, magic and cinematic spectacle",
    imageUrl:
      "https://static.motionrecap.com/images/genres/epic-fantasy.webp",
  },

  {
    id: "Horror",
    label: "Horror & Suspense",
    icon: "Ghost",
    desc: "Deep shadows, negative space, unsettling compositions",
    imageUrl:
      "https://static.motionrecap.com/images/genres/Horror.webp",
  },

  {
    id: "Music Video",
    label: "Music Video",
    icon: "Music",
    desc: "Stylized lighting, rhythmic edits, expressive performance imagery",
    imageUrl:
      "https://static.motionrecap.com/images/genres/Music.webp",
  },

  {
    id: "Mystery",
    label: "Detective Mystery",
    icon: "Search",
    desc: "Noir lighting, visual clues, investigative atmosphere",
    imageUrl:
      "https://static.motionrecap.com/images/genres/detective-mystery.webp",
  },

  {
    id: "Romance",
    label: "Romance & Melodrama",
    icon: "Heart",
    desc: "Warm light, intimate framing, emotional visual intimacy",
    imageUrl:
      "https://static.motionrecap.com/images/genres/Romance.webp",
  },

  {
    id: "Science Fiction",
    label: "Sci-Fi & Cyberpunk",
    icon: "Cpu",
    desc: "Neon cities, futuristic architecture, technology-driven worlds",
    imageUrl:
      "https://static.motionrecap.com/images/genres/Sci-Fi.webp",
  },

  {
    id: "Thriller",
    label: "Psychological Thriller",
    icon: "Zap",
    desc: "Paranoia, tension, fractured perspectives and controlled pacing",
    imageUrl:
      "https://static.motionrecap.com/images/genres/psychological-thriller.webp",
  },
] as const;

export const ART_STYLES = [
  {
    id: "comic",
    label: "Western Comic",
    desc: "Bold ink outlines, dramatic dynamic halftone shading",
    imageUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "cinematic",
    label: "Cinematic 35mm",
    desc: "Photorealistic film still, anamorphic lens flare & depth",
    imageUrl: "https://static.motionrecap.com/images/genres/Cinematic.webp",
  },
  {
    id: "soft_pencil",
    label: "Soft Graphite Pencil",
    desc: "Delicate hand-drawn pencil sketch with fine crosshatching",
    imageUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "animation_3d",
    label: "3D Animation CGI",
    desc: "Modern rendered CGI with soft subsurface lighting",
    imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "watercolor",
    label: "Artistic Watercolor",
    desc: "Fluid painterly watercolor washes on textured paper",
    imageUrl: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "photo_commercial",
    label: "Commercial Studio",
    desc: "Crisp studio lighting, high commercial clarity & sharpness",
    imageUrl: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "charcoal",
    label: "Charcoal Sketch",
    desc: "Moody, raw textured smudges with stark chiaroscuro",
    imageUrl: "https://images.unsplash.com/photo-1579783928621-7a13d66a62d1?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "dark_anime",
    label: "Dark Seinen Anime",
    desc: "Moody cyberpunk/fantasy anime aesthetic, dark tones",
    imageUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "flat_vector",
    label: "Modern Flat Vector",
    desc: "Clean geometric vector shapes, vibrant minimal palettes",
    imageUrl: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "noir",
    label: "Vintage Film Noir",
    desc: "Stark black & white contrast, venetian blind shadows",
    imageUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "stick_figure",
    label: "Director Stick Figure",
    desc: "Ultra-fast minimalist blocking for rapid choreography",
    imageUrl: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "graphic_novel",
    label: "Graphic Novel Ink",
    desc: "Heavy shadow blocks, gritty noir ink, graphic energy",
    imageUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "anime",
    label: "Manga & Anime",
    desc: "Classic Japanese animation cells, expressive eyes & speed",
    imageUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80",
  },
] as const;

export const ASPECT_RATIOS = [
  { id: "16:9", label: "16:9 Landscape", desc: "YouTube, TV, Theatrical Standard", icon: "Film" },
  { id: "9:16", label: "9:16 Vertical", desc: "TikTok, IG Reels, YT Shorts", icon: "Smartphone" },
  { id: "1:1", label: "1:1 Square", desc: "Instagram Feed, Square Ads", icon: "Square" },
  { id: "4:5", label: "4:5 Portrait", desc: "Social Feeds & Posters", icon: "RectangleVertical" },
  { id: "2.39:1", label: "2.39:1 Anamorphic", desc: "Ultra-Widescreen Hollywood Cinema", icon: "Tv" },
] as const;

// ─── Extra Pro Director Presets (Beyond Storyboarder.ai) ────────────────────
export const LIGHTING_PRESETS = [
  { id: "golden_hour", label: "Golden Hour Warmth", cue: "Warm sunset rim lighting, long dramatic shadows, orange-amber haze" },
  { id: "cyberpunk_neon", label: "Cyberpunk Neon", cue: "Bioluminescent cyan and magenta neon edge lights with deep shadows" },
  { id: "noir_chiaroscuro", label: "Noir Chiaroscuro", cue: "High-contrast harsh single-source spotlight with venetian blinds shadow" },
  { id: "dark_fantasy", label: "Dark Moody Fantasy", cue: "Eerie moonlit fog, cold desaturated tones, torch flame accents" },
  { id: "clean_studio", label: "Studio High-Key", cue: "Soft diffusers, balanced fill lights, zero harsh shadows, crisp clarity" },
  { id: "ethereal_dream", label: "Ethereal Dreamscape", cue: "Overexposed bloom, pastel volumetric light rays, soft lens flare" },
] as const;

export const LENS_PRESETS = [
  { id: "16mm", label: "16mm Ultra-Wide", desc: "Exaggerated perspective & massive environmental scope" },
  { id: "35mm", label: "35mm Cinematic", desc: "Standard Hollywood cinema street & medium blocking" },
  { id: "50mm", label: "50mm Human Eye", desc: "Natural organic perspective with zero distortion" },
  { id: "85mm", label: "85mm Portrait Bokeh", desc: "Compressed background with buttery smooth shallow depth" },
  { id: "100mm_macro", label: "100mm Macro Close-Up", desc: "Extreme tactile focus on eyes, objects, and details" },
] as const;

export const AUDIO_CUE_PRESETS = [
  "[FX: Gunshot echo in alley]",
  "[FX: Heavy rain on metal roof]",
  "[FX: Glass shattering]",
  "[FX: Sword clashing with sparks]",
  "[Music: Rising orchestral tension]",
  "[Music: Sudden eerie silence]",
  "[Music: High-tempo synthwave chase]",
] as const;
