"use client";

import { useEffect, useRef } from "react";
import { useMapStore } from "@/features/map/store";
import { useLayerStore } from "@/features/layers/store";

export function useUrlState() {
  const initialized = useRef(false);
  const setViewState = useMapStore((s) => s.setViewState);
  const setActiveBasemap = useMapStore((s) => s.setActiveBasemap);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);

    const lng = params.get("lng");
    const lat = params.get("lat");
    const zoom = params.get("z");
    const pitch = params.get("p");
    const bearing = params.get("b");
    const basemap = params.get("basemap");

    if (lng && lat && zoom) {
      setViewState({
        longitude: Number(lng),
        latitude: Number(lat),
        zoom: Number(zoom),
        pitch: pitch ? Number(pitch) : 0,
        bearing: bearing ? Number(bearing) : 0,
      });
    }

    if (basemap) {
      setActiveBasemap(basemap);
    }

    const layerIds = params.get("layers");
    if (layerIds) {
      const visibleIds = new Set(layerIds.split(","));
      const store = useLayerStore.getState();
      const updated = store.layers.map((l) => ({
        ...l,
        isVisible: visibleIds.has(l.id),
      }));
      store.setLayers(updated);
    }
  }, [setViewState, setActiveBasemap]);

  const generateShareUrl = () => {
    const vs = useMapStore.getState().viewState;
    const basemap = useMapStore.getState().activeBasemap;
    const layers = useLayerStore.getState().layers;
    const visibleLayerIds = layers
      .filter((l) => l.isVisible)
      .map((l) => l.id);

    const params = new URLSearchParams();
    params.set("lng", vs.longitude.toFixed(5));
    params.set("lat", vs.latitude.toFixed(5));
    params.set("z", vs.zoom.toFixed(2));
    if (vs.pitch) params.set("p", vs.pitch.toFixed(1));
    if (vs.bearing) params.set("b", vs.bearing.toFixed(1));
    params.set("basemap", basemap);
    if (visibleLayerIds.length > 0) {
      params.set("layers", visibleLayerIds.join(","));
    }

    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    return url;
  };

  const copyShareLink = async () => {
    const url = generateShareUrl();
    await navigator.clipboard.writeText(url);
    return url;
  };

  return { generateShareUrl, copyShareLink };
}
