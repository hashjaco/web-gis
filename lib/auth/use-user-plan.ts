"use client";

import { useUser } from "@clerk/nextjs";
import { type UserPlan, hasAccess, FEATURE_PLAN_REQUIREMENTS } from "./plans";

export function useUserPlan(): {
  plan: UserPlan;
  canAccess: (featureId: string) => boolean;
  isPro: boolean;
  isAdmin: boolean;
} {
  const { user } = useUser();
  const plan: UserPlan =
    (user?.publicMetadata as Record<string, unknown> | undefined)?.plan as UserPlan ??
    "standard";

  return {
    plan,
    canAccess: (featureId: string) => {
      const required = FEATURE_PLAN_REQUIREMENTS[featureId] ?? "standard";
      return hasAccess(plan, required);
    },
    isPro: hasAccess(plan, "pro"),
    isAdmin: hasAccess(plan, "admin"),
  };
}
