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
      const match = ml.id.match(/^layer-(.+?)-(fill|line|circle|labels)$/);
      if (!match) continue;
      const id = match[1];
      if (!currentIds.has(id)) removedIds.add(id);
    }

    for (const id of removedIds) {
      for (const suffix of ["-fill", "-line", "-circle", "-labels"]) {
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
      const isGeoJson = layer.sourceType === "geojson" && layer.data;

      if (!map.getSource(sourceId)) {
        if (isGeoJson) {
          map.addSource(sourceId, {
            type: "geojson",
            data: layer.data as GeoJSON.GeoJSON,
          });
        } else {
          map.addSource(sourceId, {
            type: "vector",
            tiles: [`${MARTIN_URL}/${layer.name}/{z}/{x}/{y}.pbf`],
          });
        }
      }

      const style = (layer.style ?? {}) as Record<string, unknown>;
      const layerType = ((style.type as string) ?? "fill") as "fill";
      const layerId = `layer-${layer.id}-${layerType}`;

      if (!map.getLayer(layerId)) {
        const spec: Record<string, unknown> = {
          id: layerId,
          type: layerType,
          source: sourceId,
          paint: (style.paint as Record<string, unknown>) ?? {
            "fill-color": "#088",
            "fill-opacity": 0.6,
          },
        };
        if (!isGeoJson) {
          spec["source-layer"] = layer.name;
        }
        map.addLayer(spec as maplibregl.AddLayerObject);
      }

      const currentLayer = map.getLayer(layerId);
      if (currentLayer) {
        map.setLayoutProperty(
          layerId,
          "visibility",
          layer.isVisible ? "visible" : "none",
        );
        const opacityProp =
          layerType === "circle"
            ? "circle-opacity"
            : layerType === "line"
              ? "line-opacity"
              : "fill-opacity";
        map.setPaintProperty(layerId, opacityProp, layer.opacity / 100);
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
