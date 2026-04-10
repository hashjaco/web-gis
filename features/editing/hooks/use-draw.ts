"use client";

import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import * as turf from "@turf/turf";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useMapInstance } from "@/features/map/hooks/use-map-instance";
import { apiFetch } from "@/lib/api/client";
import { useUserPlan } from "@/lib/auth/use-user-plan";
import {
  addGuestFeature,
  updateGuestFeature,
  removeGuestFeature,
  getGuestFeatures,
  type GuestFeatureRecord,
} from "@/lib/guest/guest-db";
import { queryKeys } from "@/lib/query/keys";
import { useEditingStore } from "../store";
import { useLayerStore } from "@/features/layers/store";
import { useProjectStore } from "@/features/projects/store";
import DrawCircle from "../modes/draw-circle";
import DrawRectangle from "../modes/draw-rectangle";
import DrawFreehand from "../modes/draw-freehand";
import DrawMarker from "../modes/draw-marker";

// ---------------------------------------------------------------------------
// Style expressions
// ---------------------------------------------------------------------------

const STROKE_COLOR_EXPR = [
  "coalesce",
  ["get", "user_stroke_color"],
  ["get", "user_layer_color"],
  "#3bb2d0",
];

const FILL_COLOR_EXPR = [
  "coalesce",
  ["get", "user_fill_color"],
  ["get", "user_layer_color"],
  "#3bb2d0",
];

const STROKE_WIDTH_EXPR = [
  "coalesce",
  ["get", "user_stroke_width"],
  2,
];

const FILL_OPACITY_EXPR = [
  "coalesce",
  ["get", "user_fill_opacity"],
  0.3,
];

