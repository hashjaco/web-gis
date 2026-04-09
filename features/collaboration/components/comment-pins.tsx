"use client";

import { useStorage } from "@liveblocks/react/suspense";
import { ScatterplotLayer, TextLayer } from "@deck.gl/layers";
import type { Layer } from "@deck.gl/core";

interface PinData {
  position: [number, number];
  resolved: boolean;
  label: string;
}

export function useCommentPinLayers(): Layer[] {
  const comments = useStorage((root) => root.comments);

  if (!comments || comments.length === 0) return [];

  const pins: PinData[] = comments.map((c) => ({
    position: [c.lng, c.lat],
    resolved: c.resolved,
    label: c.authorName[0]?.toUpperCase() ?? "?",
  }));

  return [
    new ScatterplotLayer<PinData>({
      id: "collab-comment-pins",
      data: pins,
      getPosition: (d) => d.position,
      getFillColor: (d) =>
        d.resolved ? [100, 200, 100, 150] : [239, 68, 68, 220],
      getLineColor: [255, 255, 255, 255],
      radiusMinPixels: 8,
      radiusMaxPixels: 8,
      lineWidthMinPixels: 2,
      stroked: true,
      pickable: false,
    }),
    new TextLayer<PinData>({
      id: "collab-comment-labels",
      data: pins,
      getPosition: (d) => d.position,
      getText: (d) => d.label,
      getColor: [255, 255, 255, 255],
      getSize: 10,
      fontWeight: 700,
      fontFamily: "system-ui, sans-serif",
      pickable: false,
      billboard: true,
    }),
  ];
}
