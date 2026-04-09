import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
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
    return NextResponse.json({ type: "FeatureCollection", features: [] });
  }

  const { searchParams } = new URL(request.url);
  const requestedLayer = searchParams.get("layer");

  if (requestedLayer && !layerIds.includes(requestedLayer)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const targetLayers = requestedLayer ? [requestedLayer] : layerIds;

  const rows = (await db.execute(sql`
    SELECT
      id,
      ST_AsGeoJSON(geom)::json AS geometry,
      properties,
      layer
    FROM features
    WHERE layer = ANY(${targetLayers})
  `)) as unknown as Record<string, unknown>[];

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
