import { auth } from "@clerk/nextjs/server";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorizeProject } from "@/lib/auth/authorize-project";
import { parseBody } from "@/lib/validation/parse";
import { spatialQuerySchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = await parseBody(request, spatialQuerySchema);
  if (parsed.error) return parsed.error;
  const { geometry, layer, operation, projectId } = parsed.data;

  const project = await authorizeProject(userId, projectId, "read");
  if (!project)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const geomJson = JSON.stringify(geometry);
  let spatialClause: ReturnType<typeof sql> | undefined;

  switch (operation) {
    case "within":
      spatialClause = sql`ST_Within(f.geom, ST_SetSRID(ST_GeomFromGeoJSON(${geomJson}), 4326))`;
      break;
    case "contains":
      spatialClause = sql`ST_Contains(f.geom, ST_SetSRID(ST_GeomFromGeoJSON(${geomJson}), 4326))`;
      break;
    default:
      spatialClause = sql`ST_Intersects(f.geom, ST_SetSRID(ST_GeomFromGeoJSON(${geomJson}), 4326))`;
      break;
  }

  let query = sql`
    SELECT
      f.id,
      ST_AsGeoJSON(f.geom)::json AS geometry,
      f.properties,
      f.layer,
      f.created_at,
      f.updated_at
    FROM features f
    WHERE ${spatialClause} AND f.project_id = ${projectId}
  `;

  if (layer) {
    query = sql`${query} AND f.layer = ${layer}`;
  }

  const rows = (await db.execute(query)) as unknown as Record<
    string,
    unknown
  >[];

  return NextResponse.json({
    type: "FeatureCollection",
    features: rows.map((row) => ({
      type: "Feature",
      id: row.id,
      geometry: row.geometry,
      properties: {
        ...(row.properties as Record<string, unknown>),
        _id: row.id,
        _layer: row.layer,
      },
    })),
  });
}
