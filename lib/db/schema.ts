import { pgTable, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core'

// --- Better Auth required tables -------------------------------------------
// Column names are camelCase to match Better Auth's defaults. Do not rename.

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
})

// --- App tables for MangaMotion AI -----------------------------------------

export const projects = pgTable('projects', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

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


export const voiceProfiles = pgTable('voiceProfiles', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  name: text('name').notNull(),
  voiceId: text('voiceId').notNull(),
  language: text('language').notNull().default('en'),
  speed: text('speed').notNull().default('1'), // 0.5 to 2.0
  pitch: text('pitch').notNull().default('0'), // -10 to 10
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const subscriptions = pgTable('subscriptions', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull().unique(),
  tier: text('tier').notNull().default('free'), // free, pro, premium
  status: text('status').notNull().default('active'),
  videoLimit: integer('videoLimit').notNull().default(5),
  videoMinutesLimit: integer('videoMinutesLimit').notNull().default(60),
  razorpaySubscriptionId: text('razorpaySubscriptionId'),
  paypalSubscriptionId: text('paypalSubscriptionId'),
  renewalDate: timestamp('renewalDate'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})
