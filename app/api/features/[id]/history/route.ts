import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

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
