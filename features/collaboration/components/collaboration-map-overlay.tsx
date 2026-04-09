"use client";

import type { Layer } from "@deck.gl/core";
import { usePresenceSync, useCursorPresence } from "../hooks/use-presence-sync";
import { useCollaborationSync } from "../hooks/use-collaboration-sync";
import { useLiveCursorLayers } from "./live-cursors";
import { useCommentPinLayers } from "./comment-pins";

interface CollaborationMapOverlayResult {
  cursorLayers: Layer[];
  onMapMouseMove: (e: { lngLat: { lng: number; lat: number } }) => void;
  onMapMouseLeave: () => void;
}

export function useCollaborationMapOverlay(): CollaborationMapOverlayResult {
  usePresenceSync();
  useCollaborationSync();
  const { handleMouseMove, handleMouseLeave } = useCursorPresence();
  const cursorLayers = useLiveCursorLayers();
  const commentPinLayers = useCommentPinLayers();

  return {
    cursorLayers: [...cursorLayers, ...commentPinLayers],
    onMapMouseMove: handleMouseMove,
    onMapMouseLeave: handleMouseLeave,
  };
}
