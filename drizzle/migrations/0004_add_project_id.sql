ALTER TABLE "layers" ADD COLUMN "project_id" uuid REFERENCES "projects"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "features" ADD COLUMN "project_id" uuid REFERENCES "projects"("id") ON DELETE CASCADE;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "layers_project_idx" ON "layers" ("project_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "features_project_idx" ON "features" ("project_id");
