ALTER TABLE "subscriptions" ADD COLUMN "renderMinutes" integer DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "videoLimit";--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "videoMinutesLimit";--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "razorpaySubscriptionId";