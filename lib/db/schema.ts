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
