import { auth } from "@clerk/nextjs/server";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorizeProject } from "@/lib/auth/authorize-project";
import { parseBody } from "@/lib/validation/parse";
import { batchUpdateSchema, batchDeleteSchema } from "@/lib/validation/schemas";

export async function PATCH(request: Request) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = await parseBody(request, batchUpdateSchema);
  if (parsed.error) return parsed.error;
  const { ids, properties, projectId } = parsed.data;

  const project = await authorizeProject(userId, projectId, "write");
  if (!project)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  let updated = 0;
  for (const id of ids) {
    const rows = (await db.execute(sql`
      UPDATE features SET
        properties = properties || ${JSON.stringify(properties)}::jsonb,
        updated_at = NOW()
      WHERE id = ${id} AND project_id = ${projectId}
      RETURNING id
    `)) as unknown as Record<string, unknown>[];
    if (rows.length > 0) {
      updated++;
      await db.execute(sql`
        INSERT INTO feature_history (feature_id, geom, properties, modified_by)
        SELECT id, geom, properties, ${userId}
        FROM features WHERE id = ${id}
      `);
    }
  }

  return NextResponse.json({ updated });
}

export async function DELETE(request: Request) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = await parseBody(request, batchDeleteSchema);
  if (parsed.error) return parsed.error;
  const { ids, projectId } = parsed.data;

  const project = await authorizeProject(userId, projectId, "write");
  if (!project)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  let deleted = 0;
  for (const id of ids) {
    await db.execute(sql`DELETE FROM feature_history WHERE feature_id = ${id}`);
    const rows = (await db.execute(sql`
      DELETE FROM features WHERE id = ${id} AND project_id = ${projectId} RETURNING id
    `)) as unknown as Record<string, unknown>[];
    if (rows.length > 0) deleted++;
  }

  return NextResponse.json({ deleted });
}
