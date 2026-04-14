"use client";

import { useOrganization, useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { ProjectRecord } from "@/features/projects/types";

export type { ProjectRecord };

export function useProjects() {
  const { user } = useUser();
  const orgResult = useOrganization();
  const orgId = user ? (orgResult.organization?.id ?? null) : null;

  return useQuery({
    queryKey: ["projects", orgId],
    queryFn: () => apiFetch<ProjectRecord[]>("/api/projects"),
    enabled: !!user,
  });
}
