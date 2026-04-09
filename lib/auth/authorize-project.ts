import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { resolveOrg } from "./resolve-org";

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
