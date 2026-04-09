"use client";

import { useFeatures } from "@/features/editing/hooks/use-features";
import { useBroadcastFeatureChange } from "./use-collaboration-sync";
import { useCollaborationActive } from "./use-collaboration-active";

export function useCollaborativeFeatures() {
  const base = useFeatures();
  const isActive = useCollaborationActive();

  if (!isActive) return base;

  const { broadcastFeatureChange } = useBroadcastFeatureChange();

  return {
    ...base,
    createFeature: async (data: Parameters<typeof base.createFeature>[0]) => {
      const result = await base.createFeature(data);
      broadcastFeatureChange("create", data.layer);
      return result;
    },
    updateFeature: async (
      id: string,
      data: Parameters<typeof base.updateFeature>[1],
    ) => {
      const result = await base.updateFeature(id, data);
      broadcastFeatureChange("update", "");
      return result;
    },
    deleteFeature: async (id: string) => {
      const result = await base.deleteFeature(id);
      broadcastFeatureChange("delete", "");
      return result;
    },
  };
}
