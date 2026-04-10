import { auth } from "@clerk/nextjs/server";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorizeProject } from "@/lib/auth/authorize-project";
import { parseBody } from "@/lib/validation/parse";
import { updateProjectSchema } from "@/lib/validation/schemas";
// #region agent log
import { appendFileSync } from "fs";
const _dbg = (msg: string, data: Record<string, unknown>) => { try { appendFileSync('/Users/hashim/Projects/gis-web/.cursor/debug-38ed0f.log', JSON.stringify({sessionId:'38ed0f',location:'api/projects/[id]/route.ts',message:msg,data,timestamp:Date.now()}) + '\n'); } catch {} };
// #endregion

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  const { id } = await params;

  const project = await authorizeProject(userId, id, "read");
  if (!project)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(project);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // #region agent log
  _dbg('PUT-entry', {url: request.url});
  // #endregion
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  // #region agent log
  _dbg('PUT-pre-authorize', {userId, id});
  // #endregion

  const project = await authorizeProject(userId, id, "write");
  // #region agent log
  _dbg('PUT-post-authorize', {projectFound: !!project, id, userId, ownerId: project?.owner_id});
  // #endregion
  if (!project)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = await parseBody(request, updateProjectSchema);
  if (parsed.error) {
    // #region agent log
    _dbg('PUT-parse-error', {id});
    // #endregion
    return parsed.error;
  }
  const { name, description, state, isPublic } = parsed.data;

  const rows = (await db.execute(sql`
    UPDATE projects SET
      name = COALESCE(${name ?? null}, name),
      description = COALESCE(${description ?? null}, description),
      state = COALESCE(${state ? JSON.stringify(state) : null}::jsonb, state),
      is_public = COALESCE(${isPublic ?? null}, is_public),
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `)) as unknown as Record<string, unknown>[];

  // #region agent log
  _dbg('PUT-update-result', {id, rowCount: rows.length, rowsType: typeof rows, isArray: Array.isArray(rows)});
  // #endregion
  if (rows.length === 0)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

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

  const project = await authorizeProject(userId, id, "write");
  if (!project)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const rows = (await db.execute(sql`
    DELETE FROM projects WHERE id = ${id} RETURNING id
  `)) as unknown as Record<string, unknown>[];

  if (rows.length === 0)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
