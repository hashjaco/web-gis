import type { Map as MapLibreMap } from "maplibre-gl";
import { useLayerStore } from "@/features/layers/store";
import { useMapStore } from "@/features/map/store";
import type { ProjectState } from "../types";

let _mapInstance: MapLibreMap | null = null;

export function registerMapInstance(map: MapLibreMap | null): void {
  _mapInstance = map;
}

const THUMB_W = 400;
const THUMB_H = 240;

function captureThumbnail(): Promise<string | undefined> {
  const map = _mapInstance;
  if (!map) return Promise.resolve(undefined);

  return new Promise((resolve) => {
    map.once("render", () => {
      try {
        const srcCanvas = map.getCanvas();
        const offscreen = document.createElement("canvas");
        offscreen.width = THUMB_W;
        offscreen.height = THUMB_H;
        const ctx = offscreen.getContext("2d");
        if (!ctx) {
          resolve(undefined);
          return;
        }
        ctx.drawImage(srcCanvas, 0, 0, THUMB_W, THUMB_H);
        resolve(offscreen.toDataURL("image/jpeg", 0.6));
      } catch {
        resolve(undefined);
      }
    });
    map.triggerRepaint();
  });
}

export async function captureProjectState(): Promise<ProjectState> {
  const map = useMapStore.getState();
  const { layers } = useLayerStore.getState();

  const layerOverrides: ProjectState["layerOverrides"] = {};
  for (const l of layers) {
    layerOverrides[l.id] = {
      isVisible: l.isVisible,
      opacity: l.opacity,
      order: l.order,
    };
  }

  const thumbnail = await captureThumbnail();

  return {
    viewState: { ...map.viewState },
    basemap: map.activeBasemap,
    terrainEnabled: map.terrainEnabled,
    buildings3DEnabled: map.buildings3DEnabled,
    layerIds: layers.map((l) => l.id),
    layerOverrides,
    thumbnail,
  };
}

export function hydrateProjectState(state: ProjectState): void {
  const mapStore = useMapStore.getState();
  const layerStore = useLayerStore.getState();

  if (state.viewState) {
    mapStore.setViewState(state.viewState);
  }
  if (state.basemap) {
    mapStore.setActiveBasemap(state.basemap);
  }
  if (state.terrainEnabled !== undefined) {
    mapStore.setTerrainEnabled(state.terrainEnabled);
  }
  if (state.buildings3DEnabled !== undefined) {
    mapStore.setBuildings3DEnabled(state.buildings3DEnabled);
  }

  if (state.layerIds && state.layerOverrides) {
    const currentLayers = layerStore.layers;
    const updated = currentLayers.map((layer) => {
      const override = state.layerOverrides[layer.id];
      if (!override) return layer;
      return {
        ...layer,
        isVisible: override.isVisible ?? layer.isVisible,
        opacity: override.opacity ?? layer.opacity,
        order: override.order ?? layer.order,
      };
    });

    updated.sort((a, b) => a.order - b.order);
    layerStore.setLayers(updated);
  }
}