const MAPLIBRE_DRAW_STYLES: Record<string, unknown>[] = [
  {
    id: "gl-draw-polygon-fill-inactive",
    type: "fill",
    filter: [
      "all",
      ["==", "active", "false"],
      ["==", "$type", "Polygon"],
      ["!=", "mode", "static"],
    ],
    paint: {
      "fill-color": FILL_COLOR_EXPR,
      "fill-outline-color": STROKE_COLOR_EXPR,
      "fill-opacity": FILL_OPACITY_EXPR,
    },
  },
  {
    id: "gl-draw-polygon-fill-active",
    type: "fill",
    filter: ["all", ["==", "active", "true"], ["==", "$type", "Polygon"]],
    paint: {
      "fill-color": "#fbb03b",
      "fill-outline-color": "#fbb03b",
      "fill-opacity": 0.1,
    },
  },
  {
    id: "gl-draw-polygon-stroke-inactive",
    type: "line",
    filter: [
      "all",
      ["==", "active", "false"],
      ["==", "$type", "Polygon"],
      ["!=", "mode", "static"],
    ],
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": STROKE_COLOR_EXPR, "line-width": STROKE_WIDTH_EXPR },
  },
  {
    id: "gl-draw-polygon-stroke-active",
    type: "line",
    filter: ["all", ["==", "active", "true"], ["==", "$type", "Polygon"]],
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": "#fbb03b",
      "line-dasharray": [0.2, 2],
      "line-width": 2,
    },
  },
  {
    id: "gl-draw-line-inactive",
    type: "line",
    filter: [
      "all",
      ["==", "active", "false"],
      ["==", "$type", "LineString"],
      ["!=", "mode", "static"],
    ],
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": STROKE_COLOR_EXPR, "line-width": STROKE_WIDTH_EXPR },
  },
  {
    id: "gl-draw-line-active",
    type: "line",
    filter: ["all", ["==", "$type", "LineString"], ["==", "active", "true"]],
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": "#fbb03b",
      "line-dasharray": [0.2, 2],
      "line-width": 2,
    },
  },
  {
    id: "gl-draw-polygon-and-line-vertex-stroke-inactive",
    type: "circle",
    filter: [
      "all",
      ["==", "meta", "vertex"],
      ["==", "$type", "Point"],
      ["!=", "mode", "static"],
    ],
    paint: { "circle-radius": 5, "circle-color": "#fff" },
  },
  {
    id: "gl-draw-polygon-and-line-vertex-inactive",
    type: "circle",
    filter: [
      "all",
      ["==", "meta", "vertex"],
      ["==", "$type", "Point"],
      ["!=", "mode", "static"],
    ],
    paint: { "circle-radius": 3, "circle-color": "#fbb03b" },
  },
  {
    id: "gl-draw-point-inactive",
    type: "circle",
    filter: [
      "all",
      ["==", "active", "false"],
      ["==", "$type", "Point"],
      ["==", "meta", "feature"],
      ["!=", "mode", "static"],
      ["!has", "user_image_url"],
      ["!has", "user_label"],
      ["!has", "user__isMarker"],
    ],
    paint: { "circle-radius": 5, "circle-color": FILL_COLOR_EXPR },
  },
  {
    id: "gl-draw-point-active",
    type: "circle",
    filter: [
      "all",
      ["==", "$type", "Point"],
      ["!=", "meta", "midpoint"],
      ["==", "active", "true"],
      ["!has", "user_image_url"],
      ["!has", "user_label"],
      ["!has", "user__isMarker"],
    ],
    paint: { "circle-radius": 7, "circle-color": "#fbb03b" },
  },
  {
    id: "gl-draw-polygon-midpoint",
    type: "circle",
    filter: ["all", ["==", "$type", "Point"], ["==", "meta", "midpoint"]],
    paint: { "circle-radius": 3, "circle-color": "#fbb03b" },
  },
  {
    id: "gl-draw-label-inactive",
    type: "symbol",
    filter: [
      "all",
      ["==", "active", "false"],
      ["==", "$type", "Point"],
      ["==", "meta", "feature"],
      ["has", "user_label"],
    ],
    layout: {
      "text-field": ["get", "user_label"],
      "text-font": ["Open Sans Semibold"],
      "text-size": 14,
      "text-anchor": "center",
    },
    paint: {
      "text-color": STROKE_COLOR_EXPR,
      "text-halo-color": "#fff",
      "text-halo-width": 1.5,
    },
  },
  {
    id: "gl-draw-label-active",
    type: "symbol",
    filter: [
      "all",
      ["==", "active", "true"],
      ["==", "$type", "Point"],
      ["!=", "meta", "midpoint"],
      ["has", "user_label"],
    ],
    layout: {
      "text-field": ["get", "user_label"],
      "text-font": ["Open Sans Semibold"],
      "text-size": 14,
      "text-anchor": "center",
    },
    paint: {
      "text-color": "#fbb03b",
      "text-halo-color": "#fff",
      "text-halo-width": 1.5,
    },
  },
  {
    id: "gl-draw-marker-border-inactive",
    type: "circle",
    filter: [
      "all",
      ["==", "active", "false"],
      ["==", "$type", "Point"],
      ["==", "meta", "feature"],
      ["has", "user__isMarker"],
    ],
    paint: { "circle-radius": 10, "circle-color": "#fff" },
  },
  {
    id: "gl-draw-marker-inactive",
    type: "circle",
    filter: [
      "all",
      ["==", "active", "false"],
      ["==", "$type", "Point"],
      ["==", "meta", "feature"],
      ["has", "user__isMarker"],
    ],
    paint: { "circle-radius": 7, "circle-color": FILL_COLOR_EXPR },
  },
  {
    id: "gl-draw-marker-border-active",
    type: "circle",
    filter: [
      "all",
      ["==", "active", "true"],
      ["==", "$type", "Point"],
      ["!=", "meta", "midpoint"],
      ["has", "user__isMarker"],
    ],
    paint: { "circle-radius": 12, "circle-color": "#fff" },
  },
  {
    id: "gl-draw-marker-active",
    type: "circle",
    filter: [
      "all",
      ["==", "active", "true"],
      ["==", "$type", "Point"],
      ["!=", "meta", "midpoint"],
      ["has", "user__isMarker"],
    ],
    paint: { "circle-radius": 9, "circle-color": "#fbb03b" },
  },
  {
    id: "gl-draw-image-inactive",
    type: "circle",
    filter: [
      "all",
      ["==", "active", "false"],
      ["==", "$type", "Point"],
      ["==", "meta", "feature"],
      ["has", "user_image_url"],
    ],
    paint: {
      "circle-radius": 8,
      "circle-color": "#9333ea",
      "circle-stroke-width": 2,
      "circle-stroke-color": "#fff",
    },
  },
  {
    id: "gl-draw-image-active",
    type: "circle",
    filter: [
      "all",
      ["==", "active", "true"],
      ["==", "$type", "Point"],
      ["!=", "meta", "midpoint"],
      ["has", "user_image_url"],
    ],
    paint: {
      "circle-radius": 10,
      "circle-color": "#fbb03b",
      "circle-stroke-width": 2,
      "circle-stroke-color": "#fff",
    },
  },
];

// ---------------------------------------------------------------------------
// Snapping helpers
// ---------------------------------------------------------------------------

