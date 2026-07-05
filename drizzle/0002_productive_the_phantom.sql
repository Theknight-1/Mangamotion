ALTER TABLE "user" ADD COLUMN "onboardingCompleted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "profession" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "referralSource" text;