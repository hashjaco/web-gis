export type UserPlan =
  | "guest"
  | "free"
  | "pro"
  | "team"
  | "enterprise"
  | "admin";

export const PLAN_HIERARCHY: Record<UserPlan, number> = {
  guest: 0,
  free: 1,
  pro: 2,
  team: 3,
  enterprise: 4,
  admin: 5,
};

export const FEATURE_PLAN_REQUIREMENTS: Record<string, UserPlan> = {
  home: "guest",
  layers: "guest",
  editing: "guest",
  import: "guest",
  routing: "guest",
  export: "free",
  analysis: "pro",
  visualization: "pro",
  imagery: "pro",
  geoai: "pro",
  workflows: "pro",
  dashboard: "pro",
  scripting: "pro",
  media: "pro",
};

export type AddOn = "collaboration";

export const ADD_ON_REQUIREMENTS: Record<AddOn, UserPlan> = {
  collaboration: "team",
};

export function hasAddOn(addOns: AddOn[] | undefined, addOn: AddOn): boolean {
  return addOns?.includes(addOn) ?? false;
}

export function normalizeAddOns(value: unknown): AddOn[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (v): v is AddOn => typeof v === "string" && v === "collaboration",
  );
}

/** Accept legacy "standard" values and normalize to "free". */
export function normalizePlan(value: unknown): UserPlan {
  if (value === "standard") return "free";
  if (typeof value === "string" && value in PLAN_HIERARCHY) {
    return value as UserPlan;
  }
  return "free";
}

export function hasAccess(userPlan: UserPlan, requiredPlan: UserPlan): boolean {
  return PLAN_HIERARCHY[userPlan] >= PLAN_HIERARCHY[requiredPlan];
}
