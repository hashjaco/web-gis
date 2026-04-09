"use client";

import { useEffect, useRef } from "react";
import { useUpdateMyPresence } from "@liveblocks/react/suspense";
import { useMapStore } from "@/features/map/store";
import { useLayerStore } from "@/features/layers/store";
import { useEditingStore } from "@/features/editing/store";

const THROTTLE_MS = 200;

export function usePresenceSync() {
  const updatePresence = useUpdateMyPresence();
  const lastUpdateRef = useRef(0);

  const viewState = useMapStore((s) => s.viewState);
  const activeLayerId = useLayerStore((s) => s.activeLayerId);
  const selectedFeatures = useEditingStore((s) => s.selectedFeatures);

  useEffect(() => {
    const now = Date.now();
    if (now - lastUpdateRef.current < THROTTLE_MS) return;
    lastUpdateRef.current = now;

    updatePresence({
      viewport: {
        lng: viewState.longitude,
        lat: viewState.latitude,
        zoom: viewState.zoom,
      },
    });
  }, [viewState.longitude, viewState.latitude, viewState.zoom, updatePresence]);

  useEffect(() => {
    updatePresence({ activeLayerId });
  }, [activeLayerId, updatePresence]);

  useEffect(() => {
    updatePresence({
      selectedFeatureIds: selectedFeatures.map((f) => f.id),
    });
  }, [selectedFeatures, updatePresence]);
}

export function useCursorPresence() {
  const updatePresence = useUpdateMyPresence();
  const lastRef = useRef(0);

  const handleMouseMove = (e: { lngLat: { lng: number; lat: number } }) => {
    const now = Date.now();
    if (now - lastRef.current < THROTTLE_MS) return;
    lastRef.current = now;
    updatePresence({ cursor: { lng: e.lngLat.lng, lat: e.lngLat.lat } });
  };

  const handleMouseLeave = () => {
    updatePresence({ cursor: null });
  };

  return { handleMouseMove, handleMouseLeave };
}
