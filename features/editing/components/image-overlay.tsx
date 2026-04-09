"use client";

import { useEffect, useRef } from "react";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import maplibregl from "maplibre-gl";
import { useMapInstance } from "@/features/map/hooks/use-map-instance";
import { apiFetch } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";
import { useProjectStore } from "@/features/projects/store";
import { useEditingStore } from "../store";
import { useUserPlan } from "@/lib/auth/use-user-plan";
import { getGuestFeatures, updateGuestFeature } from "@/lib/guest/guest-db";
import { useLayerStore } from "@/features/layers/store";

interface ImageFeature {
  id: string;
  lng: number;
  lat: number;
  url: string;
  width: number;
  height: number;
  layer: string;
  properties: Record<string, unknown>;
}

function extractImageFeatures(
  fc: GeoJSON.FeatureCollection | undefined,
): ImageFeature[] {
  if (!fc) return [];
  const result: ImageFeature[] = [];
  for (const f of fc.features) {
    const props = f.properties;
    if (!props?.image_url && !props?._image_url) continue;
    const geom = f.geometry;
    if (geom.type !== "Point") continue;

    const url = (props.image_url ?? props._image_url) as string;
    const userProps = Object.fromEntries(
      Object.entries(props).filter(([k]) => !k.startsWith("_")),
    );

    result.push({
      id: String(f.id ?? props._id ?? props.id ?? ""),
      lng: geom.coordinates[0],
      lat: geom.coordinates[1],
      url,
      width: Number(props.image_width ?? props._image_width ?? 200),
      height: Number(props.image_height ?? props._image_height ?? 150),
      layer: String(props._layer ?? "default"),
      properties: userProps,
    });
  }
  return result;
}

interface ImageOverlayProps {
  layers: string[];
}

export function ImageOverlay({ layers }: ImageOverlayProps) {
  const map = useMapInstance();
  const markersRef = useRef(new Map<string, maplibregl.Marker>());
  const featuresRef = useRef(new Map<string, ImageFeature>());
  const queryClient = useQueryClient();
  const selectedFeatures = useEditingStore((s) => s.selectedFeatures);
  const projectId = useProjectStore((s) => s.activeProject?.id);
  const { isGuest } = useUserPlan();
  const useLocal = isGuest || !projectId;

  const layerQueries = useQueries({
    queries: layers.map((layerId) => {
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
          enabled: layers.length > 0,
        };
      }
      const qp = new URLSearchParams({ layer: layerId });
      if (projectId) qp.set("projectId", projectId);
      return {
        queryKey: queryKeys.features.list({ projectId, layer: layerId }),
        queryFn: () =>
          apiFetch<GeoJSON.FeatureCollection>(`/api/features?${qp}`),
        enabled: layers.length > 0 && !!projectId,
      };
    }),
  });

  const imageFeatures = layerQueries.flatMap((q) =>
    extractImageFeatures(q.data),
  );

  const selectedImageId =
    selectedFeatures[0]?.properties?.image_url
      ? selectedFeatures[0].id
      : null;

  useEffect(() => {
    if (!map) return;

    const currentIds = new Set(imageFeatures.map((f) => f.id));

    for (const [id, marker] of markersRef.current) {
      if (!currentIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
        featuresRef.current.delete(id);
      }
    }

    for (const feat of imageFeatures) {
      featuresRef.current.set(feat.id, feat);
      const existing = markersRef.current.get(feat.id);

      if (existing) {
        existing.setLngLat([feat.lng, feat.lat]);
        const el = existing.getElement();
        const img = el.querySelector("img");
        if (img) {
          img.src = feat.url;
          img.style.width = `${feat.width}px`;
          img.style.height = `${feat.height}px`;
        }
        continue;
      }

      const el = document.createElement("div");
      el.className = "image-overlay-marker";
      el.dataset.featureId = feat.id;

      const img = document.createElement("img");
      img.src = feat.url;
      img.style.width = `${feat.width}px`;
      img.style.height = `${feat.height}px`;
      img.style.objectFit = "contain";
      img.style.display = "block";
      img.draggable = false;
      el.appendChild(img);

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        const current = featuresRef.current.get(feat.id);
        if (!current) return;
        useEditingStore.getState().setSelectedFeatures([
          {
            id: current.id,
            geometry: {
              type: "Point",
              coordinates: [current.lng, current.lat],
            },
            properties: { ...current.properties },
            layer: current.layer,
            createdAt: "",
            updatedAt: "",
          },
        ]);
      });

      const marker = new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat([feat.lng, feat.lat])
        .addTo(map);

      markersRef.current.set(feat.id, marker);
    }
  }, [map, imageFeatures]);

  useEffect(() => {
    if (!map) return;

    for (const [id, marker] of markersRef.current) {
      const el = marker.getElement();
      const isSelected = id === selectedImageId;

      if (isSelected) {
        el.classList.add("selected");
        if (!el.querySelector(".resize-handle")) {
          const feat = featuresRef.current.get(id);
          if (feat) {
            attachResizeHandles(el, feat, map, queryClient, useLocal);
          }
        }
      } else {
        el.classList.remove("selected");
        removeResizeHandles(el);
      }
    }
  }, [map, selectedImageId, queryClient]);

  useEffect(() => {
    return () => {
      for (const marker of markersRef.current.values()) {
        marker.remove();
      }
      markersRef.current.clear();
      featuresRef.current.clear();
    };
  }, []);

  return null;
}

