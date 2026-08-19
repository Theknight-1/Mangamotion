CREATE TABLE "storyboardCharacters" (
	"id" text PRIMARY KEY NOT NULL,
	"projectId" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"referenceImageUrls" jsonb DEFAULT '[]'::jsonb,
	"pendingSheetUrl" text,
	"approvedSheetUrl" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "storyboardProjects" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"title" text NOT NULL,
	"artStyle" text DEFAULT 'anime' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"scriptText" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "storyboardShots" (
	"id" text PRIMARY KEY NOT NULL,
	"projectId" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"shotType" text,
	"cameraAngle" text,
	"characterIds" jsonb DEFAULT '[]'::jsonb,
	"draftNarration" text DEFAULT '',
	"estDuration" real DEFAULT 3,
	"generatedImageUrl" text,
	"generationStatus" text DEFAULT 'pending' NOT NULL,
	"regenerateCount" integer DEFAULT 0 NOT NULL,
	"modelUsed" text,
	"consistencyScore" real,
	"consistencyFlagged" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "storyboardUsage" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"periodStart" timestamp with time zone DEFAULT now() NOT NULL,
	"periodEnd" timestamp with time zone DEFAULT now() NOT NULL,
	"generationsThisPeriod" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "storyboardCharacters" ADD CONSTRAINT "storyboardCharacters_projectId_storyboardProjects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."storyboardProjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storyboardShots" ADD CONSTRAINT "storyboardShots_projectId_storyboardProjects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."storyboardProjects"("id") ON DELETE cascade ON UPDATE no action;