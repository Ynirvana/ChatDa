CREATE TYPE "public"."user_status" AS ENUM('tourist', 'student', 'expat', 'local_korean', 'local_student');--> statement-breakpoint
ALTER TYPE "public"."platform" ADD VALUE 'snapchat';--> statement-breakpoint
ALTER TYPE "public"."platform" ADD VALUE 'whatsapp';--> statement-breakpoint
ALTER TYPE "public"."platform" ADD VALUE 'kakao';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "status" "user_status";