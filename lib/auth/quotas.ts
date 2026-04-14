import type { UserPlan } from "./plans";

export interface PlanQuotas {
  /** Max projects (-1 = unlimited, 0 = none) */
  projects: number;
  /** Max layers per project */
  layers: number;
  /** Max features per project */
  features: number;
  /** Max upload storage in MB */
  storageMb: number;
  /** Max org seats (-1 = unlimited, 0 = no org) */
  seats: number;
}

export const PLAN_QUOTAS: Record<UserPlan, PlanQuotas> = {
  guest:      { projects: 0,  layers: 3,   features: 500,    storageMb: 5,     seats: 0  },
  free:       { projects: 3,  layers: 10,  features: 10_000, storageMb: 50,    seats: 0  },
  edu:        { projects: 10, layers: 25,  features: 50_000, storageMb: 500,   seats: 0  },
  pro:        { projects: -1, layers: -1,  features: -1,     storageMb: 5_120, seats: 1  },
  team:       { projects: -1, layers: -1,  features: -1,     storageMb: 51_200, seats: -1 },
  classroom:  { projects: -1, layers: -1,  features: -1,     storageMb: 10_240, seats: 30 },
  enterprise: { projects: -1, layers: -1,  features: -1,     storageMb: -1,    seats: -1 },
  admin:      { projects: -1, layers: -1,  features: -1,     storageMb: -1,    seats: -1 },
} as const;

export function getQuota(plan: UserPlan): PlanQuotas {
  return PLAN_QUOTAS[plan];
}

export function isUnlimited(limit: number): boolean {
  return limit < 0;
}
