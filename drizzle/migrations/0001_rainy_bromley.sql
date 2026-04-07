CREATE TABLE "detections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stream_id" uuid NOT NULL,
	"object_class" text NOT NULL,
	"confidence" numeric NOT NULL,
	"bounding_box" jsonb,
	"detected_at" timestamp DEFAULT now() NOT NULL,
	"geometry" geometry(Point,4326),
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "media_streams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"type" text DEFAULT 'hls' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"map_position" geometry(Point,4326),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text
);
--> statement-breakpoint
ALTER TABLE "detections" ADD CONSTRAINT "detections_stream_id_media_streams_id_fk" FOREIGN KEY ("stream_id") REFERENCES "public"."media_streams"("id") ON DELETE no action ON UPDATE no action;