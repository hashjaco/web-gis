"use client";

import { useMapInstance } from "@/features/map/hooks/use-map-instance";

export function useExport() {
  const map = useMapInstance();

  function exportPng() {
    if (!map) return;
    const canvas = map.getCanvas();
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = "map-export.png";
    link.href = dataUrl;
    link.click();
  }

  async function exportGeoJson(layer?: string) {
    const params = new URLSearchParams();
    if (layer) params.set("layer", layer);
    const res = await fetch(`/api/features?${params}`);
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/geo+json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `features${layer ? `-${layer}` : ""}.geojson`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function exportCsv(layer?: string) {
    const params = new URLSearchParams();
    if (layer) params.set("layer", layer);
    const res = await fetch(`/api/features?${params}`);
    const data = await res.json();

    if (!data.features?.length) return;

    const allKeys = new Set<string>();
    for (const f of data.features) {
      if (f.properties) {
        for (const key of Object.keys(f.properties)) {
          if (!key.startsWith("_")) allKeys.add(key);
        }
      }
    }
    const cols = ["id", ...Array.from(allKeys)];
    const header = cols.join(",");
    const rows = data.features.map(
      (f: { id: string; properties: Record<string, unknown> }) =>
        [
          f.id,
          ...Array.from(allKeys).map((k) =>
            JSON.stringify(f.properties?.[k] ?? ""),
          ),
        ].join(","),
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `features${layer ? `-${layer}` : ""}.csv`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }

  return { exportPng, exportGeoJson, exportCsv };
}
