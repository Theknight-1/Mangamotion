ALTER TABLE "projects" ADD COLUMN "language" text DEFAULT 'en' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "isOriginalContent" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "contentPurpose" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "copyrightAgreedAt" timestamp;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "lastRenderedUpToScene" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "lastRenderedVideoUrl" text;