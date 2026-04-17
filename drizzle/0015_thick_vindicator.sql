ALTER TABLE "users" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint

-- v4 status 매핑: 기존 enum 값을 새 체계(local/expat/visitor/visiting_soon/visited_before)로 변환
UPDATE "users" SET "status" = CASE "status"
  WHEN 'local_korean'  THEN 'local'
  WHEN 'local_student' THEN 'local'
  WHEN 'korean_worker' THEN 'local'
  WHEN 'expat'         THEN 'expat'
  WHEN 'student'       THEN 'expat'
  WHEN 'tourist'       THEN 'visitor'
  ELSE "status"
END
WHERE "status" IS NOT NULL;--> statement-breakpoint

ALTER TABLE "users" ADD COLUMN "looking_for" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
DROP TYPE "public"."user_status";
