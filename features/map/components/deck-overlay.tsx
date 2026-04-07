"use client";

import type { Layer } from "@deck.gl/core";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { useEffect, useRef } from "react";
import { useControl } from "react-map-gl/maplibre";

interface DeckOverlayProps {
  layers: Layer[];
}

export function DeckOverlay({ layers }: DeckOverlayProps) {
  const overlayRef = useRef<MapboxOverlay | null>(null);

  const overlay = useControl<MapboxOverlay>(() => {
    const instance = new MapboxOverlay({ layers, interleaved: true });
    overlayRef.current = instance;
    return instance;
  });

  useEffect(() => {
    overlay.setProps({ layers });
  }, [overlay, layers]);

  return null;
}
