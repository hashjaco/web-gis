"use client";

import { useUserPlan } from "@/lib/auth/use-user-plan";
import { useProjectStore } from "@/features/projects/store";

export function useCollaborationActive(): boolean {
  const { hasCollaboration } = useUserPlan();
  const projectId = useProjectStore((s) => s.activeProject?.id);
  return hasCollaboration && !!projectId;
}
