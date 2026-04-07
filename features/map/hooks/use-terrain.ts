"use client";

import { useEffect } from "react";
import { useMapInstance } from "./use-map-instance";
import { useMapStore } from "../store";

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY || "";
const TERRAIN_SOURCE_ID = "terrain-dem";
const HILLSHADE_LAYER_ID = "terrain-hillshade";

function applyTerrain(map: maplibregl.Map) {
  if (!map.getSource(TERRAIN_SOURCE_ID)) {
    map.addSource(TERRAIN_SOURCE_ID, {
      type: "raster-dem",
      url: `https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${MAPTILER_KEY}`,
      tileSize: 256,
    });
  }

  map.setTerrain({ source: TERRAIN_SOURCE_ID, exaggeration: 1.5 });

  if (!map.getLayer(HILLSHADE_LAYER_ID)) {
    map.addLayer(
      {
        id: HILLSHADE_LAYER_ID,
        type: "hillshade",
        source: TERRAIN_SOURCE_ID,
        paint: {
          "hillshade-exaggeration": 0.5,
          "hillshade-shadow-color": "#000000",
          "hillshade-highlight-color": "#ffffff",
          "hillshade-illumination-direction": 315,
        },
      },
      map.getStyle().layers?.[1]?.id,
    );
  }

  const vs = useMapStore.getState().viewState;
  if (vs.pitch < 40) {
    useMapStore.getState().setViewState({ ...vs, pitch: 60 });
  }
}

function removeTerrain(map: maplibregl.Map) {
  map.setTerrain(null);
  if (map.getLayer(HILLSHADE_LAYER_ID)) {
    map.removeLayer(HILLSHADE_LAYER_ID);
  }
}

export function useTerrain() {
  const map = useMapInstance();
  const terrainEnabled = useMapStore((s) => s.terrainEnabled);
  const activeBasemap = useMapStore((s) => s.activeBasemap);

  useEffect(() => {
    if (!map || !MAPTILER_KEY) return;

    if (terrainEnabled) {
      if (map.isStyleLoaded()) {
        applyTerrain(map);
      }

      const onStyleLoad = () => {
        if (useMapStore.getState().terrainEnabled) {
          applyTerrain(map);
        }
      };
      map.on("style.load", onStyleLoad);
      return () => {
        map.off("style.load", onStyleLoad);
      };
    }

    removeTerrain(map);
  }, [map, terrainEnabled, activeBasemap]);
}
