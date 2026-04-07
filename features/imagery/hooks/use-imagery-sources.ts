"use client";

import { useEffect } from "react";
import { useMapInstance } from "@/features/map/hooks/use-map-instance";
import { useImageryStore } from "../store";

const TITILER_URL =
  process.env.NEXT_PUBLIC_TITILER_URL || "https://titiler.xyz";

export function useImagerySources() {
  const map = useMapInstance();
  const layers = useImageryStore((s) => s.layers);

  useEffect(() => {
    if (!map) return;

    const currentIds = new Set(layers.map((l) => l.id));

    for (const ml of map.getStyle()?.layers ?? []) {
      if (!ml.id.startsWith("imagery-")) continue;
      const id = ml.id.replace("imagery-", "");
      if (!currentIds.has(id)) {
        if (map.getLayer(ml.id)) map.removeLayer(ml.id);
        const sourceId = `imagery-src-${id}`;
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      }
    }

    for (const layer of layers) {
      const sourceId = `imagery-src-${layer.id}`;
      const layerId = `imagery-${layer.id}`;

      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, {
          type: "raster",
          tiles: [
            `${TITILER_URL}/cog/tiles/WebMercatorQuad/{z}/{x}/{y}@1x?url=${encodeURIComponent(layer.url)}`,
          ],
          tileSize: 256,
          bounds: layer.bbox,
        });
      }

      if (!map.getLayer(layerId)) {
        map.addLayer({
          id: layerId,
          type: "raster",
          source: sourceId,
          paint: {
            "raster-opacity": layer.opacity / 100,
          },
        });
      }

      const currentLayer = map.getLayer(layerId);
      if (currentLayer) {
        map.setLayoutProperty(
          layerId,
          "visibility",
          layer.isVisible ? "visible" : "none",
        );
        map.setPaintProperty(
          layerId,
          "raster-opacity",
          layer.opacity / 100,
        );
      }
    }
  }, [map, layers]);
}
