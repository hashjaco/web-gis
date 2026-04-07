import {
  customType,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

const geometry = customType<{
  data: string;
  driverData: string;
}>({
  dataType() {
    return "geometry";
  },
  toDriver(value: string): string {
    return value;
  },
  fromDriver(value: string): string {
    return value;
  },
});

export const features = pgTable("features", {
  id: uuid("id").defaultRandom().primaryKey(),
  geom: geometry("geom").notNull(),
  properties: jsonb("properties").$type<Record<string, unknown>>().default({}),
  layer: text("layer").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const featureHistory = pgTable("feature_history", {
  histId: serial("hist_id").primaryKey(),
  featureId: uuid("feature_id").notNull(),
  geom: geometry("geom").notNull(),
  properties: jsonb("properties").$type<Record<string, unknown>>().default({}),
  modifiedAt: timestamp("modified_at").defaultNow().notNull(),
  modifiedBy: text("modified_by"),
});
