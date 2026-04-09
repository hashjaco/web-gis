"use client";

import { useEffect, useRef, useState } from "react";
import { useOthers } from "@liveblocks/react/suspense";
import { useMapStore } from "@/features/map/store";

export function useFollowMode() {
  const [followingConnectionId, setFollowingConnectionId] = useState<
    number | null
  >(null);
  const others = useOthers();
  const isFollowUpdateRef = useRef(false);
  const requestFlyTo = useMapStore((s) => s.requestFlyTo);

  useEffect(() => {
    if (followingConnectionId === null) return;

    const target = others.find(
      (u) => u.connectionId === followingConnectionId,
    );
    if (!target) {
      setFollowingConnectionId(null);
      return;
    }

    const vp = target.presence.viewport;
    if (!vp) return;

    isFollowUpdateRef.current = true;
    requestFlyTo(vp.lng, vp.lat, vp.zoom);
  }, [followingConnectionId, others, requestFlyTo]);

  useEffect(() => {
    if (followingConnectionId === null) return;

    const unsub = useMapStore.subscribe((state, prev) => {
      if (
        state.viewState.longitude !== prev.viewState.longitude ||
        state.viewState.latitude !== prev.viewState.latitude ||
        state.viewState.zoom !== prev.viewState.zoom
      ) {
        if (isFollowUpdateRef.current) {
          isFollowUpdateRef.current = false;
          return;
        }
        setFollowingConnectionId(null);
      }
    });

    return unsub;
  }, [followingConnectionId]);

  return { followingConnectionId, setFollowingConnectionId };
}