function collectVertices(
  features: GeoJSON.Feature[],
  excludeId?: string | number,
): GeoJSON.Position[] {
  const vertices: GeoJSON.Position[] = [];
  for (const f of features) {
    if (f.id != null && String(f.id) === String(excludeId)) continue;
    vertices.push(...turf.coordAll(f));
  }
  return vertices;
}

function snapCoord(
  coord: GeoJSON.Position,
  snapPoints: GeoJSON.FeatureCollection<GeoJSON.Point>,
  map: maplibregl.Map,
  tolerancePx: number,
): GeoJSON.Position {
  const nearest = turf.nearestPoint(turf.point(coord), snapPoints);
  const screenA = map.project(coord as [number, number]);
  const screenB = map.project(
    nearest.geometry.coordinates as [number, number],
  );
  const dx = screenA.x - screenB.x;
  const dy = screenA.y - screenB.y;
  if (Math.sqrt(dx * dx + dy * dy) <= tolerancePx) {
    return [...nearest.geometry.coordinates];
  }
  return coord;
}

function snapGeometry(
  geometry: GeoJSON.Geometry,
  allFeatures: GeoJSON.Feature[],
  featureId: string | number | undefined,
  map: maplibregl.Map,
  tolerancePx: number,
): GeoJSON.Geometry {
  const vertices = collectVertices(allFeatures, featureId);
  if (vertices.length === 0) return geometry;

  const snapPoints = turf.featureCollection(vertices.map((c) => turf.point(c)));

  const mapCoords = (ring: GeoJSON.Position[]): GeoJSON.Position[] =>
    ring.map((c) => snapCoord(c, snapPoints, map, tolerancePx));

  const cloned: GeoJSON.Geometry = JSON.parse(JSON.stringify(geometry));

  switch (cloned.type) {
    case "Point":
      cloned.coordinates = snapCoord(cloned.coordinates, snapPoints, map, tolerancePx);
      break;
    case "MultiPoint":
      cloned.coordinates = mapCoords(cloned.coordinates);
      break;
    case "LineString":
      cloned.coordinates = mapCoords(cloned.coordinates);
      break;
    case "MultiLineString":
      cloned.coordinates = cloned.coordinates.map(mapCoords);
      break;
    case "Polygon":
      cloned.coordinates = cloned.coordinates.map(mapCoords);
      break;
    case "MultiPolygon":
      cloned.coordinates = cloned.coordinates.map((poly) => poly.map(mapCoords));
      break;
  }

  return cloned;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function featureId(f: GeoJSON.Feature): string {
  return String(
    f.id ?? (f.properties as Record<string, unknown>)?._id ?? "",
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useDraw(
  selectedLayers: string[],
  layerColors: Record<string, string> = {},
) {
  const map = useMapInstance();
  const drawRef = useRef<MapboxDraw | null>(null);
  const drawMode = useEditingStore((s) => s.drawMode);
  const selectedLayersRef = useRef(selectedLayers);
  selectedLayersRef.current = selectedLayers;
  const layerColorsRef = useRef(layerColors);
  layerColorsRef.current = layerColors;
  const queryClient = useQueryClient();
  const projectId = useProjectStore((s) => s.activeProject?.id);
  const projectIdRef = useRef(projectId);
  projectIdRef.current = projectId;
  const { isGuest } = useUserPlan();
  const useLocal = isGuest || !projectId;
  const useLocalRef = useRef(useLocal);
  useLocalRef.current = useLocal;

  // -----------------------------------------------------------------------
  // Feature queries — one per selected layer
  // -----------------------------------------------------------------------

  const layerQueries = useQueries({
    queries: selectedLayers.map((layerId) => {
      if (useLocal) {
        return {
          queryKey: ["guest-features", layerId],
          queryFn: async (): Promise<GeoJSON.FeatureCollection> => {
            const records = await getGuestFeatures(layerId);
            return {
              type: "FeatureCollection",
              features: records.map((r) => ({
                type: "Feature" as const,
                id: r.id,
                geometry: r.geometry,
                properties: { ...r.properties, _id: r.id, _layer: r.layer },
              })),
            };
          },
          enabled: selectedLayers.length > 0,
        };
      }
      const qp = new URLSearchParams({ layer: layerId });
      if (projectId) qp.set("projectId", projectId);
      return {
        queryKey: queryKeys.features.list({ projectId, layer: layerId }),
        queryFn: () =>
          apiFetch<GeoJSON.FeatureCollection>(`/api/features?${qp}`),
        enabled: selectedLayers.length > 0 && !!projectId,
      };
    }),
  });

  // -----------------------------------------------------------------------
  // Init effect — create MapboxDraw, wire event handlers
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (!map || drawRef.current) return;

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {},
      userProperties: true,
      styles: MAPLIBRE_DRAW_STYLES,
      modes: {
        ...MapboxDraw.modes,
        draw_circle: DrawCircle,
        draw_rectangle: DrawRectangle,
        draw_freehand: DrawFreehand,
        draw_marker: DrawMarker,
      },
    });

    map.addControl(draw as unknown as maplibregl.IControl);
    drawRef.current = draw;

    const invalidateAll = () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.features.all });
      queryClient.invalidateQueries({ queryKey: ["guest-features"] });
    };

    // -- onCreate: optimistic cache + persist + repeating mode re-entry ----

    const onCreate = (e: { features: GeoJSON.Feature[] }) => {
      const { snapping, drawStyle } = useEditingStore.getState();
      const targetLayer =
        useLayerStore.getState().activeLayerId ??
        selectedLayersRef.current[selectedLayersRef.current.length - 1] ??
        "default";
      const color = layerColorsRef.current[targetLayer] ?? "#3bb2d0";

      for (const feature of e.features) {
        let sample: unknown = (feature.geometry as any)?.coordinates;
        if (!Array.isArray(sample) || sample.length === 0) continue;
        while (Array.isArray((sample as unknown[])[0]))
          sample = (sample as unknown[])[0];
        if (typeof (sample as unknown[])[0] !== "number") continue;

        if (snapping.enabled && map) {
          const allFeatures = (draw as any).getAll().features as GeoJSON.Feature[];
          feature.geometry = snapGeometry(
            feature.geometry, allFeatures, feature.id, map, snapping.tolerance,
          );
        }

        const props: Record<string, unknown> = {
          ...(feature.properties ?? {}),
          layer_color: color,
          stroke_color: drawStyle.strokeColor,
          stroke_width: drawStyle.strokeWidth,
          fill_color: drawStyle.fillColor,
          fill_opacity: drawStyle.fillOpacity / 100,
        };
        feature.properties = props;

        // Update the feature in Draw so styles apply immediately
        const drawId = String(feature.id ?? "");
        if (drawId) {
          setTimeout(() => {
            const d = drawRef.current as any;
            if (!d) return;
            const f = d.get(drawId);
            if (f) {
              f.properties = { ...f.properties, ...props };
              if (snapping.enabled) f.geometry = feature.geometry;
              d.add(f);
            }
          }, 0);
        }

        // Build the optimistic feature with a stable UUID
        const tempId = crypto.randomUUID();
        const optimistic: GeoJSON.Feature = {
          type: "Feature",
          id: tempId,
          geometry: feature.geometry,
          properties: { ...props, _id: tempId, _layer: targetLayer },
        };

        // Insert into the React Query cache immediately
        const cacheKey = useLocalRef.current
          ? ["guest-features", targetLayer]
          : queryKeys.features.list({
              projectId: projectIdRef.current,
              layer: targetLayer,
            });

        queryClient.setQueryData<GeoJSON.FeatureCollection>(cacheKey, (old) => ({
          type: "FeatureCollection",
          features: [...(old?.features ?? []), optimistic],
        }));

        // Persist in the background
        if (useLocalRef.current) {
          const now = new Date().toISOString();
          const record: GuestFeatureRecord = {
            id: tempId,
            geometry: feature.geometry,
            properties: props,
            layer: targetLayer,
            createdAt: now,
            updatedAt: now,
          };
          addGuestFeature(record)
            .then(() => {
              useLayerStore.getState().bumpSourceRevision();
              invalidateAll();
            })
            .catch(() => invalidateAll());
        } else {
          apiFetch<{ id: string }>("/api/features", {
            method: "POST",
            body: {
              geometry: feature.geometry,
              properties: props,
              layer: targetLayer,
              projectId: projectIdRef.current,
            },
          })
            .then(() => invalidateAll())
            .catch(() => invalidateAll());
        }
      }

      // For built-in repeating modes, re-enter the same mode after Draw
      // finishes its transition to simple_select.
      const currentMode = useEditingStore.getState().drawMode;
      if (
        currentMode === "draw_point" ||
        currentMode === "draw_line_string" ||
        currentMode === "draw_polygon"
      ) {
        setTimeout(() => {
          if (drawRef.current) {
            (drawRef.current as any).changeMode(currentMode);
          }
        }, 50);
      }
    };

    // -- onUpdate: persist geometry changes directly --------------------

    const onUpdate = (e: { features: GeoJSON.Feature[] }) => {
      const { snapping } = useEditingStore.getState();
      for (const feature of e.features) {
        if (snapping.enabled && map) {
          const allFeatures = (draw as any).getAll().features as GeoJSON.Feature[];
          feature.geometry = snapGeometry(
            feature.geometry, allFeatures, feature.id, map, snapping.tolerance,
          );
          setTimeout(() => {
            const d = drawRef.current as any;
            if (!d || !feature.id) return;
            const f = d.get(String(feature.id));
            if (f) {
              f.geometry = feature.geometry;
              d.add(f);
            }
          }, 0);
        }

        const id = feature.id ? String(feature.id) : null;
        if (!id || !UUID_RE.test(id)) continue;

        if (useLocalRef.current) {
          updateGuestFeature(id, { geometry: feature.geometry })
            .then(() => {
              useLayerStore.getState().bumpSourceRevision();
              invalidateAll();
            })
            .catch(() => {});
        } else {
          apiFetch(`/api/features/${id}`, {
            method: "PUT",
            body: { geometry: feature.geometry },
          })
            .then(() => invalidateAll())
            .catch(() => {});
        }
      }
    };

    // -- onDelete: persist deletions directly ---------------------------

    const onDelete = (e: { features: GeoJSON.Feature[] }) => {
      for (const feature of e.features) {
        const id = feature.id ? String(feature.id) : null;
        if (!id || !UUID_RE.test(id)) continue;

        if (useLocalRef.current) {
          removeGuestFeature(id)
            .then(() => {
              useLayerStore.getState().bumpSourceRevision();
              invalidateAll();
            })
            .catch(() => {});
        } else {
          apiFetch(`/api/features/${id}`, { method: "DELETE" })
            .then(() => invalidateAll())
            .catch(() => {});
        }
      }
    };

    map.on("draw.create", onCreate);
    map.on("draw.update", onUpdate);
    map.on("draw.delete", onDelete);

    return () => {
      if (map.getCanvas()) {
        map.off("draw.create", onCreate);
        map.off("draw.update", onUpdate);
        map.off("draw.delete", onDelete);
      }
      if (drawRef.current) {
        try {
          map.removeControl(drawRef.current as unknown as maplibregl.IControl);
        } catch {
          /* map may already be destroyed */
        }
        drawRef.current = null;
      }
    };
  }, [map, queryClient]);

  // -----------------------------------------------------------------------
  // Non-destructive reconciliation sync
  // -----------------------------------------------------------------------

  const allReady = layerQueries.every((q) => q.isSuccess);
  const queriesDataRaw = layerQueries.map((q) => q.data);

  const queriesDataRef = useRef(queriesDataRaw);
  if (
    queriesDataRaw.length !== queriesDataRef.current.length ||
    queriesDataRaw.some((d, i) => d !== queriesDataRef.current[i])
  ) {
    queriesDataRef.current = queriesDataRaw;
  }
  const queriesData = queriesDataRef.current;

  useEffect(() => {
    const draw = drawRef.current;
    if (!draw || !allReady) return;

    // Build target feature set from query data
    const targetFeatures = new Map<string, GeoJSON.Feature>();
    for (let i = 0; i < selectedLayers.length; i++) {
      const fc = queriesData[i];
      if (!fc) continue;
      const color = layerColors[selectedLayers[i]] ?? "#3bb2d0";
      for (const f of fc.features) {
        const id = featureId(f);
        if (!id) continue;
        targetFeatures.set(id, {
          ...f,
          properties: { ...(f.properties ?? {}), layer_color: color },
        });
      }
    }

    // Get current Draw state
    const drawFeatures = (draw as any).getAll().features as GeoJSON.Feature[];
    const drawIds = new Set<string>();
    for (const f of drawFeatures) {
      const id = featureId(f);
      if (id) drawIds.add(id);
    }

    const targetIds = new Set(targetFeatures.keys());

    // Remove features no longer in target (layer removed, feature deleted)
    for (const id of drawIds) {
      if (!targetIds.has(id)) {
        try { (draw as any).delete(id); } catch {}
      }
    }

    // Add new features from target; update existing ones
    for (const [id, feature] of targetFeatures) {
      if (drawIds.has(id)) {
        const existing = (draw as any).get(id);
        if (existing) {
          existing.properties = {
            ...existing.properties,
            ...(feature.properties ?? {}),
          };
          (draw as any).add(existing);
        }
      } else {
        (draw as any).add(feature);
      }
    }
  }, [queriesData, allReady, selectedLayers, layerColors]);

  // -----------------------------------------------------------------------
  // Single drawMode driver
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (!drawRef.current) return;
    const target = drawMode ?? "simple_select";
    (drawRef.current as any).changeMode(target);
  }, [drawMode]);
}
