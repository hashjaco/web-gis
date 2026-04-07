"use client";

import { create } from "zustand";

export interface ImageryLayer {
  id: string;
  url: string;
  name: string;
  bbox: [number, number, number, number];
  isVisible: boolean;
  opacity: number;
}

interface ImageryState {
  layers: ImageryLayer[];
  addLayer: (layer: Omit<ImageryLayer, "isVisible" | "opacity">) => void;
  removeLayer: (id: string) => void;
  toggleVisibility: (id: string) => void;
  setOpacity: (id: string, opacity: number) => void;
  hasLayer: (id: string) => boolean;
}

export const useImageryStore = create<ImageryState>((set, get) => ({
  layers: [],
  addLayer: (layer) =>
    set((state) => {
      if (state.layers.some((l) => l.id === layer.id)) return state;
      return {
        layers: [
          ...state.layers,
          { ...layer, isVisible: true, opacity: 80 },
        ],
      };
    }),
  removeLayer: (id) =>
    set((state) => ({
      layers: state.layers.filter((l) => l.id !== id),
    })),
  toggleVisibility: (id) =>
    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === id ? { ...l, isVisible: !l.isVisible } : l,
      ),
    })),
  setOpacity: (id, opacity) =>
    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === id ? { ...l, opacity } : l,
      ),
    })),
  hasLayer: (id) => get().layers.some((l) => l.id === id),
}));
