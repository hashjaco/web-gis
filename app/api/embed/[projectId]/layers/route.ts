import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;

  const projects = (await db.execute(
    sql`SELECT state, is_public FROM projects WHERE id = ${projectId}`,
  )) as unknown as { state: Record<string, unknown>; is_public: boolean }[];

  if (projects.length === 0 || !projects[0].is_public) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const layerIds = (projects[0].state?.layerIds ?? []) as string[];
  if (layerIds.length === 0) {
    return NextResponse.json([]);
  }

  const rows = await db.execute(sql`
    SELECT id, name, source_type AS "sourceType", style, "order",
           is_visible AS "isVisible", opacity
    FROM layers
    WHERE id = ANY(${layerIds})
    ORDER BY "order" ASC
  `);

  return NextResponse.json(rows);
}
