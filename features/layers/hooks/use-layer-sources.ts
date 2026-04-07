"use client";

import { useEffect } from "react";
import { useMapInstance } from "@/features/map/hooks/use-map-instance";
import { useLayerStore } from "../store";

const MARTIN_URL =
  process.env.NEXT_PUBLIC_MARTIN_URL || "http://localhost:3030";

export function useLayerSources() {
  const map = useMapInstance();
  const layers = useLayerStore((s) => s.layers);
  const sourceRevision = useLayerStore((s) => s.sourceRevision);

  useEffect(() => {
    if (!map) return;

    const currentIds = new Set(layers.map((l) => l.id));
    const removedIds = new Set<string>();

    for (const ml of map.getStyle()?.layers ?? []) {
      if (!ml.id.startsWith("layer-")) continue;
      const match = ml.id.match(/^layer-(.+?)-(fill|line|labels)$/);
      if (!match) continue;
      const id = match[1];
      if (!currentIds.has(id)) removedIds.add(id);
    }

    for (const id of removedIds) {
      for (const suffix of ["-fill", "-line", "-labels"]) {
        if (map.getLayer(`layer-${id}${suffix}`)) {
          map.removeLayer(`layer-${id}${suffix}`);
        }
      }
      if (map.getSource(`layer-${id}`)) {
        map.removeSource(`layer-${id}`);
      }
    }

    for (const layer of layers) {
      const sourceId = `layer-${layer.id}`;
      const layerId = `layer-${layer.id}-fill`;

      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, {
          type: "vector",
          tiles: [`${MARTIN_URL}/${layer.name}/{z}/{x}/{y}.pbf`],
        });
      }

      if (!map.getLayer(layerId)) {
        const style = (layer.style ?? {}) as Record<string, unknown>;
        map.addLayer({
          id: layerId,
          type: ((style.type as string) ?? "fill") as "fill",
          source: sourceId,
          "source-layer": layer.name,
          paint: (style.paint as Record<string, unknown>) ?? {
            "fill-color": "#088",
            "fill-opacity": 0.6,
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
        if (currentLayer.type === "fill") {
          map.setPaintProperty(layerId, "fill-opacity", layer.opacity / 100);
        }
      }
    }
  }, [map, layers]);

  useEffect(() => {
    if (!map || sourceRevision === 0) return;
    for (const layer of layers) {
      const source = map.getSource(`layer-${layer.id}`);
      if (source && "setTiles" in source) {
        const vs = source as maplibregl.VectorTileSource;
        vs.setTiles(vs.tiles);
      }
    }
  }, [map, layers, sourceRevision]);
}
