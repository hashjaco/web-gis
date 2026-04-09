import { auth } from "@clerk/nextjs/server";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const featureRows = (await db.execute(
    sql`SELECT project_id FROM features WHERE id = ${id}`,
  )) as unknown as { project_id: string | null }[];

  if (featureRows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const projectId = featureRows[0].project_id;
  if (projectId) {
    const projectRows = (await db.execute(
      sql`SELECT owner_id, is_public FROM projects WHERE id = ${projectId}`,
    )) as unknown as { owner_id: string; is_public: boolean }[];

    if (projectRows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const project = projectRows[0];
    if (!project.is_public && project.owner_id !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  const rows = (await db.execute(sql`
    SELECT
      hist_id,
      feature_id,
      ST_AsGeoJSON(geom)::json AS geometry,
      properties,
      modified_at,
      modified_by
    FROM feature_history
    WHERE feature_id = ${id}
    ORDER BY modified_at DESC
    LIMIT 50
  `)) as unknown as Record<string, unknown>[];

  return NextResponse.json(rows);
}
