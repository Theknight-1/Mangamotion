ALTER TABLE "storyboardCharacters" ADD COLUMN "conditioningMode" text DEFAULT 'description' NOT NULL;--> statement-breakpoint
ALTER TABLE "storyboardProjects" ADD COLUMN "animaticUrl" text;--> statement-breakpoint
ALTER TABLE "storyboardProjects" ADD COLUMN "animaticStatus" text DEFAULT 'none' NOT NULL;