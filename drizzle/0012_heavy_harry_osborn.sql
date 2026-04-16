CREATE TABLE "banned_emails" (
	"email" text PRIMARY KEY NOT NULL,
	"banned_at" timestamp DEFAULT now() NOT NULL,
	"banned_by" text,
	"reason" text
);
