"use client";

import { useEffect } from "react";
import { useMapInstance } from "./use-map-instance";
import { useMapStore } from "../store";

const BUILDINGS_SOURCE_ID = "openmaptiles";
const BUILDINGS_LAYER_ID = "3d-buildings";
const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY || "";

function applyBuildings(map: maplibregl.Map) {
  const vs = useMapStore.getState().viewState;
  if (vs.pitch < 40) {
    useMapStore.getState().setViewState({ ...vs, pitch: 60 });
  }

  if (!map.getSource(BUILDINGS_SOURCE_ID)) {
    map.addSource(BUILDINGS_SOURCE_ID, {
      type: "vector",
      url: `https://api.maptiler.com/tiles/v3/tiles.json?key=${MAPTILER_KEY}`,
    });
  }

  if (!map.getLayer(BUILDINGS_LAYER_ID)) {
    map.addLayer({
      id: BUILDINGS_LAYER_ID,
      type: "fill-extrusion",
      source: BUILDINGS_SOURCE_ID,
      "source-layer": "building",
      minzoom: 14,
      paint: {
        "fill-extrusion-color": [
          "interpolate",
          ["linear"],
          ["get", "render_height"],
          0, "#e0e0e0",
          50, "#c0c0c0",
          100, "#a0a0a0",
          200, "#808080",
        ],
        "fill-extrusion-height": [
          "interpolate",
          ["linear"],
          ["zoom"],
          14, 0,
          15, ["get", "render_height"],
        ],
        "fill-extrusion-base": [
          "interpolate",
          ["linear"],
          ["zoom"],
          14, 0,
          15, ["get", "render_min_height"],
        ],
        "fill-extrusion-opacity": 0.7,
      },
    });
  }
}

function removeBuildings(map: maplibregl.Map) {
  if (map.getLayer(BUILDINGS_LAYER_ID)) {
    map.removeLayer(BUILDINGS_LAYER_ID);
  }
}

export function useBuildings3D() {
  const map = useMapInstance();
  const enabled = useMapStore((s) => s.buildings3DEnabled);
  const activeBasemap = useMapStore((s) => s.activeBasemap);

  useEffect(() => {
    if (!map || !MAPTILER_KEY) return;

    if (enabled) {
      if (map.isStyleLoaded()) {
        applyBuildings(map);
      }

      const onStyleLoad = () => {
        if (useMapStore.getState().buildings3DEnabled) {
          applyBuildings(map);
        }
      };
      map.on("style.load", onStyleLoad);
      return () => {
        map.off("style.load", onStyleLoad);
      };
    }

    removeBuildings(map);
  }, [map, enabled, activeBasemap]);
}
