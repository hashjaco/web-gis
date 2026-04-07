import type { BasemapStyle } from "./types";

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY || "";

function maptilerUrl(style: string): string {
  if (!MAPTILER_KEY) {
    return `https://demotiles.maplibre.org/style.json`;
  }
  return `https://api.maptiler.com/maps/${style}/style.json?key=${MAPTILER_KEY}`;
}

export const basemapStyles: BasemapStyle[] = [
  { id: "streets", name: "Streets", url: maptilerUrl("streets-v2") },
  { id: "satellite", name: "Satellite", url: maptilerUrl("satellite") },
  { id: "topo", name: "Topographic", url: maptilerUrl("topo-v2") },
  { id: "dark", name: "Dark", url: maptilerUrl("dataviz-dark") },
];

export function getBasemapUrl(id: string): string {
  const style = basemapStyles.find((s) => s.id === id);
  return style?.url ?? basemapStyles[0].url;
}
