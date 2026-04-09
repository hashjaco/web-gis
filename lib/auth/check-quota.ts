import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { UserPlan } from "./plans";
import { getQuota, isUnlimited } from "./quotas";

type QuotaKind = "projects" | "layers" | "features" | "storageMb";

interface UsageCounts {
  projects: number;
  layers: number;
  features: number;
  storageMb: number;
}

async function countProjects(userId: string): Promise<number> {
  const rows = (await db.execute(
    sql`SELECT COUNT(*)::int AS count FROM projects WHERE owner_id = ${userId} AND org_id IS NULL`,
  )) as unknown as { count: number }[];
  return rows[0]?.count ?? 0;
}

async function countLayers(projectId: string): Promise<number> {
  const rows = (await db.execute(
    sql`SELECT COUNT(*)::int AS count FROM layers WHERE project_id = ${projectId}`,
  )) as unknown as { count: number }[];
  return rows[0]?.count ?? 0;
}

async function countFeatures(projectId: string): Promise<number> {
  const rows = (await db.execute(
    sql`SELECT COUNT(*)::int AS count FROM features WHERE project_id = ${projectId}`,
  )) as unknown as { count: number }[];
  return rows[0]?.count ?? 0;
}

/**
 * Check whether a specific quota kind would be exceeded by adding one more
 * resource. Returns a 403 NextResponse if over limit, or null if allowed.
 */
export async function checkQuota(
  plan: UserPlan,
  kind: QuotaKind,
  context: { userId?: string; projectId?: string },
): Promise<NextResponse | null> {
  const quota = getQuota(plan);
  const limit = quota[kind];
  if (isUnlimited(limit)) return null;

  let current = 0;

  switch (kind) {
    case "projects":
      if (!context.userId) return forbidden(kind, 0, limit);
      current = await countProjects(context.userId);
      break;
    case "layers":
      if (!context.projectId) return null;
      current = await countLayers(context.projectId);
      break;
    case "features":
      if (!context.projectId) return null;
      current = await countFeatures(context.projectId);
      break;
    case "storageMb":
      return null;
  }

  if (current >= limit) {
    return forbidden(kind, current, limit);
  }

  return null;
}

function forbidden(kind: string, current: number, limit: number): NextResponse {
  return NextResponse.json(
    {
      error: `You have reached the ${kind} limit for your plan (${current}/${limit}). Upgrade to increase your limit.`,
      code: "QUOTA_EXCEEDED",
      kind,
      current,
      limit,
    },
    { status: 403 },
  );
}

export async function getUsage(
  userId: string,
  projectId?: string,
): Promise<UsageCounts> {
  const projects = await countProjects(userId);
  const layers = projectId ? await countLayers(projectId) : 0;
  const features = projectId ? await countFeatures(projectId) : 0;
  return { projects, layers, features, storageMb: 0 };
}
