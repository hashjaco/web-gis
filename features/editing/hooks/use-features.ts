"use client";

import { useQueryClient } from "@tanstack/react-query";
import type { Feature, FeatureCollection } from "geojson";
import { apiFetch } from "@/lib/api/client";
import { useUserPlan } from "@/lib/auth/use-user-plan";
import {
  addGuestFeature,
  getGuestFeatures,
  removeGuestFeature,
  updateGuestFeature,
  type GuestFeatureRecord,
} from "@/lib/guest/guest-db";
import { queryKeys } from "@/lib/query/keys";
import { useProjectStore } from "@/features/projects/store";
import { useLayerStore } from "@/features/layers/store";

function guestRecordToFeature(r: GuestFeatureRecord): Feature {
  return {
    type: "Feature",
    id: r.id,
    geometry: r.geometry,
    properties: { ...r.properties, _id: r.id, _layer: r.layer },
  };
}

export function useFeatures() {
  const queryClient = useQueryClient();
  const projectId = useProjectStore((s) => s.activeProject?.id);
  const { isGuest } = useUserPlan();
  const useLocal = isGuest || !projectId;
  const bumpSourceRevision = useLayerStore((s) => s.bumpSourceRevision);

  const invalidateFeatures = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.features.all });

  const fetchFeatures = async (
    layer?: string,
    bbox?: [number, number, number, number],
  ): Promise<FeatureCollection> => {
    if (useLocal) {
      const records = await getGuestFeatures(layer);
      return {
        type: "FeatureCollection",
        features: records.map(guestRecordToFeature),
      };
    }
    const params = new URLSearchParams();
    if (projectId) params.set("projectId", projectId);
    if (layer) params.set("layer", layer);
    if (bbox) params.set("bbox", bbox.join(","));
    return apiFetch<FeatureCollection>(`/api/features?${params}`);
  };

  const createFeature = async (data: {
    geometry: unknown;
    properties: Record<string, unknown>;
    layer: string;
  }) => {
    if (useLocal) {
      const now = new Date().toISOString();
      const record: GuestFeatureRecord = {
        id: crypto.randomUUID(),
        geometry: data.geometry as GeoJSON.Geometry,
        properties: data.properties,
        layer: data.layer,
        createdAt: now,
        updatedAt: now,
      };
      await addGuestFeature(record);
      bumpSourceRevision();
      return guestRecordToFeature(record);
    }
    const result = await apiFetch("/api/features", {
      method: "POST",
      body: { ...data, projectId },
    });
    await invalidateFeatures();
    return result;
  };

  const updateFeature = async (
    id: string,
    data: { geometry?: unknown; properties?: Record<string, unknown> },
  ) => {
    if (useLocal) {
      const updated = await updateGuestFeature(id, {
        geometry: data.geometry as GeoJSON.Geometry | undefined,
        properties: data.properties,
      });
      bumpSourceRevision();
      return updated ? guestRecordToFeature(updated) : null;
    }
    const result = await apiFetch(`/api/features/${id}`, {
      method: "PUT",
      body: data,
    });
    await invalidateFeatures();
    return result;
  };

  const deleteFeature = async (id: string) => {
    if (useLocal) {
      await removeGuestFeature(id);
      bumpSourceRevision();
      return;
    }
    const result = await apiFetch(`/api/features/${id}`, {
      method: "DELETE",
    });
    await invalidateFeatures();
    return result;
  };

  return { fetchFeatures, createFeature, updateFeature, deleteFeature };
}
