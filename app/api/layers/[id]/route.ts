import { auth } from "@clerk/nextjs/server";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { layers } from "@/lib/db/schema";
import { authorizeProject } from "@/lib/auth/authorize-project";

async function getLayerProjectId(layerId: string): Promise<string | null> {
  const rows = (await db.execute(
    sql`SELECT project_id FROM layers WHERE id = ${layerId}`,
  )) as unknown as { project_id: string | null }[];
  return rows[0]?.project_id ?? null;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const projectId = await getLayerProjectId(id);
    if (!projectId)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const project = await authorizeProject(userId, projectId, "write");
    if (!project)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await request.json();

    const [updated] = await db
      .update(layers)
      .set({
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.style !== undefined && { style: body.style }),
        ...(body.order !== undefined && { order: body.order }),
        ...(body.isVisible !== undefined && { isVisible: body.isVisible }),
        ...(body.opacity !== undefined && { opacity: body.opacity }),
        updatedAt: new Date(),
      })
      .where(eq(layers.id, id))
      .returning();

    if (!updated)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("PUT /api/layers/[id] failed:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const projectId = await getLayerProjectId(id);
    if (!projectId)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const project = await authorizeProject(userId, projectId, "write");
    if (!project)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    await db.execute(sql`
      DELETE FROM feature_history
      WHERE feature_id IN (SELECT id FROM features WHERE layer = ${id})
    `);
    await db.execute(sql`DELETE FROM features WHERE layer = ${id}`);

    const [deleted] = await db
      .delete(layers)
      .where(eq(layers.id, id))
      .returning();

    if (!deleted)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/layers/[id] failed:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
