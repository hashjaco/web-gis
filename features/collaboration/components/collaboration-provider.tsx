"use client";

import type { ReactNode } from "react";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";
import { LiveList } from "@liveblocks/client";
import { useProjectStore } from "@/features/projects/store";
import { useUserPlan } from "@/lib/auth/use-user-plan";
import { useMapStore } from "@/features/map/store";
import { useLayerStore } from "@/features/layers/store";
import "@/lib/collaboration/liveblocks";

interface CollaborationProviderProps {
  children: ReactNode;
}

function CollaborationRoom({
  projectId,
  children,
}: {
  projectId: string;
  children: ReactNode;
}) {
  const vs = useMapStore((s) => s.viewState);
  const activeLayerId = useLayerStore((s) => s.activeLayerId);

  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider
        id={`project:${projectId}`}
        initialPresence={{
          cursor: null,
          viewport: {
            lng: vs.longitude,
            lat: vs.latitude,
            zoom: vs.zoom,
          },
          activeLayerId,
          selectedFeatureIds: [],
          color: "",
        }}
        initialStorage={{
          comments: new LiveList([]),
        }}
      >
        <ClientSideSuspense fallback={children}>{children}</ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}

export function CollaborationProvider({
  children,
}: CollaborationProviderProps) {
  const { hasCollaboration } = useUserPlan();
  const projectId = useProjectStore((s) => s.activeProject?.id);

  if (!hasCollaboration || !projectId) {
    return <>{children}</>;
  }

  return (
    <CollaborationRoom projectId={projectId}>
      {children}
    </CollaborationRoom>
  );
}
