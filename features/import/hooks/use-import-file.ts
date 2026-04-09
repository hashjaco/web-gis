"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as turf from "@turf/turf";
import { apiFetch } from "@/lib/api/client";
import { useUserPlan } from "@/lib/auth/use-user-plan";
import {
  addGuestFeature,
  addGuestLayer,
  type GuestFeatureRecord,
} from "@/lib/guest/guest-db";
import { queryKeys } from "@/lib/query/keys";
import { useLayerStore } from "@/features/layers/store";
import { useProjectStore } from "@/features/projects/store";
import { useMapInstance } from "@/features/map/hooks/use-map-instance";
import { reprojectIfNeeded } from "@/features/import/lib/reproject";
import type { LayerConfig } from "@/features/layers/types";
import type { FeatureCollection } from "geojson";

async function parseFile(file: File): Promise<FeatureCollection> {
  const ext = file.name.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "geojson":
    case "json": {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (parsed.type === "FeatureCollection") return parsed;
      if (parsed.type === "Feature")
        return { type: "FeatureCollection", features: [parsed] };
      throw new Error("Invalid GeoJSON structure");
    }

    case "csv": {
      const text = await file.text();
      return csvToGeoJson(text);
    }

    case "zip":
    case "shp": {
      const shpjs = await import("shpjs");
      const buffer = await file.arrayBuffer();
      const result = await shpjs.default(buffer);
      if (Array.isArray(result)) {
        return {
          type: "FeatureCollection",
          features: result.flatMap((fc) => fc.features),
        };
      }
      return result as FeatureCollection;
    }

    case "kml": {
      const { kml: kmlParser } = await import("@tmcw/togeojson");
      const text = await file.text();
      const dom = new DOMParser().parseFromString(text, "text/xml");
      return kmlParser(dom) as FeatureCollection;
    }

    case "gpx": {
      const { gpx: gpxParser } = await import("@tmcw/togeojson");
      const text = await file.text();
      const dom = new DOMParser().parseFromString(text, "text/xml");
      return gpxParser(dom) as FeatureCollection;
    }

    case "fgb": {
      const { deserialize } = await import("flatgeobuf/lib/mjs/geojson.js");
      const buffer = await file.arrayBuffer();
      const features: GeoJSON.Feature[] = [];
      for await (const feature of deserialize(new Uint8Array(buffer))) {
        features.push(feature as GeoJSON.Feature);
      }
      return { type: "FeatureCollection", features };
    }

    default:
      throw new Error(`Unsupported format: .${ext}`);
  }
}

function csvToGeoJson(text: string): FeatureCollection {
  const lines = text.trim().split("\n");
  if (lines.length < 2) throw new Error("CSV has no data rows");

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const latIdx = headers.findIndex((h) =>
    ["lat", "latitude", "y"].includes(h),
  );
  const lngIdx = headers.findIndex((h) =>
    ["lng", "lon", "longitude", "x"].includes(h),
  );

  if (latIdx === -1 || lngIdx === -1) {
    throw new Error("CSV must have latitude and longitude columns");
  }

  const features: GeoJSON.Feature[] = lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.trim());
    const lat = Number.parseFloat(cols[latIdx]);
    const lng = Number.parseFloat(cols[lngIdx]);
    const properties: Record<string, unknown> = {};
    for (let i = 0; i < headers.length; i++) {
      if (i !== latIdx && i !== lngIdx) {
        properties[headers[i]] = cols[i];
      }
    }
    return {
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [lng, lat] },
      properties,
    };
  });

  return { type: "FeatureCollection", features };
}

