"use client";

import { create } from "zustand";
import type { LayerConfig } from "./types";

interface LayerState {
  layers: LayerConfig[];
  activeLayerId: string | null;
  sourceRevision: number;
  setLayers: (layers: LayerConfig[]) => void;
  addLayer: (layer: LayerConfig) => void;
  removeLayer: (id: string) => void;
  setActiveLayer: (id: string | null) => void;
  toggleVisibility: (id: string) => void;
  setOpacity: (id: string, opacity: number) => void;
  reorderLayers: (layers: LayerConfig[]) => void;
  bumpSourceRevision: () => void;
}

export const useLayerStore = create<LayerState>((set) => ({
  layers: [],
  activeLayerId: null,
  sourceRevision: 0,
  setLayers: (layers) => set({ layers }),
  addLayer: (layer) => set((state) => ({ layers: [...state.layers, layer] })),
  removeLayer: (id) =>
    set((state) => ({
      layers: state.layers.filter((l) => l.id !== id),
      activeLayerId: state.activeLayerId === id ? null : state.activeLayerId,
    })),
  setActiveLayer: (id) =>
    set((state) => ({
      activeLayerId: state.activeLayerId === id ? null : id,
    })),
  toggleVisibility: (id) =>
    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === id ? { ...l, isVisible: !l.isVisible } : l,
      ),
    })),
  setOpacity: (id, opacity) =>
    set((state) => ({
      layers: state.layers.map((l) => (l.id === id ? { ...l, opacity } : l)),
    })),
  reorderLayers: (layers) => set({ layers }),
  bumpSourceRevision: () =>
    set((state) => ({ sourceRevision: state.sourceRevision + 1 })),
}));
