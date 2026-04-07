import {
  boolean,
  customType,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

const geometry = customType<{
  data: string;
  driverData: string;
}>({
  dataType() {
    return "geometry(Point,4326)";
  },
  toDriver(value: string): string {
    return value;
  },
  fromDriver(value: string): string {
    return value;
  },
});

export const mediaStreams = pgTable("media_streams", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  type: text("type").notNull().default("hls"),
  isActive: boolean("is_active").notNull().default(true),
  mapPosition: geometry("map_position"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: text("created_by"),
});

export const detections = pgTable("detections", {
  id: uuid("id").defaultRandom().primaryKey(),
  streamId: uuid("stream_id")
    .notNull()
    .references(() => mediaStreams.id),
  objectClass: text("object_class").notNull(),
  confidence: numeric("confidence").notNull(),
  boundingBox: jsonb("bounding_box").$type<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>(),
  detectedAt: timestamp("detected_at").defaultNow().notNull(),
  geometry: geometry("geometry"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
});
