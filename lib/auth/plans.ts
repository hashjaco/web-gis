export type UserPlan = "standard" | "pro" | "admin";

export const PLAN_HIERARCHY: Record<UserPlan, number> = {
  standard: 0,
  pro: 1,
  admin: 2,
};

export const FEATURE_PLAN_REQUIREMENTS: Record<string, UserPlan> = {
  layers: "standard",
  editing: "standard",
  import: "standard",
  export: "standard",
  routing: "standard",
  analysis: "pro",
  visualization: "pro",
  imagery: "pro",
  geoai: "pro",
  workflows: "pro",
  dashboard: "pro",
  scripting: "pro",
  media: "pro",
};

export function hasAccess(userPlan: UserPlan, requiredPlan: UserPlan): boolean {
  return PLAN_HIERARCHY[userPlan] >= PLAN_HIERARCHY[requiredPlan];
}
