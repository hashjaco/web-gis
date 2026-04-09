ALTER TABLE "user_profiles" ADD COLUMN "add_ons" text[] NOT NULL DEFAULT '{}'::text[];
