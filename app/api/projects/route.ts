import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveOrg } from "@/lib/auth/resolve-org";
import { getUserPlan } from "@/lib/auth/get-user-plan";
import { checkQuota } from "@/lib/auth/check-quota";
import { parseBody } from "@/lib/validation/parse";
import { createProjectSchema } from "@/lib/validation/schemas";

export async function GET(request: Request) {
  const { userId, orgId } = await resolveOrg();
  const { searchParams } = new URL(request.url);
  const publicOnly = searchParams.get("public") === "true";

  if (publicOnly) {
    const rows = await db.execute(
      sql`SELECT * FROM projects WHERE is_public = true ORDER BY updated_at DESC`,
    );
    return NextResponse.json(rows);
  }

  if (!userId) {
    return NextResponse.json([]);
  }

  let query;
  if (orgId) {
    query = sql`
      SELECT * FROM projects
      WHERE org_id = ${orgId}
         OR (owner_id = ${userId} AND org_id IS NULL)
         OR is_public = true
      ORDER BY updated_at DESC
    `;
  } else {
    query = sql`
      SELECT * FROM projects
      WHERE (owner_id = ${userId} AND org_id IS NULL)
         OR is_public = true
      ORDER BY updated_at DESC
    `;
  }

  const rows = await db.execute(query);
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const { userId, orgId } = await resolveOrg();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { plan } = await getUserPlan();
  const quotaError = await checkQuota(plan, "projects", { userId });
  if (quotaError) return quotaError;

  const parsed = await parseBody(request, createProjectSchema);
  if (parsed.error) return parsed.error;
  const { name, description, state, isPublic } = parsed.data;

  const rows = await db.execute(sql`
    INSERT INTO projects (name, description, state, owner_id, org_id, is_public)
    VALUES (
      ${name},
      ${description ?? null},
      ${JSON.stringify(state)}::jsonb,
      ${userId},
      ${orgId},
      ${isPublic ?? false}
    )
    RETURNING *
  `);

  return NextResponse.json((rows as unknown as Record<string, unknown>[])[0], {
    status: 201,
  });
}
