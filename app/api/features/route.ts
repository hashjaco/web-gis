import { auth } from "@clerk/nextjs/server";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorizeProject } from "@/lib/auth/authorize-project";
import { getUserPlan } from "@/lib/auth/get-user-plan";
import { checkQuota } from "@/lib/auth/check-quota";
import { parseBody } from "@/lib/validation/parse";
import { createFeatureSchema } from "@/lib/validation/schemas";
import { writeAuditLog } from "@/lib/audit/log";

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  const layerIds = searchParams.getAll("layer");
  const bbox = searchParams.get("bbox");

  if (!projectId) {
    return NextResponse.json(
      { error: "projectId is required" },
      { status: 400 },
    );
  }

  const project = await authorizeProject(userId, projectId, "read");
  if (!project)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  let query = sql`
    SELECT
      id,
      ST_AsGeoJSON(geom)::json AS geometry,
      properties,
      layer,
      created_at,
      updated_at
    FROM features
    WHERE project_id = ${projectId}
  `;

  if (layerIds.length === 1) {
    query = sql`${query} AND layer = ${layerIds[0]}`;
  } else if (layerIds.length > 1) {
    query = sql`${query} AND layer = ANY(${layerIds})`;
  }

  if (bbox) {
    const parts = bbox.split(",").map(Number);
    if (parts.length === 4 && parts.every((n) => !Number.isNaN(n))) {
      const [minX, minY, maxX, maxY] = parts;
      query = sql`${query} AND ST_Intersects(
        geom,
        ST_MakeEnvelope(${minX}, ${minY}, ${maxX}, ${maxY}, 4326)
      )`;
    }
  }

  const rows = await db.execute(query);

  const geojson = {
    type: "FeatureCollection" as const,
    features: (rows as unknown as Record<string, unknown>[]).map((row) => ({
      type: "Feature" as const,
      id: row.id,
      geometry: row.geometry,
      properties: {
        ...(row.properties as Record<string, unknown>),
        _id: row.id,
        _layer: row.layer,
        _geometry_type: (row.geometry as { type: string })?.type ?? "Unknown",
        _created_at: row.created_at,
        _updated_at: row.updated_at,
      },
    })),
  };

  return NextResponse.json(geojson);
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = await parseBody(request, createFeatureSchema);
  if (parsed.error) return parsed.error;
  const { geometry, properties, layer, projectId } = parsed.data;

  const project = await authorizeProject(userId, projectId, "write");
  if (!project)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { plan } = await getUserPlan();
  const quotaError = await checkQuota(plan, "features", { projectId });
  if (quotaError) return quotaError;

  const geomJson = JSON.stringify(geometry);

  const created = await db.execute(sql`
    INSERT INTO features (geom, properties, layer, project_id)
    VALUES (
      ST_SetSRID(ST_GeomFromGeoJSON(${geomJson}), 4326),
      ${JSON.stringify(properties ?? {})}::jsonb,
      ${layer},
      ${projectId}
    )
    RETURNING
      id,
      ST_AsGeoJSON(geom)::json AS geometry,
      properties,
      layer,
      created_at,
      updated_at
  `);

  const row = (created as unknown as Record<string, unknown>[])[0];

  await db.execute(sql`
    INSERT INTO feature_history (feature_id, geom, properties, modified_by)
    VALUES (
      ${row.id},
      ST_SetSRID(ST_GeomFromGeoJSON(${geomJson}), 4326),
      ${JSON.stringify(properties ?? {})}::jsonb,
      ${userId}
    )
  `);

  writeAuditLog({
    actorId: userId,
    action: "feature.create",
    resourceType: "feature",
    resourceId: row.id as string,
    metadata: { projectId, layer },
  });

  return NextResponse.json(row, { status: 201 });
}
