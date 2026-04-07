"use client";

import { useQueryClient } from "@tanstack/react-query";
import type { FeatureCollection } from "geojson";
import { apiFetch } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";

export function useFeatures() {
  const queryClient = useQueryClient();

  const invalidateFeatures = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.features.all });

  const fetchFeatures = async (
    layer?: string,
    bbox?: [number, number, number, number],
  ) => {
    const params = new URLSearchParams();
    if (layer) params.set("layer", layer);
    if (bbox) params.set("bbox", bbox.join(","));
    return apiFetch<FeatureCollection>(`/api/features?${params}`);
  };

  const createFeature = async (data: {
    geometry: unknown;
    properties: Record<string, unknown>;
    layer: string;
  }) => {
    const result = await apiFetch("/api/features", {
      method: "POST",
      body: data,
    });
    await invalidateFeatures();
    return result;
  };

  const updateFeature = async (
    id: string,
    data: { geometry?: unknown; properties?: Record<string, unknown> },
  ) => {
    const result = await apiFetch(`/api/features/${id}`, {
      method: "PUT",
      body: data,
    });
    await invalidateFeatures();
    return result;
  };

  const deleteFeature = async (id: string) => {
    const result = await apiFetch(`/api/features/${id}`, {
      method: "DELETE",
    });
    await invalidateFeatures();
    return result;
  };

  return { fetchFeatures, createFeature, updateFeature, deleteFeature };
}
