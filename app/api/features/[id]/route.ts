import { auth } from "@clerk/nextjs/server";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorizeProject } from "@/lib/auth/authorize-project";

async function getFeatureProjectId(featureId: string): Promise<string | null> {
  const rows = (await db.execute(
    sql`SELECT project_id FROM features WHERE id = ${featureId}`,
  )) as unknown as { project_id: string | null }[];
  return rows[0]?.project_id ?? null;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const projectId = await getFeatureProjectId(id);
  if (!projectId)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const project = await authorizeProject(userId, projectId, "write");
  if (!project)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const { geometry, properties } = body;

  let updateQuery: ReturnType<typeof sql> | undefined;

  if (geometry && properties) {
    const geomJson = JSON.stringify(geometry);
    updateQuery = sql`
      UPDATE features SET
        geom = ST_SetSRID(ST_GeomFromGeoJSON(${geomJson}), 4326),
        properties = ${JSON.stringify(properties)}::jsonb,
        updated_at = NOW()
      WHERE id = ${id} AND project_id = ${projectId}
      RETURNING id, ST_AsGeoJSON(geom)::json AS geometry, properties, layer, created_at, updated_at
    `;
  } else if (geometry) {
    const geomJson = JSON.stringify(geometry);
    updateQuery = sql`
      UPDATE features SET
        geom = ST_SetSRID(ST_GeomFromGeoJSON(${geomJson}), 4326),
        updated_at = NOW()
      WHERE id = ${id} AND project_id = ${projectId}
      RETURNING id, ST_AsGeoJSON(geom)::json AS geometry, properties, layer, created_at, updated_at
    `;
  } else if (properties) {
    updateQuery = sql`
      UPDATE features SET
        properties = ${JSON.stringify(properties)}::jsonb,
        updated_at = NOW()
      WHERE id = ${id} AND project_id = ${projectId}
      RETURNING id, ST_AsGeoJSON(geom)::json AS geometry, properties, layer, created_at, updated_at
    `;
  } else {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const rows = (await db.execute(updateQuery)) as unknown as Record<
    string,
    unknown
  >[];
  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = rows[0];

  await db.execute(sql`
    INSERT INTO feature_history (feature_id, geom, properties, modified_by)
    SELECT id, geom, properties, ${userId}
    FROM features WHERE id = ${id}
  `);

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const projectId = await getFeatureProjectId(id);
  if (!projectId)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const project = await authorizeProject(userId, projectId, "write");
  if (!project)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.execute(sql`DELETE FROM feature_history WHERE feature_id = ${id}`);
  const rows = (await db.execute(sql`
    DELETE FROM features WHERE id = ${id} AND project_id = ${projectId} RETURNING id
  `)) as unknown as Record<string, unknown>[];

  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
