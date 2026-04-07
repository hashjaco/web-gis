"use client";

import { useQuery } from "@tanstack/react-query";
import type { FeatureCollection } from "geojson";
import { useMemo } from "react";
import { apiFetch } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";
import type { TableFeature } from "../types";

interface UseTableDataOptions {
  layers?: string[];
}

function toTableFeatures(fc: FeatureCollection): {
  rows: TableFeature[];
  columns: string[];
} {
  const rows: TableFeature[] = fc.features.map((f) => ({
    id: String(f.id ?? ""),
    layer: (f.properties?._layer as string) ?? "",
    geometryType: (f.properties?._geometry_type as string) ?? "",
    geometry: f.geometry ?? null,
    properties: f.properties ?? {},
    createdAt: (f.properties?._created_at as string) ?? "",
    updatedAt: (f.properties?._updated_at as string) ?? "",
  }));

  const canonicalKeys = new Map<string, string>();
  for (const row of rows) {
    for (const key of Object.keys(row.properties)) {
      if (key.startsWith("_")) continue;
      const lower = key.toLowerCase();
      if (!canonicalKeys.has(lower)) canonicalKeys.set(lower, key);
    }
  }

  for (const row of rows) {
    const normalized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row.properties)) {
      if (key.startsWith("_")) {
        normalized[key] = value;
        continue;
      }
      const canonical = canonicalKeys.get(key.toLowerCase()) ?? key;
      if (!(canonical in normalized) || normalized[canonical] == null) {
        normalized[canonical] = value;
      }
    }
    row.properties = normalized;
  }

  return { rows, columns: Array.from(canonicalKeys.values()) };
}

const EMPTY_RESULT = { rows: [] as TableFeature[], columns: [] as string[] };

export function useTableData({ layers }: UseTableDataOptions) {
  const hasLayers = layers && layers.length > 0;

  const {
    data: fc,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: queryKeys.features.list({ layers }),
    queryFn: () => {
      const params = new URLSearchParams();
      if (layers) {
        for (const id of layers) params.append("layer", id);
      }
      return apiFetch<FeatureCollection>(`/api/features?${params}`);
    },
    enabled: hasLayers,
  });

  const { rows, columns } = useMemo(
    () => (fc ? toTableFeatures(fc) : EMPTY_RESULT),
    [fc],
  );

  return { data: rows, columns, loading: isLoading, refetch };
}
