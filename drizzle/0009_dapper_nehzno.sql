CREATE TABLE "storyboardScenes" (
	"id" text PRIMARY KEY NOT NULL,
	"projectId" text NOT NULL,
	"orderIndex" integer DEFAULT 0 NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"description" text,
	"narrationText" text,
	"durationEstimate" real DEFAULT 3,
	"voiceAudioUrl" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "storyboardCharacters" ADD COLUMN "clothing" text;--> statement-breakpoint
ALTER TABLE "storyboardCharacters" ADD COLUMN "consistencyNotes" text;--> statement-breakpoint
ALTER TABLE "storyboardProjects" ADD COLUMN "genre" text;--> statement-breakpoint
ALTER TABLE "storyboardProjects" ADD COLUMN "aspectRatio" text DEFAULT '16:9' NOT NULL;--> statement-breakpoint
ALTER TABLE "storyboardShots" ADD COLUMN "sceneId" text;--> statement-breakpoint
ALTER TABLE "storyboardShots" ADD COLUMN "orderIndex" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "storyboardShots" ADD COLUMN "perspective" text;--> statement-breakpoint
ALTER TABLE "storyboardShots" ADD COLUMN "movement" text;--> statement-breakpoint
ALTER TABLE "storyboardShots" ADD COLUMN "duration" real DEFAULT 3;--> statement-breakpoint
ALTER TABLE "storyboardShots" ADD COLUMN "dialogue" text;--> statement-breakpoint
ALTER TABLE "storyboardScenes" ADD CONSTRAINT "storyboardScenes_projectId_storyboardProjects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."storyboardProjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storyboardShots" ADD CONSTRAINT "storyboardShots_sceneId_storyboardScenes_id_fk" FOREIGN KEY ("sceneId") REFERENCES "public"."storyboardScenes"("id") ON DELETE cascade ON UPDATE no action;