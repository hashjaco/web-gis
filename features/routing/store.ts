"use client";

import { create } from "zustand";

type PickField = "start" | "end";

interface RoutingPickState {
  pendingPick: PickField | null;
  startCoords: [number, number] | null;
  endCoords: [number, number] | null;
  startPick: (field: PickField) => void;
  resolvePick: (coords: [number, number]) => void;
  cancelPick: () => void;
}

export const useRoutingStore = create<RoutingPickState>((set, get) => ({
  pendingPick: null,
  startCoords: null,
  endCoords: null,
  startPick: (field) => set({ pendingPick: field }),
  resolvePick: (coords) => {
    const field = get().pendingPick;
    if (!field) return;
    set({
      pendingPick: null,
      ...(field === "start" ? { startCoords: coords } : { endCoords: coords }),
    });
  },
  cancelPick: () => set({ pendingPick: null }),
}));
