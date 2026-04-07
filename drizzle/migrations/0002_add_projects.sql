CREATE TABLE IF NOT EXISTS "projects" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "description" text,
  "state" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "owner_id" text NOT NULL,
  "is_public" boolean NOT NULL DEFAULT false,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "projects_owner_idx" ON "projects" ("owner_id");
CREATE INDEX IF NOT EXISTS "projects_public_idx" ON "projects" ("is_public") WHERE "is_public" = true;
