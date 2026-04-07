"use client";

import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as turf from "@turf/turf";
import { apiFetch } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";
import { useLayerStore } from "@/features/layers/store";
import { useMapInstance } from "@/features/map/hooks/use-map-instance";
import { reprojectIfNeeded } from "@/features/import/lib/reproject";
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

export function useImportFile() {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);
  const map = useMapInstance();

  const mutation = useMutation({
    mutationFn: async ({
      file,
      layerName,
    }: { file: File; layerName: string }) => {
      setProgress(10);
      const fc = await parseFile(file);
      await reprojectIfNeeded(fc);
      setProgress(30);

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

  const importFile = useCallback(
    async (file: File, layerName: string) => {
      return mutation.mutateAsync({ file, layerName });
    },
    [mutation],
  );

  return {
    importing: mutation.isPending,
    error: mutation.error?.message ?? null,
    progress,
    importFile,
  };
}
