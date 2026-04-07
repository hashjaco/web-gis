import { auth } from "@clerk/nextjs/server";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const rows = (await db.execute(
    sql`SELECT * FROM projects WHERE id = ${id}`,
  )) as unknown as Record<string, unknown>[];

  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const project = rows[0];
  if (!project.is_public) {
    const { userId } = await auth();
    if (!userId || project.owner_id !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  return NextResponse.json(project);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { name, description, state, isPublic } = body;

  const rows = (await db.execute(sql`
    UPDATE projects SET
      name = COALESCE(${name ?? null}, name),
      description = COALESCE(${description ?? null}, description),
      state = COALESCE(${state ? JSON.stringify(state) : null}::jsonb, state),
      is_public = COALESCE(${isPublic ?? null}, is_public),
      updated_at = NOW()
    WHERE id = ${id} AND owner_id = ${userId}
    RETURNING *
  `)) as unknown as Record<string, unknown>[];

  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(rows[0]);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const rows = (await db.execute(sql`
    DELETE FROM projects WHERE id = ${id} AND owner_id = ${userId} RETURNING id
  `)) as unknown as Record<string, unknown>[];

  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
