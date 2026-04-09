import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    state: jsonb("state").$type<Record<string, unknown>>().notNull(),
    ownerId: text("owner_id").notNull(),
    orgId: text("org_id"),
    isPublic: boolean("is_public").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("projects_org_idx").on(table.orgId),
    index("projects_owner_idx").on(table.ownerId),
  ],
);
