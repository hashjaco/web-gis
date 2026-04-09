"use client";

import { Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs";
import { apiFetch } from "@/lib/api/client";
import { useUserPlan } from "@/lib/auth/use-user-plan";
import { PLAN_QUOTAS } from "@/lib/auth/quotas";
import { useProjectStore } from "@/features/projects/store";

interface UsageData {
  projects: number;
  layers: number;
  features: number;
  storageMb: number;
}

interface UsageMeterProps {
  onUpgrade?: () => void;
}

export function UsageMeter({ onUpgrade }: UsageMeterProps) {
  const { user } = useUser();
  const { plan, isGuest } = useUserPlan();
  const projectId = useProjectStore((s) => s.activeProject?.id);

  const { data: usage } = useQuery({
    queryKey: ["usage", user?.id, projectId],
    queryFn: () => {
      const params = new URLSearchParams();
      if (projectId) params.set("projectId", projectId);
      return apiFetch<UsageData>(`/api/user/usage?${params}`);
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  if (isGuest || !usage) return null;

  const quota = PLAN_QUOTAS[plan];
  const items: { label: string; current: number; limit: number }[] = [];

  if (quota.projects >= 0) {
    items.push({ label: "Projects", current: usage.projects, limit: quota.projects });
  }
  if (quota.layers >= 0 && projectId) {
    items.push({ label: "Layers", current: usage.layers, limit: quota.layers });
  }

  if (items.length === 0) return null;

  return (
    <div className="space-y-2 border-t px-3 py-3">
      {items.map((item) => {
        const pct = Math.min((item.current / item.limit) * 100, 100);
        const isNearLimit = pct >= 80;
        return (
          <div key={item.label}>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{item.label}</span>
              <span className={isNearLimit ? "font-semibold text-orange-500" : ""}>
                {item.current}/{item.limit}
              </span>
            </div>
            <div className="mt-0.5 h-1 w-full rounded-full bg-muted">
              <div
                className={`h-1 rounded-full transition-all ${
                  isNearLimit ? "bg-orange-500" : "bg-primary/60"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
      {items.some((i) => i.current / i.limit >= 0.8) && (
        <button
          type="button"
          onClick={onUpgrade}
          className="flex w-full items-center justify-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary transition-colors hover:bg-primary/20"
        >
          <Sparkles className="h-3 w-3" />
          Upgrade for more
        </button>
      )}
    </div>
  );
}
