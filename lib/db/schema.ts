import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  real,
} from "drizzle-orm/pg-core";

// --- Better Auth required tables -------------------------------------------
// Column names are camelCase to match Better Auth's defaults. Do not rename.

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),

  // NEW FIELDS FOR ONBOARDING
  onboardingCompleted: boolean("onboardingCompleted").notNull().default(false),
  profession: text("profession"),
  referralSource: text("referralSource"),

  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

// --- App tables for MotionRecap AI -----------------------------------------

export const projects = pgTable("projects", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  title: text("title").notNull(),
  description: text("description"),

  // Language & Copyright (set at project creation, locked)
  language: text("language").notNull().default("en"), // en, es, fr, de, it, ja, ko, pt, ru, zh
  isOriginalContent: boolean("isOriginalContent").notNull().default(true),
  contentPurpose: text("contentPurpose"), // "original" | "review" | "educational"
  copyrightAgreedAt: timestamp("copyrightAgreedAt"),

  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const videos = pgTable("videos", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  projectId: text("projectId").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  sourceImage: text("sourceImage").notNull(),
  videoUrl: text("videoUrl"),

  // 🆕 NEW FIELDS FOR AI VIDEO FEATURES
  subtitleUrl: text("subtitleUrl"), // URL to the generated .vtt file
  aspectRatio: text("aspectRatio").default("16:9"), // '9:16' | '16:9' | '1:1' | '4:5'
  subtitlesEnabled: boolean("subtitlesEnabled").default(true), // Toggle subtitles on/off

  status: text("status").notNull().default("draft"), // draft, processing, completed, failed
  duration: integer("duration"), // in seconds
  timeline: text("timeline").default("[]"), // JSON string of timeline data

  // Incremental rendering tracking
  lastRenderedUpToScene: integer("lastRenderedUpToScene").default(0), // Last scene included in rendered video
  lastRenderedVideoUrl: text("lastRenderedVideoUrl"), // URL of last rendered segment (for appending)

  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const voiceProfiles = pgTable("voiceProfiles", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  name: text("name").notNull(),
  voiceId: text("voiceId").notNull(),
  language: text("language").notNull().default("en"),
  speed: text("speed").notNull().default("1"), // 0.5 to 2.0
  pitch: text("pitch").notNull().default("0"), // -10 to 10
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  // existing columns you already had
  tier: text("tier").notNull().default("free"), // "free" | "creator" | "pro"
  status: text("status").notNull().default("active"),
  renderMinutes: integer("render_minutes").notNull().default(10),

  // NEW: which provider is billing this subscription
  provider: text("provider"), // "razorpay" | "paypal" | null
  razorpaySubscriptionId: text("razorpay_subscription_id"),
  paypalSubscriptionId: text("paypal_subscription_id"),

  // NEW: usage tracking, reset every billing period
  renderMinutesUsed: real("render_minutes_used").notNull().default(0),
  currentPeriodStart: timestamp("current_period_start", {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true })
    .notNull()
    .defaultNow(),

  // NEW: cancellation + tier-change scheduling
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  pendingTier: text("pending_tier"), // set when a downgrade is scheduled for period end

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// --- Storyboard Studio (isolated module) ------------
export const storyboardProjects = pgTable("storyboardProjects", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  title: text("title").notNull(),
  coverImage: text("coverImage"),
  genre: text("genre"), // "Action" | "Animation" | "Comedy" | "Commercial" | ...
  artStyle: text("artStyle").notNull().default("anime"), // "comic" | "cinematic" | "anime" | ...
  aspectRatio: text("aspectRatio").notNull().default("16:9"), // "16:9" | "9:16" | "1:1" | "4:5" | "2.39:1"
  status: text("status").notNull().default("draft"),
  // "draft" | "breakdown_ready" | "style_selected" | "shot_list" | "storyboard" | "ready" | "animatic" | "exported"
  scriptText: text("scriptText"), // raw parsed script text
  animaticUrl: text("animaticUrl"), // rough preview render, set by /animatic
  animaticStatus: text("animaticStatus").notNull().default("none"),
  // "none" | "building" | "ready" | "failed"
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const storyboardScenes = pgTable("storyboardScenes", {
  id: text("id").primaryKey(),
  projectId: text("projectId")
    .notNull()
    .references(() => storyboardProjects.id, { onDelete: "cascade" }),
  orderIndex: integer("orderIndex").notNull().default(0),
  title: text("title").notNull().default(""),
  description: text("description"),
  narrationText: text("narrationText"),
  durationEstimate: real("durationEstimate").default(3),
  voiceAudioUrl: text("voiceAudioUrl"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const storyboardCharacters = pgTable("storyboardCharacters", {
  id: text("id").primaryKey(),
  projectId: text("projectId")
    .notNull()
    .references(() => storyboardProjects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  clothing: text("clothing"),
  consistencyNotes: text("consistencyNotes"),
  referenceImageUrls: jsonb("referenceImageUrls").$type<string[]>().default([]),
  pendingSheetUrl: text("pendingSheetUrl"), // freshly generated, not yet approved
  approvedSheetUrl: text("approvedSheetUrl"), // locked-in reference used for conditioning
  conditioningMode: text("conditioningMode").notNull().default("description"),
  // "description" | "image" | "both" — how this character should be conditioned
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const storyboardShots = pgTable("storyboardShots", {
  id: text("id").primaryKey(),
  projectId: text("projectId")
    .notNull()
    .references(() => storyboardProjects.id, { onDelete: "cascade" }),
  sceneId: text("sceneId").references(() => storyboardScenes.id, {
    onDelete: "cascade",
  }),
  order: integer("order").notNull().default(0),
  orderIndex: integer("orderIndex").notNull().default(0),
  description: text("description").notNull().default(""),
  shotType: text("shotType"), // "wide" | "close-up" | "action" | "reaction" | "establishing" | "extreme-close-up" | "medium" | "pov"
  cameraAngle: text("cameraAngle"), // "eye-level" | "low-angle" | "high-angle" | "birds-eye" | "dutch-angle" | "over-the-shoulder"
  perspective: text("perspective"), // "1-point" | "2-point" | "3-point" | "isometric" | "panoramic"
  movement: text("movement"), // "static" | "pan-left" | "pan-right" | "tilt-up" | "tilt-down" | "zoom-in" | "zoom-out" | "tracking" | "handheld"
  duration: real("duration").default(3),
  dialogue: text("dialogue"),
  characterIds: jsonb("characterIds").$type<string[]>().default([]),
  draftNarration: text("draftNarration").default(""),
  estDuration: real("estDuration").default(3), // seconds

  generatedImageUrl: text("generatedImageUrl"),
  generationStatus: text("generationStatus").notNull().default("pending"),
  // "pending" | "generating" | "complete" | "failed"
  regenerateCount: integer("regenerateCount").notNull().default(0),
  modelUsed: text("modelUsed"), // "flux" | "nano-banana"

  consistencyScore: real("consistencyScore"),
  consistencyFlagged: boolean("consistencyFlagged").notNull().default(false),

  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const storyboardLocations = pgTable("storyboardLocations", {
  id: text("id").primaryKey(),
  projectId: text("projectId")
    .notNull()
    .references(() => storyboardProjects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"), // physical layout, architecture, atmosphere
  lightingNotes: text("lightingNotes"), // e.g. "warm floor lamp, golden hour window light"
  referenceImageUrl: text("referenceImageUrl"), // user-uploaded reference
  generatedImageUrl: text("generatedImageUrl"), // AI-generated reference for conditioning
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const storyboardObjects = pgTable("storyboardObjects", {
  id: text("id").primaryKey(),
  projectId: text("projectId")
    .notNull()
    .references(() => storyboardProjects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"), // visual details, materials, colors
  importance: text("importance").notNull().default("recurring"),
  // "key_prop" — central to the story (e.g. glue tube, magic sword)
  // "recurring" — appears in multiple scenes (e.g. tote bag, car)
  // "background" — set dressing, less critical
  referenceImageUrl: text("referenceImageUrl"), // user-uploaded reference
  generatedImageUrl: text("generatedImageUrl"), // AI-generated reference
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const storyboardUsage = pgTable("storyboardUsage", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  periodStart: timestamp("periodStart", { withTimezone: true })
    .notNull()
    .defaultNow(),
  periodEnd: timestamp("periodEnd", { withTimezone: true })
    .notNull()
    .defaultNow(),
  generationsThisPeriod: integer("generationsThisPeriod").notNull().default(0),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const paymentEvents = pgTable("payment_events", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(), // "razorpay" | "paypal"
  eventType: text("event_type").notNull(), // e.g. "subscription.charged"
  amount: integer("amount"), // smallest currency unit (paise / cents)
  currency: text("currency"),
  rawPayload: jsonb("raw_payload"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
