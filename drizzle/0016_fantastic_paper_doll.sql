ALTER TABLE "users" ADD COLUMN "stay_arrived" date;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stay_departed" date;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "languages" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "interests" text[] DEFAULT '{}' NOT NULL;