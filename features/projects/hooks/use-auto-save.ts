"use client";

import { useEffect, useRef } from "react";
import { useMapStore } from "@/features/map/store";
import { useLayerStore } from "@/features/layers/store";
import { useProjectStore } from "../store";
import { useSaveProject } from "./use-project-mutations";

const DEBOUNCE_MS = 3000;

export function useAutoSave() {
  const save = useSaveProject();
  const saveRef = useRef(save.mutate);
  saveRef.current = save.mutate;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initializedRef = useRef(false);

  const viewState = useMapStore((s) => s.viewState);
  const basemap = useMapStore((s) => s.activeBasemap);
  const terrain = useMapStore((s) => s.terrainEnabled);
  const buildings = useMapStore((s) => s.buildings3DEnabled);
  const layers = useLayerStore((s) => s.layers);
  const activeProject = useProjectStore((s) => s.activeProject);

  useEffect(() => {
    if (!activeProject) {
      initializedRef.current = false;
      return;
    }

    if (!initializedRef.current) {
      initializedRef.current = true;
      return;
    }

    useProjectStore.getState().markDirty();

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      const store = useProjectStore.getState();
      if (store.activeProject && store.isDirty && !store.isSaving) {
        saveRef.current(store.activeProject.id);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [viewState, basemap, terrain, buildings, layers, activeProject]);
}
