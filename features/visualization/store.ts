"use client";

import type { Layer } from "@deck.gl/core";
import { create } from "zustand";

export type VisualizationType =
  | "none"
  | "heatmap"
  | "hexbin"
  | "arc"
  | "scatterplot";

interface VisualizationState {
  vizType: VisualizationType;
  vizLayerId: string | null;
  pointCloudLayer: Layer | null;
  setVizType: (type: VisualizationType) => void;
  setVizLayerId: (id: string | null) => void;
  setPointCloudLayer: (layer: Layer | null) => void;
}

export const useVisualizationStore = create<VisualizationState>((set) => ({
  vizType: "none",
  vizLayerId: null,
  pointCloudLayer: null,
  setVizType: (type) => set({ vizType: type }),
  setVizLayerId: (id) => set({ vizLayerId: id }),
  setPointCloudLayer: (layer) => set({ pointCloudLayer: layer }),
}));
