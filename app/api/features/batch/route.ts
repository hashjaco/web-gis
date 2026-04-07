import { auth } from "@clerk/nextjs/server";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(request: Request) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { ids, properties } = body as {
    ids: string[];
    properties: Record<string, unknown>;
  };

  if (!ids?.length || !properties) {
    return NextResponse.json(
      { error: "ids and properties are required" },
      { status: 400 },
    );
  }

  let updated = 0;
  for (const id of ids) {
    const rows = (await db.execute(sql`
      UPDATE features SET
        properties = properties || ${JSON.stringify(properties)}::jsonb,
        updated_at = NOW()
      WHERE id = ${id}
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

  const body = await request.json();
  const { ids } = body as { ids: string[] };

  if (!ids?.length) {
    return NextResponse.json(
      { error: "ids array is required" },
      { status: 400 },
    );
  }

  let deleted = 0;
  for (const id of ids) {
    await db.execute(sql`DELETE FROM feature_history WHERE feature_id = ${id}`);
    const rows = (await db.execute(sql`
      DELETE FROM features WHERE id = ${id} RETURNING id
    `)) as unknown as Record<string, unknown>[];
    if (rows.length > 0) deleted++;
  }

  return NextResponse.json({ deleted });
}
