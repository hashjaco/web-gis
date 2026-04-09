"use client";

import { useEffect } from "react";
import {
  useBroadcastEvent,
  useEventListener,
} from "@liveblocks/react/suspense";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { useLayerStore } from "@/features/layers/store";
import type { RoomEvent } from "@/lib/collaboration/liveblocks";

export function useCollaborationSync() {
  const broadcast = useBroadcastEvent();
  const queryClient = useQueryClient();

  useEventListener(({ event, connectionId }) => {
    const ev = event as RoomEvent;
    switch (ev.type) {
      case "feature-changed":
        queryClient.invalidateQueries({ queryKey: queryKeys.features.all });
        useLayerStore.getState().bumpSourceRevision();
        break;
      case "layer-changed":
        queryClient.invalidateQueries({ queryKey: queryKeys.layers.all });
        break;
    }
  });

  return { broadcast };
}

export function useBroadcastFeatureChange() {
  const { broadcast } = useCollaborationSync();

  return {
    broadcastFeatureChange: (
      action: "create" | "update" | "delete",
      layerId: string,
    ) => {
      broadcast({ type: "feature-changed", action, layerId });
    },
    broadcastLayerChange: (
      action: "create" | "update" | "delete" | "reorder",
    ) => {
      broadcast({ type: "layer-changed", action });
    },
  };
}
