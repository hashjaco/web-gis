"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useEditingStore } from "@/features/editing/store";
import { apiFetch } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";
import { useLayerStore } from "../store";
import type { LayerConfig } from "../types";

export function useLayers() {
  const setLayers = useLayerStore((s) => s.setLayers);
  const layers = useLayerStore((s) => s.layers);
  const queryClient = useQueryClient();

  const { data, refetch } = useQuery({
    queryKey: queryKeys.layers.all,
    queryFn: () => apiFetch<LayerConfig[]>("/api/layers"),
  });

  useEffect(() => {
    if (data) setLayers(data);
  }, [data, setLayers]);

  const createMutation = useMutation({
    mutationFn: (layer: Partial<LayerConfig>) =>
      apiFetch<LayerConfig>("/api/layers", { method: "POST", body: layer }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.layers.all }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<LayerConfig> }) =>
      apiFetch(`/api/layers/${id}`, { method: "PUT", body: data }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.layers.all }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/layers/${id}`, { method: "DELETE" }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.layers.all });
      const previous = queryClient.getQueryData<LayerConfig[]>(queryKeys.layers.all);
      queryClient.setQueryData<LayerConfig[]>(
        queryKeys.layers.all,
        (old) => old?.filter((l) => l.id !== id) ?? [],
      );
      return { previous };
    },
    onSuccess: (_data, id) => {
      useLayerStore.getState().removeLayer(id);

      const editingState = useEditingStore.getState();
      const remaining = editingState.selectedFeatures.filter(
        (f) => f.layer !== id,
      );
      editingState.setSelectedFeatures(remaining);

      queryClient.invalidateQueries({ queryKey: queryKeys.layers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.features.all });
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.layers.all, context.previous);
      }
    },
  });

  return {
    layers,
    fetchLayers: refetch,
    createLayer: (layer: Partial<LayerConfig>) =>
      createMutation.mutateAsync(layer),
    updateLayer: (id: string, data: Partial<LayerConfig>) =>
      updateMutation.mutateAsync({ id, data }),
    deleteLayer: (id: string) => deleteMutation.mutateAsync(id),
  };
}
