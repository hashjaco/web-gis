"use client";

import { useOrganization } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { ProjectRecord } from "@/features/projects/types";

export type { ProjectRecord };

export function useProjects() {
  const { organization } = useOrganization();
  const orgId = organization?.id ?? null;

  return useQuery({
    queryKey: ["projects", orgId],
    queryFn: () => apiFetch<ProjectRecord[]>("/api/projects"),
  });
}
