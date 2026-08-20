CREATE TABLE "storyboardLocations" (
	"id" text PRIMARY KEY NOT NULL,
	"projectId" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"lightingNotes" text,
	"referenceImageUrl" text,
	"generatedImageUrl" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "storyboardObjects" (
	"id" text PRIMARY KEY NOT NULL,
	"projectId" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"importance" text DEFAULT 'recurring' NOT NULL,
	"referenceImageUrl" text,
	"generatedImageUrl" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "storyboardProjects" ADD COLUMN "coverImage" text;--> statement-breakpoint
ALTER TABLE "storyboardLocations" ADD CONSTRAINT "storyboardLocations_projectId_storyboardProjects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."storyboardProjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storyboardObjects" ADD CONSTRAINT "storyboardObjects_projectId_storyboardProjects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."storyboardProjects"("id") ON DELETE cascade ON UPDATE no action;