"use client";

import { useQuery } from "@tanstack/react-query";
import type { Layer } from "@deck.gl/core";
import { HeatmapLayer, HexagonLayer } from "@deck.gl/aggregation-layers";
import { ArcLayer, ScatterplotLayer } from "@deck.gl/layers";
import { apiFetch } from "@/lib/api/client";
import { useLayerStore } from "@/features/layers/store";
import { useProjectStore } from "@/features/projects/store";
import { useVisualizationStore } from "../store";
import type { FeatureCollection, Point } from "geojson";

function getPointCoordinates(
  features: GeoJSON.Feature[],
): [number, number][] {
  return features
    .filter((f) => f.geometry.type === "Point")
    .map((f) => (f.geometry as Point).coordinates as [number, number]);
}

export function useDeckLayers(): Layer[] {
  const vizType = useVisualizationStore((s) => s.vizType);
  const vizLayerId = useVisualizationStore((s) => s.vizLayerId);
  const layers = useLayerStore((s) => s.layers);
  const targetLayer = layers.find((l) => l.id === vizLayerId);
  const projectId = useProjectStore((s) => s.activeProject?.id);

  const { data: featureCollection } = useQuery({
    queryKey: ["features", "deck-viz", targetLayer?.id, projectId],
    queryFn: () => {
      const qp = new URLSearchParams();
      if (targetLayer?.id) qp.set("layer", targetLayer.id);
      if (projectId) qp.set("projectId", projectId);
      return apiFetch<FeatureCollection>(`/api/features?${qp}`);
    },
    enabled: vizType !== "none" && !!targetLayer && !!projectId,
  });

  if (vizType === "none" || !featureCollection) return [];

  const features = featureCollection.features;
  const points = getPointCoordinates(features);

  switch (vizType) {
    case "heatmap":
      return [
        new HeatmapLayer({
          id: "deck-heatmap",
          data: points,
          getPosition: (d: [number, number]) => d,
          getWeight: 1,
          radiusPixels: 40,
          intensity: 1,
          threshold: 0.05,
        }),
      ];

    case "hexbin":
      return [
        new HexagonLayer({
          id: "deck-hexbin",
          data: points,
          getPosition: (d: [number, number]) => d,
          radius: 200,
          elevationScale: 4,
          extruded: true,
          pickable: true,
        }),
      ];

    case "arc": {
      if (points.length < 2) return [];
      const arcData = points.slice(1).map((p, i) => ({
        source: points[i],
        target: p,
      }));
      return [
        new ArcLayer({
          id: "deck-arc",
          data: arcData,
          getSourcePosition: (d: { source: [number, number] }) => d.source,
          getTargetPosition: (d: { target: [number, number] }) => d.target,
          getSourceColor: [0, 128, 200],
          getTargetColor: [200, 0, 80],
          getWidth: 2,
        }),
      ];
    }

    case "scatterplot":
      return [
        new ScatterplotLayer({
          id: "deck-scatterplot",
          data: features.filter((f) => f.geometry.type === "Point"),
          getPosition: (d: GeoJSON.Feature) =>
            (d.geometry as Point).coordinates as [number, number],
          getRadius: 50,
          getFillColor: [0, 128, 200, 180],
          radiusMinPixels: 3,
          radiusMaxPixels: 30,
          pickable: true,
        }),
      ];

    default:
      return [];
  }
}
