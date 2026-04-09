"use client";

import { useLayers } from "@/features/layers/hooks/use-layers";
import { useBroadcastFeatureChange } from "./use-collaboration-sync";
import { useCollaborationActive } from "./use-collaboration-active";
import type { LayerConfig } from "@/features/layers/types";

export function useCollaborativeLayers() {
  const base = useLayers();
  const isActive = useCollaborationActive();

  if (!isActive) return base;

  const { broadcastLayerChange } = useBroadcastFeatureChange();

  return {
    ...base,
    createLayer: async (layer: Partial<LayerConfig>) => {
      const result = await base.createLayer(layer);
      broadcastLayerChange("create");
      return result;
    },
    updateLayer: async (id: string, data: Partial<LayerConfig>) => {
      const result = await base.updateLayer(id, data);
      broadcastLayerChange("update");
      return result;
    },
    deleteLayer: async (id: string) => {
      const result = await base.deleteLayer(id);
      broadcastLayerChange("delete");
      return result;
    },
  };
}
