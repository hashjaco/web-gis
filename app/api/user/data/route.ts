import { auth } from "@clerk/nextjs/server";
import { sql } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userProfiles } from "@/lib/db/schema";
import { writeAuditLog } from "@/lib/audit/log";

/**
 * GET /api/user/data — GDPR Article 15: Right of access
 * Returns all data associated with the authenticated user.
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projects = (await db.execute(
    sql`SELECT id, name, description, is_public, created_at, updated_at FROM projects WHERE owner_id = ${userId}`,
  )) as unknown as Record<string, unknown>[];

  const projectIds = projects.map((p) => p.id as string);

  let features: Record<string, unknown>[] = [];
  let layers: Record<string, unknown>[] = [];

  if (projectIds.length > 0) {
    features = (await db.execute(sql`
      SELECT id, ST_AsGeoJSON(geom)::json AS geometry, properties, layer, project_id, created_at, updated_at
      FROM features WHERE project_id = ANY(${projectIds})
    `)) as unknown as Record<string, unknown>[];

    layers = (await db.execute(sql`
      SELECT id, name, description, source_type, style, "order", is_visible, opacity, project_id, created_at, updated_at
      FROM layers WHERE project_id = ANY(${projectIds})
    `)) as unknown as Record<string, unknown>[];
  }

  const profile = await db.select().from(userProfiles).where(
    eq(userProfiles.clerkId, userId),
  );

  writeAuditLog({
    actorId: userId,
    action: "user.data_export",
    resourceType: "user",
    resourceId: userId,
  });

  return NextResponse.json({
    profile: profile[0] ?? null,
    projects,
    layers,
    features,
    exportedAt: new Date().toISOString(),
  });
}

/**
 * DELETE /api/user/data — GDPR Article 17: Right to erasure
 * Deletes all data associated with the authenticated user.
 */
export async function DELETE() {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await db.execute(sql`
    DELETE FROM feature_history
    WHERE feature_id IN (
      SELECT f.id FROM features f
      JOIN projects p ON f.project_id = p.id
      WHERE p.owner_id = ${userId}
    )
  `);
  await db.execute(sql`
    DELETE FROM features WHERE project_id IN (
      SELECT id FROM projects WHERE owner_id = ${userId}
    )
  `);
  await db.execute(sql`
    DELETE FROM layers WHERE project_id IN (
      SELECT id FROM projects WHERE owner_id = ${userId}
    )
  `);
  await db.execute(sql`DELETE FROM projects WHERE owner_id = ${userId}`);
  await db.delete(userProfiles).where(eq(userProfiles.clerkId, userId));

  writeAuditLog({
    actorId: userId,
    action: "user.data_delete",
    resourceType: "user",
    resourceId: userId,
  });

  return NextResponse.json({ ok: true, message: "All user data has been deleted" });
}
