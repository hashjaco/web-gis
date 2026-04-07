import { auth } from "@clerk/nextjs/server";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const { userId } = await auth();
  const { searchParams } = new URL(request.url);
  const publicOnly = searchParams.get("public") === "true";

  let query;
  if (publicOnly) {
    query = sql`SELECT * FROM projects WHERE is_public = true ORDER BY updated_at DESC`;
  } else if (userId) {
    query = sql`SELECT * FROM projects WHERE owner_id = ${userId} OR is_public = true ORDER BY updated_at DESC`;
  } else {
    query = sql`SELECT * FROM projects WHERE is_public = true ORDER BY updated_at DESC`;
  }

  const rows = await db.execute(query);
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { name, description, state, isPublic } = body;

  if (!name || !state) {
    return NextResponse.json(
      { error: "name and state are required" },
      { status: 400 },
    );
  }

  const rows = await db.execute(sql`
    INSERT INTO projects (name, description, state, owner_id, is_public)
    VALUES (
      ${name},
      ${description ?? null},
      ${JSON.stringify(state)}::jsonb,
      ${userId},
      ${isPublic ?? false}
    )
    RETURNING *
  `);

  return NextResponse.json((rows as unknown as Record<string, unknown>[])[0], {
    status: 201,
  });
}
