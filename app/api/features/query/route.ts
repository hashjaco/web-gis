import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const body = await request.json();
  const { geometry, layer, operation = "intersects" } = body;

  if (!geometry) {
    return NextResponse.json(
      { error: "geometry is required" },
      { status: 400 },
    );
  }

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
    WHERE ${spatialClause}
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
