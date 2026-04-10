import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { resolveOrg } from "./resolve-org";
// #region agent log
import { appendFileSync } from "fs";
const _dbg = (msg: string, data: Record<string, unknown>) => { try { appendFileSync('/Users/hashim/Projects/gis-web/.cursor/debug-38ed0f.log', JSON.stringify({sessionId:'38ed0f',location:'lib/auth/authorize-project.ts',message:msg,data,timestamp:Date.now()}) + '\n'); } catch {} };
// #endregion

interface ProjectRow {
  id: string;
  owner_id: string;
  org_id: string | null;
  is_public: boolean;
  state: Record<string, unknown>;
}

type AccessMode = "read" | "write";

/** Org roles that grant write access to org projects. */
const WRITE_ROLES = new Set(["org:admin", "org:editor"]);

/**
 * Verifies the user has access to a project.
 *
 * - **write**: owner, OR org admin/editor when project belongs to that org
 * - **read**: owner, public, OR any org member when project belongs to that org
 *
 * Returns the project row on success, `null` if access is denied or
 * the project does not exist.
 */
export async function authorizeProject(
  userId: string | null,
  projectId: string,
  mode: AccessMode = "read",
): Promise<ProjectRow | null> {
  const rows = (await db.execute(
    sql`SELECT id, owner_id, org_id, is_public, state FROM projects WHERE id = ${projectId}`,
  )) as unknown as ProjectRow[];

  // #region agent log
  _dbg('authorize-query-result', {projectId, userId, mode, rowCount: rows.length, isArray: Array.isArray(rows), rawType: typeof rows, hasRows: rows?.length > 0, firstRowOwnerId: rows?.[0]?.owner_id});
  // #endregion

  if (rows.length === 0) return null;

  const project = rows[0];

  // Owner always has full access
  if (project.owner_id === userId) return project;

  // Org-scoped project: check org membership and role
  if (project.org_id) {
    const { orgId, orgRole } = await resolveOrg();
    if (orgId && orgId === project.org_id) {
      if (mode === "read") return project;
      if (orgRole && WRITE_ROLES.has(orgRole)) return project;
      // Viewer role in org — deny write
      return null;
    }
  }

  // Public projects are readable by anyone
  if (mode === "read" && project.is_public) return project;

  return null;
}
