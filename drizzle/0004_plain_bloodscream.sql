CREATE TABLE "payment_events" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"provider" text NOT NULL,
	"event_type" text NOT NULL,
	"amount" integer,
	"currency" text,
	"raw_payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_userId_unique";--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "render_minutes" integer DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "provider" text;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "razorpay_subscription_id" text;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "paypal_subscription_id" text;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "render_minutes_used" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "current_period_start" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "current_period_end" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "cancel_at_period_end" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "pending_tier" text;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "userId";--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "renderMinutes";--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "paypalSubscriptionId";--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "renewalDate";--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "createdAt";--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "updatedAt";