async function importAsGuest(
  fc: FeatureCollection,
  layerName: string,
  setProgress: (p: number) => void,
) {
  const layerId = crypto.randomUUID();
  const existing = useLayerStore.getState().layers;
  const layer: LayerConfig = {
    id: layerId,
    name: layerName,
    sourceType: "vector",
    style: { paint: { "fill-color": "#3bb2d0", "fill-opacity": 0.5 } },
    order: existing.length,
    isVisible: true,
    opacity: 1,
  };
  await addGuestLayer(layer);
  useLayerStore.getState().addLayer(layer);
  setProgress(40);

  const total = fc.features.length;
  const now = new Date().toISOString();

  for (let i = 0; i < total; i++) {
    const feature = fc.features[i];
    const record: GuestFeatureRecord = {
      id: crypto.randomUUID(),
      geometry: feature.geometry,
      properties: (feature.properties ?? {}) as Record<string, unknown>,
      layer: layerId,
      createdAt: now,
      updatedAt: now,
    };
    await addGuestFeature(record);
    if (i % 50 === 0) {
      setProgress(40 + Math.round(((i + 1) / total) * 55));
    }
  }

  let bbox: [number, number, number, number] | null = null;
  try {
    const envelope = turf.bbox(fc);
    if (envelope && envelope.length === 4) {
      bbox = envelope as [number, number, number, number];
    }
  } catch {}

  return { count: total, bbox };
}

export function useImportFile() {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);
  const map = useMapInstance();
  const projectId = useProjectStore((s) => s.activeProject?.id);
  const { isGuest } = useUserPlan();

  const mutation = useMutation({
    mutationFn: async ({
      file,
      layerName,
    }: { file: File; layerName: string }) => {
      setProgress(10);
      const fc = await parseFile(file);
      await reprojectIfNeeded(fc);
      setProgress(30);

      if (isGuest) {
        return importAsGuest(fc, layerName, setProgress);
      }

      let activeProjectId = useProjectStore.getState().activeProject?.id;
      if (!activeProjectId) {
        const project = await apiFetch<{ id: string; name: string }>(
          "/api/projects",
          {
            method: "POST",
            body: { name: layerName, state: {}, isPublic: false },
          },
        );
        useProjectStore
          .getState()
          .setActiveProject({ id: project.id, name: project.name });
        activeProjectId = project.id;
      }

      const layerConfig = await apiFetch<{ id: string; name: string }>(
        "/api/layers",
        {
          method: "POST",
          body: {
            name: layerName,
            sourceType: "vector",
            style: {
              paint: { "fill-color": "#3bb2d0", "fill-opacity": 0.5 },
            },
            projectId: activeProjectId,
          },
        },
      );
      const layerId = layerConfig.id;
      setProgress(40);

      const total = fc.features.length;
      const batchSize = 100;
      let imported = 0;

      for (let i = 0; i < total; i += batchSize) {
        const batch = fc.features.slice(i, i + batchSize);
        await Promise.all(
          batch.map((feature) =>
            apiFetch("/api/features", {
              method: "POST",
              body: {
                geometry: feature.geometry,
                properties: feature.properties ?? {},
                layer: layerId,
                projectId: activeProjectId,
              },
            }),
          ),
        );
        imported += batch.length;
        setProgress(40 + Math.round((imported / total) * 55));
      }

      let bbox: [number, number, number, number] | null = null;
      try {
        const envelope = turf.bbox(fc);
        if (envelope && envelope.length === 4) {
          bbox = envelope as [number, number, number, number];
        }
      } catch {}

      return { count: total, bbox };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.features.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.layers.all });
      useLayerStore.getState().bumpSourceRevision();

      if (data.bbox && map) {
        map.fitBounds(data.bbox, { padding: 40, maxZoom: 14 });
      }

      setProgress(100);
      setTimeout(() => setProgress(0), 1000);
    },
    onError: () => {
      setProgress(0);
    },
  });

  const importFile = async (file: File, layerName: string) => {
    return mutation.mutateAsync({ file, layerName });
  };

  return {
    importing: mutation.isPending,
    error: mutation.error?.message ?? null,
    progress,
    projectId,
    isGuest,
    importFile,
  };
}
