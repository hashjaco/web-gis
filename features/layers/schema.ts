import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { projects } from "@/features/projects/schema";

export const layers = pgTable(
  "layers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    sourceType: text("source_type").notNull().default("vector"),
    style: jsonb("style").$type<Record<string, unknown>>(),
    order: integer("order").notNull().default(0),
    isVisible: boolean("is_visible").notNull().default(true),
    opacity: integer("opacity").notNull().default(100),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "cascade",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("layers_project_idx").on(table.projectId)],
);
