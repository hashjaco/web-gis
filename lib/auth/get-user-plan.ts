import { auth, clerkClient } from "@clerk/nextjs/server";
import {
  type AddOn,
  type UserPlan,
  hasAddOn,
  normalizeAddOns,
  normalizePlan,
} from "./plans";
import { resolveOrg, effectivePlan } from "./resolve-org";

interface UserPlanResult {
  plan: UserPlan;
  addOns: AddOn[];
  hasCollaboration: boolean;
}

/**
 * Reads the user's plan and add-ons from Clerk publicMetadata, elevating
 * the plan when the user's active organization has a higher-tier plan.
 * Add-ons from both user and org metadata are merged.
 *
 * Prefers the `metadata.plan` session claim (set via a custom JWT template
 * in the Clerk dashboard) for zero-latency reads. Falls back to fetching
 * the user via the Clerk Backend API when the claim is absent.
 *
 * Returns "guest" with no add-ons when there is no authenticated user.
 */
export async function getUserPlan(): Promise<UserPlanResult> {
  const { userId, sessionClaims } = await auth();
  if (!userId) return { plan: "guest", addOns: [], hasCollaboration: false };

  let personal: UserPlan = "free";
  let userAddOns: AddOn[] = [];

  const claimMeta = (sessionClaims as Record<string, unknown> | undefined)
    ?.metadata;
  if (claimMeta && typeof claimMeta === "object") {
    const meta = claimMeta as Record<string, unknown>;
    const raw = meta.plan;
    if (raw) personal = normalizePlan(raw);
    userAddOns = normalizeAddOns(meta.addOns);
  } else {
    try {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      const meta = user.publicMetadata as Record<string, unknown>;
      personal = normalizePlan(meta?.plan);
      userAddOns = normalizeAddOns(meta?.addOns);
    } catch {
      personal = "free";
    }
  }

  const { orgPlan, orgAddOns } = await resolveOrg();
  const plan = effectivePlan(personal, orgPlan);
  const addOns = Array.from(new Set([...userAddOns, ...orgAddOns])) as AddOn[];

  return { plan, addOns, hasCollaboration: hasAddOn(addOns, "collaboration") };
}
