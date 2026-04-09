"use client";

import { useOthers } from "@liveblocks/react/suspense";
import { ScatterplotLayer, TextLayer } from "@deck.gl/layers";
import type { Layer } from "@deck.gl/core";

interface CursorData {
  position: [number, number];
  color: [number, number, number];
  name: string;
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [100, 100, 255];
  return [
    Number.parseInt(result[1], 16),
    Number.parseInt(result[2], 16),
    Number.parseInt(result[3], 16),
  ];
}

export function useLiveCursorLayers(): Layer[] {
  const others = useOthers();

  const cursors: CursorData[] = others
    .filter((u) => u.presence.cursor !== null)
    .map((u) => ({
      position: [u.presence.cursor!.lng, u.presence.cursor!.lat],
      color: hexToRgb(u.info?.color ?? "#64B5F6"),
      name: u.info?.name ?? "Anonymous",
    }));

  if (cursors.length === 0) return [];

  return [
    new ScatterplotLayer<CursorData>({
      id: "collab-cursors-dot",
      data: cursors,
      getPosition: (d) => d.position,
      getFillColor: (d) => [...d.color, 200],
      getLineColor: [255, 255, 255, 255],
      radiusMinPixels: 6,
      radiusMaxPixels: 6,
      lineWidthMinPixels: 2,
      stroked: true,
      pickable: false,
    }),
    new TextLayer<CursorData>({
      id: "collab-cursors-label",
      data: cursors,
      getPosition: (d) => d.position,
      getText: (d) => d.name,
      getColor: (d) => [...d.color, 230],
      getSize: 12,
      getPixelOffset: [12, -12],
      fontFamily: "system-ui, sans-serif",
      fontWeight: 600,
      outlineWidth: 2,
      outlineColor: [255, 255, 255, 200],
      pickable: false,
      billboard: true,
    }),
  ];
}