const CORNERS = ["nw", "ne", "sw", "se"] as const;
type Corner = (typeof CORNERS)[number];

const CORNER_CURSORS: Record<Corner, string> = {
  nw: "nwse-resize",
  ne: "nesw-resize",
  sw: "nesw-resize",
  se: "nwse-resize",
};

function attachResizeHandles(
  el: HTMLElement,
  feat: ImageFeature,
  map: maplibregl.Map,
  queryClient: ReturnType<typeof import("@tanstack/react-query").useQueryClient>,
  isLocal: boolean,
) {
  for (const corner of CORNERS) {
    const handle = document.createElement("div");
    handle.className = `resize-handle resize-handle-${corner}`;
    handle.style.cursor = CORNER_CURSORS[corner];

    let startX = 0;
    let startY = 0;
    let startW = 0;
    let startH = 0;
    let aspectRatio = 1;

    const onMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      let delta: number;
      switch (corner) {
        case "se":
          delta = Math.max(dx, dy);
          break;
        case "sw":
          delta = Math.max(-dx, dy);
          break;
        case "ne":
          delta = Math.max(dx, -dy);
          break;
        case "nw":
          delta = Math.max(-dx, -dy);
          break;
      }

      const newW = Math.max(40, startW + delta);
      const newH = Math.max(30, Math.round(newW / aspectRatio));

      const img = el.querySelector("img");
      if (img) {
        img.style.width = `${newW}px`;
        img.style.height = `${newH}px`;
      }
    };

    const onMouseUp = async () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      map.dragPan.enable();
      map.scrollZoom.enable();

      const img = el.querySelector("img");
      if (!img) return;

      const newWidth = Number.parseInt(img.style.width);
      const newHeight = Number.parseInt(img.style.height);

      const updatedProps = {
        ...feat.properties,
        image_width: newWidth,
        image_height: newHeight,
      };

      try {
        if (isLocal) {
          await updateGuestFeature(feat.id, { properties: updatedProps });
          queryClient.invalidateQueries({ queryKey: ["guest-features"] });
          useLayerStore.getState().bumpSourceRevision();
        } else {
          await apiFetch(`/api/features/${feat.id}`, {
            method: "PUT",
            body: { properties: updatedProps },
          });
          queryClient.invalidateQueries({ queryKey: queryKeys.features.all });
        }
      } catch {
        // Query refetch will reset on next render
      }
    };

    handle.addEventListener("mousedown", (e) => {
      e.stopPropagation();
      e.preventDefault();
      map.dragPan.disable();
      map.scrollZoom.disable();

      const img = el.querySelector("img");
      if (!img) return;

      startX = e.clientX;
      startY = e.clientY;
      startW = Number.parseInt(img.style.width);
      startH = Number.parseInt(img.style.height);
      aspectRatio = startW / startH;

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    });

    el.appendChild(handle);
  }
}

function removeResizeHandles(el: HTMLElement) {
  el.querySelectorAll(".resize-handle").forEach((h) => h.remove());
}
