"use client";

import { create } from "zustand";
import type { VideoOverlay, FrameAnnotation, Detection } from "./types";

interface MediaState {
  overlays: VideoOverlay[];
  annotations: FrameAnnotation[];
  detections: Detection[];
  activeOverlayId: string | null;
  modelLoaded: boolean;
  modelLoading: boolean;

  addOverlay: (overlay: VideoOverlay) => void;
  removeOverlay: (id: string) => void;
  updateOverlay: (id: string, data: Partial<VideoOverlay>) => void;
  setActiveOverlay: (id: string | null) => void;

  addAnnotation: (annotation: FrameAnnotation) => void;
  removeAnnotation: (id: string) => void;
  clearAnnotations: () => void;

  addDetection: (detection: Detection) => void;
  clearDetections: () => void;

  setModelLoaded: (loaded: boolean) => void;
  setModelLoading: (loading: boolean) => void;
}

export const useMediaStore = create<MediaState>((set) => ({
  overlays: [],
  annotations: [],
  detections: [],
  activeOverlayId: null,
  modelLoaded: false,
  modelLoading: false,

  addOverlay: (overlay) =>
    set((s) => ({ overlays: [...s.overlays, overlay] })),
  removeOverlay: (id) =>
    set((s) => ({
      overlays: s.overlays.filter((o) => o.id !== id),
      activeOverlayId: s.activeOverlayId === id ? null : s.activeOverlayId,
    })),
  updateOverlay: (id, data) =>
    set((s) => ({
      overlays: s.overlays.map((o) => (o.id === id ? { ...o, ...data } : o)),
    })),
  setActiveOverlay: (id) => set({ activeOverlayId: id }),

  addAnnotation: (annotation) =>
    set((s) => ({ annotations: [...s.annotations, annotation] })),
  removeAnnotation: (id) =>
    set((s) => ({ annotations: s.annotations.filter((a) => a.id !== id) })),
  clearAnnotations: () => set({ annotations: [] }),

  addDetection: (detection) =>
    set((s) => ({ detections: [...s.detections, detection] })),
  clearDetections: () => set({ detections: [] }),

  setModelLoaded: (loaded) => set({ modelLoaded: loaded }),
  setModelLoading: (loading) => set({ modelLoading: loading }),
}));
