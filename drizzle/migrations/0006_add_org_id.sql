ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "org_id" text;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "projects_org_idx" ON "projects" ("org_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "projects_owner_idx" ON "projects" ("owner_id");
