"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { useProjectStore } from "../store";
import { captureProjectState } from "../lib/project-state";
import type { ProjectRecord } from "../types";

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      description,
      isPublic,
    }: {
      name: string;
      description?: string;
      isPublic?: boolean;
    }) => {
      const state = await captureProjectState();
      return apiFetch<ProjectRecord>("/api/projects", {
        method: "POST",
        body: { name, description, state, isPublic },
      });
    },
    onSuccess: (project) => {
      useProjectStore
        .getState()
        .setActiveProject({ id: project.id, name: project.name });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useSaveProject() {
  return useMutation({
    mutationFn: async (projectId?: string) => {
      const id =
        projectId ?? useProjectStore.getState().activeProject?.id;
      if (!id) throw new Error("No active project to save");

      useProjectStore.getState().markSaving();
      const state = await captureProjectState();
      return apiFetch<ProjectRecord>(`/api/projects/${id}`, {
        method: "PUT",
        body: { state },
      });
    },
    onSuccess: () => {
      useProjectStore.getState().markSaved();
    },
    onError: () => {
      useProjectStore.getState().markDirty();
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      return apiFetch<{ ok: boolean }>(`/api/projects/${projectId}`, {
        method: "DELETE",
      });
    },
    onSuccess: (_data, projectId) => {
      const store = useProjectStore.getState();
      if (store.activeProject?.id === projectId) {
        store.clearProject();
      }
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
