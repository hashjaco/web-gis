"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useEditingStore } from "@/features/editing/store";
import { useProjectStore } from "@/features/projects/store";
import { apiFetch } from "@/lib/api/client";
import { useUserPlan } from "@/lib/auth/use-user-plan";
import {
  addGuestLayer,
  getGuestLayers,
  removeGuestLayer,
  updateGuestLayer,
} from "@/lib/guest/guest-db";
import { queryKeys } from "@/lib/query/keys";
import { useLayerStore } from "../store";
import type { LayerConfig } from "../types";

export function useLayers() {
  const setLayers = useLayerStore((s) => s.setLayers);
  const layers = useLayerStore((s) => s.layers);
  const queryClient = useQueryClient();
  const projectId = useProjectStore((s) => s.activeProject?.id);
  const { isGuest } = useUserPlan();
  const useLocal = isGuest || !projectId;
  const localHydrated = useRef(false);

  const layerQueryKey = projectId
    ? queryKeys.layers.byProject(projectId)
    : queryKeys.layers.all;

  const { data, refetch } = useQuery({
    queryKey: layerQueryKey,
    queryFn: () => {
      const params = new URLSearchParams();
      if (projectId) params.set("projectId", projectId);
      return apiFetch<LayerConfig[]>(`/api/layers?${params}`);
    },
    enabled: !useLocal,
  });

  useEffect(() => {
    if (data && !useLocal) setLayers(data);
  }, [data, setLayers, useLocal]);

  useEffect(() => {
    if (!useLocal || localHydrated.current) return;
    localHydrated.current = true;
    getGuestLayers().then((stored) => {
      if (stored.length) setLayers(stored);
    });
  }, [useLocal, setLayers]);

  const createMutation = useMutation({
    mutationFn: (layer: Partial<LayerConfig>) =>
      apiFetch<LayerConfig>("/api/layers", {
        method: "POST",
        body: { ...layer, projectId },
      }),
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

  const createLayerLocal = async (
    layer: Partial<LayerConfig>,
  ): Promise<LayerConfig> => {
    const existing = useLayerStore.getState().layers;
    const full: LayerConfig = {
      id: crypto.randomUUID(),
      name: layer.name ?? "Untitled Layer",
      sourceType: layer.sourceType ?? "geojson",
      order: existing.length,
      isVisible: true,
      opacity: 1,
      ...layer,
    } as LayerConfig;
    await addGuestLayer(full);
    useLayerStore.getState().addLayer(full);
    return full;
  };

  const updateLayerLocal = async (
    id: string,
    patch: Partial<LayerConfig>,
  ): Promise<void> => {
    await updateGuestLayer(id, patch);
    const updated = useLayerStore.getState().layers.map((l) =>
      l.id === id ? { ...l, ...patch } : l,
    );
    useLayerStore.getState().setLayers(updated);
  };

  const deleteLayerLocal = async (id: string): Promise<void> => {
    await removeGuestLayer(id);
    useLayerStore.getState().removeLayer(id);

    const editingState = useEditingStore.getState();
    const remaining = editingState.selectedFeatures.filter(
      (f) => f.layer !== id,
    );
    editingState.setSelectedFeatures(remaining);
  };

  return {
    layers,
    projectId,
    isGuest,
    fetchLayers: useLocal
      ? () => getGuestLayers().then((s) => { setLayers(s); return { data: s }; })
      : refetch,
    createLayer: (layer: Partial<LayerConfig>) => {
      if (useLocal) return createLayerLocal(layer);
      return createMutation.mutateAsync(layer);
    },
    updateLayer: (id: string, data: Partial<LayerConfig>) =>
      useLocal
        ? updateLayerLocal(id, data)
        : updateMutation.mutateAsync({ id, data }),
    deleteLayer: (id: string) =>
      useLocal ? deleteLayerLocal(id) : deleteMutation.mutateAsync(id),
  };
}
