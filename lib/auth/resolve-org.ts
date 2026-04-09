import { auth, clerkClient } from "@clerk/nextjs/server";
import {
  type AddOn,
  type UserPlan,
  normalizeAddOns,
  normalizePlan,
  PLAN_HIERARCHY,
} from "./plans";

interface OrgContext {
  userId: string | null;
  orgId: string | null;
  orgRole: string | null;
  orgPlan: UserPlan | null;
  orgAddOns: AddOn[];
}

/**
 * Reads the current organization context from Clerk's session.
 *
 * When a user has selected an organization via OrganizationSwitcher,
 * `orgId` and `orgRole` will be populated. For personal workspace
 * usage, both will be `null`.
 *
 * Also resolves the org-level plan and add-ons from the organization's
 * publicMetadata.
 */
export async function resolveOrg(): Promise<OrgContext> {
  const { userId, orgId, orgRole } = await auth();

  let orgPlan: UserPlan | null = null;
  let orgAddOns: AddOn[] = [];
  if (orgId) {
    try {
      const client = await clerkClient();
      const org = await client.organizations.getOrganization({ organizationId: orgId });
      const meta = org.publicMetadata as Record<string, unknown> | undefined;
      const raw = meta?.plan;
      if (raw) orgPlan = normalizePlan(raw);
      orgAddOns = normalizeAddOns(meta?.addOns);
    } catch {
      // If we can't read the org, fall back to no org plan
    }
  }

  return {
    userId: userId ?? null,
    orgId: orgId ?? null,
    orgRole: orgRole ?? null,
    orgPlan,
    orgAddOns,
  };
}

/**
 * Returns the effective plan: the higher of the user's personal plan and
 * the active org's plan.
 */
export function effectivePlan(
  userPlan: UserPlan,
  orgPlan: UserPlan | null,
): UserPlan {
  if (!orgPlan) return userPlan;
  return PLAN_HIERARCHY[orgPlan] > PLAN_HIERARCHY[userPlan]
    ? orgPlan
    : userPlan;
}
