"use client";

import { create } from "zustand";
import type { ViewState } from "./types";

interface FlyToTarget {
  longitude: number;
  latitude: number;
  zoom: number;
}

interface MapState {
  viewState: ViewState;
  activeBasemap: string;
  terrainEnabled: boolean;
  buildings3DEnabled: boolean;
  pendingFlyTo: FlyToTarget | null;
  setViewState: (viewState: ViewState) => void;
  setActiveBasemap: (id: string) => void;
  setTerrainEnabled: (enabled: boolean) => void;
  setBuildings3DEnabled: (enabled: boolean) => void;
  requestFlyTo: (longitude: number, latitude: number, zoom: number) => void;
  clearFlyTo: () => void;
}

export const useMapStore = create<MapState>((set) => ({
  viewState: {
    longitude: -80.0,
    latitude: 35.0,
    zoom: 7,
    bearing: 0,
    pitch: 0,
  },
  activeBasemap: "streets",
  terrainEnabled: false,
  buildings3DEnabled: false,
  pendingFlyTo: null,
  setViewState: (viewState) => set({ viewState }),
  setActiveBasemap: (id) => set({ activeBasemap: id }),
  setTerrainEnabled: (enabled) => set({ terrainEnabled: enabled }),
  setBuildings3DEnabled: (enabled) => set({ buildings3DEnabled: enabled }),
  requestFlyTo: (longitude, latitude, zoom) =>
    set({ pendingFlyTo: { longitude, latitude, zoom } }),
  clearFlyTo: () => set({ pendingFlyTo: null }),
}));
