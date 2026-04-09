"use client";

import type { ViewState } from "@/features/map/types";
import type { LayerConfig } from "@/features/layers/types";

const STORAGE_KEY = "shimgis-guest-session";

export interface GuestSession {
  viewState: ViewState;
  basemap: string;
  terrainEnabled: boolean;
  buildings3DEnabled: boolean;
  layers: LayerConfig[];
  features: GuestFeature[];
  savedAt: number;
}

export interface GuestFeature {
  id: string;
  geometry: GeoJSON.Geometry;
  properties: Record<string, unknown>;
  layer: string;
}

const DEFAULT_SESSION: GuestSession = {
  viewState: {
    longitude: -80,
    latitude: 35,
    zoom: 7,
    bearing: 0,
    pitch: 0,
  },
  basemap: "streets",
  terrainEnabled: false,
  buildings3DEnabled: false,
  layers: [],
  features: [],
  savedAt: 0,
};

export function loadGuestSession(): GuestSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GuestSession;
  } catch {
    return null;
  }
}

export function saveGuestSession(session: Partial<GuestSession>): void {
  if (typeof window === "undefined") return;
  try {
    const current = loadGuestSession() ?? DEFAULT_SESSION;
    const merged: GuestSession = { ...current, ...session, savedAt: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // localStorage may be full or unavailable
  }
}

export function clearGuestSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // noop
  }
}

export function hasGuestSession(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) !== null;
}
