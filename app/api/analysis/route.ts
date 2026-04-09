import { auth } from "@clerk/nextjs/server";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorizeProject } from "@/lib/auth/authorize-project";
import { getUserPlan } from "@/lib/auth/get-user-plan";
import { hasAccess } from "@/lib/auth/plans";
import { checkRateLimit } from "@/lib/rate-limit";
import { parseBody } from "@/lib/validation/parse";
import { analysisSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rateLimited = await checkRateLimit(userId, "expensive");
  if (rateLimited) return rateLimited;

  const { plan } = await getUserPlan();
  if (!hasAccess(plan, "pro")) {
    return NextResponse.json(
      { error: "Analysis requires a Pro plan" },
      { status: 403 },
    );
  }

  const parsed = await parseBody(request, analysisSchema);
  if (parsed.error) return parsed.error;
  const { operation, distance, layer, targetLayer, projectId } = parsed.data;

  const project = await authorizeProject(userId, projectId, "read");
  if (!project)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

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
        WHERE f.layer = ${layer} AND f.project_id = ${projectId}
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
          AND t.project_id = ${projectId}
          AND s.project_id = ${projectId}
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
          AND t.project_id = ${projectId}
          AND EXISTS (
            SELECT 1 FROM features s
            WHERE s.layer = ${layer}
              AND s.project_id = ${projectId}
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
        WHERE f.layer = ${layer} AND f.project_id = ${projectId}
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
        { error: "Unknown operation" },
        { status: 400 },
      );
  }
}
