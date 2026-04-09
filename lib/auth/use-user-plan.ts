"use client";

import { useUser, useOrganization } from "@clerk/nextjs";
import {
  type AddOn,
  type UserPlan,
  hasAccess,
  hasAddOn,
  normalizeAddOns,
  normalizePlan,
  PLAN_HIERARCHY,
  FEATURE_PLAN_REQUIREMENTS,
} from "./plans";

export function useUserPlan(): {
  plan: UserPlan;
  addOns: AddOn[];
  canAccess: (featureId: string) => boolean;
  hasCollaboration: boolean;
  isGuest: boolean;
  isPro: boolean;
  isTeam: boolean;
  isAdmin: boolean;
} {
  const { user } = useUser();
  const { organization } = useOrganization();

  const userMeta = user?.publicMetadata as Record<string, unknown> | undefined;
  const orgMeta = organization?.publicMetadata as
    | Record<string, unknown>
    | undefined;

  const personalPlan: UserPlan = user
    ? normalizePlan(userMeta?.plan)
    : "guest";

  const orgPlan: UserPlan | null = organization
    ? normalizePlan(orgMeta?.plan)
    : null;

  const plan: UserPlan =
    orgPlan && PLAN_HIERARCHY[orgPlan] > PLAN_HIERARCHY[personalPlan]
      ? orgPlan
      : personalPlan;

  const userAddOns = normalizeAddOns(userMeta?.addOns);
  const orgAddOns = normalizeAddOns(orgMeta?.addOns);
  const addOns = Array.from(new Set([...userAddOns, ...orgAddOns])) as AddOn[];

  return {
    plan,
    addOns,
    canAccess: (featureId: string) => {
      const required = FEATURE_PLAN_REQUIREMENTS[featureId] ?? "free";
      return hasAccess(plan, required);
    },
    hasCollaboration: hasAddOn(addOns, "collaboration"),
    isGuest: plan === "guest",
    isPro: hasAccess(plan, "pro"),
    isTeam: hasAccess(plan, "team"),
    isAdmin: hasAccess(plan, "admin"),
  };
}
