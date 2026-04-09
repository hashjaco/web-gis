"use client";

import { useState } from "react";

export interface ImageryResult {
  id: string;
  date: string;
  cloudCover: number;
  thumbnail: string | null;
  cogUrl: string;
  bbox: [number, number, number, number];
  collection: string;
  name: string;
}

interface SearchParams {
  bbox: [number, number, number, number];
  dateFrom: string;
  dateTo: string;
  maxCloud: number;
  collection: string;
}

const STAC_URL = "https://earth-search.aws.element84.com/v1";

function s3ToHttps(url: string): string {
  if (!url.startsWith("s3://")) return url;
  const rest = url.slice(5);
  const slashIdx = rest.indexOf("/");
  const bucket = rest.slice(0, slashIdx);
  const key = rest.slice(slashIdx + 1);
  return `https://${bucket}.s3.us-west-2.amazonaws.com/${key}`;
}

export function useImagerySearch() {
  const [results, setResults] = useState<ImageryResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (params: SearchParams) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${STAC_URL}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collections: [params.collection],
          bbox: params.bbox,
          datetime: `${params.dateFrom}T00:00:00Z/${params.dateTo}T23:59:59Z`,
          limit: 20,
          query: {
            "eo:cloud_cover": { lte: params.maxCloud },
          },
          sortby: [{ field: "properties.datetime", direction: "desc" }],
        }),
      });

      if (!res.ok) throw new Error(`STAC search failed: ${res.status}`);
      const data = await res.json();

      const mapped: ImageryResult[] = (data.features ?? []).map(
        (f: Record<string, unknown>) => {
          const props = f.properties as Record<string, unknown>;
          const assets = f.assets as Record<string, Record<string, string>>;
          const visualAsset =
            assets?.visual ?? assets?.["rendered_preview"] ?? assets?.thumbnail;
          const cogAsset =
            assets?.visual ?? assets?.["B04"] ?? assets?.red;
          const date = ((props.datetime as string) ?? "").slice(0, 10);
          return {
            id: f.id as string,
            date,
            cloudCover: (props["eo:cloud_cover"] as number) ?? 0,
            thumbnail: visualAsset?.href
              ? s3ToHttps(visualAsset.href)
              : (assets?.thumbnail?.href ? s3ToHttps(assets.thumbnail.href) : null),
            cogUrl: s3ToHttps(cogAsset?.href ?? ""),
            bbox: f.bbox as [number, number, number, number],
            collection: params.collection,
            name: `${params.collection} - ${date}`,
          };
        },
      );

      setResults(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return { results, loading, error, search };
}
