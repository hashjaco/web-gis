CREATE TABLE "feature_history" (
	"hist_id" serial PRIMARY KEY NOT NULL,
	"feature_id" uuid NOT NULL,
	"geom" geometry NOT NULL,
	"properties" jsonb DEFAULT '{}'::jsonb,
	"modified_at" timestamp DEFAULT now() NOT NULL,
	"modified_by" text
);
--> statement-breakpoint
CREATE TABLE "features" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"geom" geometry NOT NULL,
	"properties" jsonb DEFAULT '{}'::jsonb,
	"layer" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "layers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"source_type" text DEFAULT 'vector' NOT NULL,
	"style" jsonb,
	"order" integer DEFAULT 0 NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"opacity" integer DEFAULT 100 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
