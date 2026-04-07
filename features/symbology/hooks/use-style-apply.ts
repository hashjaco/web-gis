"use client";

import { useMapInstance } from "@/features/map/hooks/use-map-instance";
import type { LabelConfig, LayerStyle } from "../types";
import { styleToLinePaint, styleToMaplibrePaint } from "../utils";

export function useStyleApply() {
  const map = useMapInstance();

  function applyStyle(layerId: string, style: LayerStyle) {
    if (!map) return;

    const fillLayerId = `layer-${layerId}-fill`;
    const lineLayerId = `layer-${layerId}-line`;

    if (map.getLayer(fillLayerId)) {
      const paint = styleToMaplibrePaint(style);
      for (const [prop, value] of Object.entries(paint)) {
        map.setPaintProperty(fillLayerId, prop, value);
      }
    }

    if (map.getLayer(lineLayerId)) {
      const paint = styleToLinePaint(style);
      for (const [prop, value] of Object.entries(paint)) {
        map.setPaintProperty(lineLayerId, prop, value);
      }
    }
  }

  function applyLabels(layerId: string, config: LabelConfig) {
    if (!map) return;

    const labelLayerId = `layer-${layerId}-labels`;

    if (config.enabled) {
      if (!map.getLayer(labelLayerId)) {
        const sourceId = `layer-${layerId}`;
        if (map.getSource(sourceId)) {
          map.addLayer({
            id: labelLayerId,
            type: "symbol",
            source: sourceId,
            "source-layer": layerId,
            layout: {
              "text-field": ["get", config.field],
              "text-size": config.fontSize,
            },
            paint: {
              "text-color": config.color,
              "text-halo-color": "#fff",
              "text-halo-width": 1,
            },
          });
        }
      } else {
        map.setLayoutProperty(labelLayerId, "text-field", [
          "get",
          config.field,
        ]);
        map.setLayoutProperty(labelLayerId, "text-size", config.fontSize);
        map.setPaintProperty(labelLayerId, "text-color", config.color);
      }
    } else if (map.getLayer(labelLayerId)) {
      map.setLayoutProperty(labelLayerId, "visibility", "none");
    }
  }

  return { applyStyle, applyLabels };
}
