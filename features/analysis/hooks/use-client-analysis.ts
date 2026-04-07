"use client";

import { useState, useCallback } from "react";
import { apiFetch } from "@/lib/api/client";
import type { FeatureCollection, Point, Polygon, MultiPolygon } from "geojson";
import type {
  AnalysisResult,
  ClientAnalysisParams,
  StatisticsResult,
} from "../types";
import {
  voronoiPolygons,
  tinInterpolation,
  dbscanClustering,
  kMeansClustering,
  convexHull,
  dissolveFeatures,
  centroidCollection,
  simplifyFeatures,
  collectStatistics,
} from "../turf-ops";

export function useClientAnalysis() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [statistics, setStatistics] = useState<StatisticsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (params: ClientAnalysisParams) => {
    setLoading(true);
    setError(null);
    setStatistics(null);
    try {
      const fc = await apiFetch<FeatureCollection>(
        `/api/features?layer=${params.layerId}`,
      );

      if (!fc.features.length) {
        throw new Error("No features found in layer");
      }

      let output: FeatureCollection;

      switch (params.operation) {
        case "voronoi": {
          const pointFC = filterPoints(fc);
          const bbox = getBBox(fc);
          output = voronoiPolygons(pointFC, bbox);
          break;
        }
        case "tin": {
          const pointFC = filterPoints(fc);
          output = tinInterpolation(pointFC);
          break;
        }
        case "dbscan": {
          const pointFC = filterPoints(fc);
          output = dbscanClustering(
            pointFC,
            params.distance ?? 1,
            params.minPoints ?? 3,
          );
          break;
        }
        case "kmeans": {
          const pointFC = filterPoints(fc);
          output = kMeansClustering(pointFC, params.clusters ?? 5);
          break;
        }
        case "convex-hull": {
          const hull = convexHull(fc);
          output = hull
            ? { type: "FeatureCollection", features: [hull] }
            : { type: "FeatureCollection", features: [] };
          break;
        }
        case "dissolve": {
          const polyFC = filterPolygons(fc);
          output = dissolveFeatures(polyFC, params.propertyKey);
          break;
        }
        case "centroid": {
          output = centroidCollection(fc);
          break;
        }
        case "simplify": {
          output = simplifyFeatures(fc, params.tolerance ?? 0.001);
          break;
        }
        case "statistics": {
          const stats = collectStatistics(fc);
          setStatistics(stats);
          output = fc;
          break;
        }
        default:
          throw new Error(`Unknown operation: ${params.operation}`);
      }

      setResult(output as AnalysisResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
    setStatistics(null);
    setError(null);
  }, []);

  return { result, statistics, loading, error, run, clearResult };
}

function filterPoints(fc: FeatureCollection): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: fc.features.filter(
      (f) => f.geometry?.type === "Point",
    ) as GeoJSON.Feature<Point>[],
  };
}

function filterPolygons(
  fc: FeatureCollection,
): FeatureCollection<Polygon | MultiPolygon> {
  return {
    type: "FeatureCollection",
    features: fc.features.filter(
      (f) =>
        f.geometry?.type === "Polygon" || f.geometry?.type === "MultiPolygon",
    ) as GeoJSON.Feature<Polygon | MultiPolygon>[],
  };
}

function getBBox(fc: FeatureCollection): [number, number, number, number] {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const f of fc.features) {
    if (!f.geometry || f.geometry.type === "GeometryCollection") continue;
    const coords = JSON.stringify(
      (f.geometry as GeoJSON.Point | GeoJSON.LineString | GeoJSON.Polygon).coordinates,
    );
    const nums = coords.match(/-?\d+\.?\d*/g)?.map(Number) ?? [];
    for (let i = 0; i < nums.length; i += 2) {
      if (nums[i] < minX) minX = nums[i];
      if (nums[i] > maxX) maxX = nums[i];
      if (nums[i + 1] < minY) minY = nums[i + 1];
      if (nums[i + 1] > maxY) maxY = nums[i + 1];
    }
  }
  return [minX, minY, maxX, maxY];
}
