import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const body = await request.json();
  const { operation, distance, layer, targetLayer } = body;

  if (!operation) {
    return NextResponse.json(
      { error: "operation is required" },
      { status: 400 },
    );
  }

  switch (operation) {
    case "buffer": {
      if (!layer || !distance) {
        return NextResponse.json(
          { error: "layer and distance are required for buffer" },
          { status: 400 },
        );
      }
      const rows = (await db.execute(sql`
        SELECT
          f.id,
          ST_AsGeoJSON(
            ST_Buffer(f.geom::geography, ${distance})::geometry
          )::json AS geometry,
          f.properties
        FROM features f
        WHERE f.layer = ${layer}
      `)) as unknown as Record<string, unknown>[];

      return NextResponse.json({
        type: "FeatureCollection",
        features: rows.map((r) => ({
          type: "Feature",
          id: r.id,
          geometry: r.geometry,
          properties: {
            ...(r.properties as Record<string, unknown>),
            operation: "buffer",
            distance,
          },
        })),
      });
    }

    case "intersect": {
      if (!layer || !targetLayer) {
        return NextResponse.json(
          { error: "layer and targetLayer are required for intersect" },
          { status: 400 },
        );
      }
      const rows = (await db.execute(sql`
        SELECT
          t.id,
          ST_AsGeoJSON(ST_Intersection(t.geom, s.geom))::json AS geometry,
          t.properties
        FROM features t
        JOIN features s ON ST_Intersects(t.geom, s.geom)
        WHERE t.layer = ${targetLayer}
          AND s.layer = ${layer}
      `)) as unknown as Record<string, unknown>[];

      return NextResponse.json({
        type: "FeatureCollection",
        features: rows.map((r) => ({
          type: "Feature",
          id: r.id,
          geometry: r.geometry,
          properties: r.properties,
        })),
      });
    }

    case "within": {
      if (!layer || !targetLayer) {
        return NextResponse.json(
          { error: "layer and targetLayer are required for within" },
          { status: 400 },
        );
      }
      const rows = (await db.execute(sql`
        SELECT
          t.id,
          ST_AsGeoJSON(t.geom)::json AS geometry,
          t.properties
        FROM features t
        WHERE t.layer = ${targetLayer}
          AND EXISTS (
            SELECT 1 FROM features s
            WHERE s.layer = ${layer}
              AND ST_Within(t.geom, s.geom)
          )
      `)) as unknown as Record<string, unknown>[];

      return NextResponse.json({
        type: "FeatureCollection",
        features: rows.map((r) => ({
          type: "Feature",
          id: r.id,
          geometry: r.geometry,
          properties: r.properties,
        })),
      });
    }

    case "union": {
      if (!layer) {
        return NextResponse.json(
          { error: "layer is required for union" },
          { status: 400 },
        );
      }
      const rows = (await db.execute(sql`
        SELECT ST_AsGeoJSON(ST_Union(f.geom))::json AS geometry
        FROM features f
        WHERE f.layer = ${layer}
      `)) as unknown as Record<string, unknown>[];

      return NextResponse.json({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: rows[0]?.geometry,
            properties: { operation: "union", layer },
          },
        ],
      });
    }

    default:
      return NextResponse.json(
        { error: `Unknown operation: ${operation}` },
        { status: 400 },
      );
  }
}
