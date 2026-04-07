"use client";

import type { Map as MapLibreMap } from "maplibre-gl";
import { createContext, useContext } from "react";
import type { MapRef } from "react-map-gl/maplibre";

export const MapRefContext =
  createContext<React.RefObject<MapRef | null> | null>(null);

export function useMapInstance(): MapLibreMap | null {
  const ref = useContext(MapRefContext);
  return ref?.current?.getMap() ?? null;
}
