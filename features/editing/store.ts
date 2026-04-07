"use client";

import { create } from "zustand";
import type { DrawMode, GeoFeature } from "./types";

export interface SnappingSettings {
  enabled: boolean;
  tolerance: number;
}

export interface DrawStyle {
  strokeColor: string;
  strokeWidth: number;
  fillColor: string;
  fillOpacity: number;
}

const DEFAULT_DRAW_STYLE: DrawStyle = {
  strokeColor: "#3bb2d0",
  strokeWidth: 2,
  fillColor: "#3bb2d0",
  fillOpacity: 30,
};

interface EditingState {
  selectedFeatures: GeoFeature[];
  drawMode: DrawMode;
  snapping: SnappingSettings;
  drawStyle: DrawStyle;
  annotationMode: "text" | "image" | null;
  annotationLngLat: [number, number] | null;

  setSelectedFeatures: (features: GeoFeature[]) => void;
  clearSelection: () => void;
  setDrawMode: (mode: DrawMode) => void;
  setSnapping: (settings: Partial<SnappingSettings>) => void;
  setDrawStyle: (style: Partial<DrawStyle>) => void;
  setAnnotationMode: (mode: "text" | "image" | null) => void;
  setAnnotationLngLat: (lngLat: [number, number] | null) => void;
}

export const useEditingStore = create<EditingState>((set) => ({
  selectedFeatures: [],
  drawMode: null,
  snapping: { enabled: false, tolerance: 10 },
  drawStyle: DEFAULT_DRAW_STYLE,
  annotationMode: null,
  annotationLngLat: null,

  setSelectedFeatures: (features) => set({ selectedFeatures: features }),
  clearSelection: () => set({ selectedFeatures: [] }),
  setDrawMode: (mode) => set({ drawMode: mode, annotationMode: null, annotationLngLat: null }),
  setSnapping: (settings) =>
    set((state) => ({ snapping: { ...state.snapping, ...settings } })),
  setDrawStyle: (style) =>
    set((state) => ({ drawStyle: { ...state.drawStyle, ...style } })),
  setAnnotationMode: (mode) =>
    set({ annotationMode: mode, annotationLngLat: null, drawMode: null }),
  setAnnotationLngLat: (lngLat) => set({ annotationLngLat: lngLat }),
}));
