"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useMapStore } from "@/features/map/store";
import { useLayerStore } from "@/features/layers/store";
import {
  loadGuestSession,
  saveGuestSession,
  clearGuestSession,
  hasGuestSession,
} from "./local-state";

const DEBOUNCE_MS = 2000;

/**
 * Persists map + layer state to localStorage for guest users.
 * When a guest signs in, hydrates the session into the stores
 * and clears localStorage.
 */
export function useGuestPersistence() {
  const { user, isLoaded } = useUser();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydratedRef = useRef(false);

  const viewState = useMapStore((s) => s.viewState);
  const basemap = useMapStore((s) => s.activeBasemap);
  const terrain = useMapStore((s) => s.terrainEnabled);
  const buildings = useMapStore((s) => s.buildings3DEnabled);
  const layers = useLayerStore((s) => s.layers);

  const isGuest = isLoaded && !user;

  // Hydrate guest session on first load (guest only)
  useEffect(() => {
    if (!isLoaded || hydratedRef.current) return;
    hydratedRef.current = true;

    const session = loadGuestSession();
    if (!session) return;

    if (!user) {
      // Guest returning — restore their session
      const mapStore = useMapStore.getState();
      mapStore.setViewState(session.viewState);
      mapStore.setActiveBasemap(session.basemap);
      mapStore.setTerrainEnabled(session.terrainEnabled);
      mapStore.setBuildings3DEnabled(session.buildings3DEnabled);

      if (session.layers.length > 0) {
        useLayerStore.getState().setLayers(session.layers);
      }
    }
  }, [isLoaded, user]);

  // When a user signs in and there's a guest session, keep it available
  // for the migration prompt, then clear after migration or dismissal
  useEffect(() => {
    if (!isLoaded || !user) return;
    // Signed-in user: we don't auto-clear here — the migration dialog handles it
  }, [isLoaded, user]);

  // Auto-save guest state on changes
  useEffect(() => {
    if (!isGuest) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      saveGuestSession({
        viewState,
        basemap,
        terrainEnabled: terrain,
        buildings3DEnabled: buildings,
        layers,
      });
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isGuest, viewState, basemap, terrain, buildings, layers]);

  return { isGuest, hasGuestSession: hasGuestSession, clearGuestSession };
}
