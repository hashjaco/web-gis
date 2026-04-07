import { auth, clerkClient } from "@clerk/nextjs/server";
import type { UserPlan } from "./plans";

const VALID_PLANS = new Set<string>(["standard", "pro", "admin"]);

function isValidPlan(value: unknown): value is UserPlan {
  return typeof value === "string" && VALID_PLANS.has(value);
}

/**
 * Reads the user's plan from Clerk publicMetadata.
 *
 * Prefers the `metadata.plan` session claim (set via a custom JWT template
 * in the Clerk dashboard) for zero-latency reads. Falls back to fetching
 * the user via the Clerk Backend API when the claim is absent.
 */
export async function getUserPlan(): Promise<UserPlan> {
  const { userId, sessionClaims } = await auth();
  if (!userId) return "standard";

  const claimPlan = (sessionClaims as Record<string, unknown> | undefined)
    ?.metadata;
  if (
    claimPlan &&
    typeof claimPlan === "object" &&
    isValidPlan((claimPlan as Record<string, unknown>).plan)
  ) {
    return (claimPlan as Record<string, unknown>).plan as UserPlan;
  }

  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const plan = (user.publicMetadata as Record<string, unknown>)?.plan;
    return isValidPlan(plan) ? plan : "standard";
  } catch {
    return "standard";
  }
}
