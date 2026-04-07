"use client";

import * as turf from "@turf/turf";
import type {
  Feature,
  FeatureCollection,
  MultiPolygon,
  Point,
  Polygon,
} from "geojson";

export function bufferFeature(
  feature: Feature,
  distance: number,
  units: "meters" | "kilometers" | "miles" = "kilometers",
): Feature | null {
  return turf.buffer(feature, distance, { units }) ?? null;
}

export function bufferCollection(
  fc: FeatureCollection,
  distance: number,
  units: "meters" | "kilometers" | "miles" = "kilometers",
): FeatureCollection {
  const buffered = fc.features
    .map((f) => bufferFeature(f, distance, units))
    .filter(Boolean) as Feature[];
  return turf.featureCollection(buffered);
}

export function intersectFeatures(
  a: Feature<Polygon | MultiPolygon>,
  b: Feature<Polygon | MultiPolygon>,
): Feature | null {
  return turf.intersect(turf.featureCollection([a, b])) ?? null;
}

export function unionFeatures(
  features: Feature<Polygon | MultiPolygon>[],
): Feature | null {
  if (features.length === 0) return null;
  if (features.length === 1) return features[0];
  let result = features[0];
  for (let i = 1; i < features.length; i++) {
    const merged = turf.union(
      turf.featureCollection([
        result as Feature<Polygon | MultiPolygon>,
        features[i],
      ]),
    );
    if (!merged) return null;
    result = merged as Feature<Polygon | MultiPolygon>;
  }
  return result;
}

export function dissolveFeatures(
  fc: FeatureCollection<Polygon | MultiPolygon>,
  propertyKey?: string,
): FeatureCollection {
  return turf.dissolve(fc as any, { propertyName: propertyKey }) as FeatureCollection;
}

export function pointsWithinPolygon(
  points: FeatureCollection,
  polygon: Feature<Polygon | MultiPolygon>,
): FeatureCollection {
  return turf.pointsWithinPolygon(
    points as any,
    polygon as any,
  ) as FeatureCollection;
}

export function nearestPoint(
  targetPoint: Feature,
  points: FeatureCollection,
): Feature | null {
  if (points.features.length === 0) return null;
  return turf.nearestPoint(
    turf.getCoord(targetPoint as any) as [number, number],
    points as any,
  );
}

export function centroid(feature: Feature): Feature {
  return turf.centroid(feature);
}

export function centroidCollection(fc: FeatureCollection): FeatureCollection {
  const centroids = fc.features.map((f) => turf.centroid(f));
  return turf.featureCollection(centroids);
}

export function area(feature: Feature): number {
  return turf.area(feature);
}

export function length(feature: Feature): number {
  return turf.length(feature);
}

export function voronoiPolygons(
  points: FeatureCollection<Point>,
  bbox?: [number, number, number, number],
): FeatureCollection {
  const vorFC = turf.voronoi(points as any, { bbox });
  const polys = (vorFC?.features ?? []).filter(Boolean) as Feature[];
  return turf.featureCollection(polys);
}

export function tinInterpolation(
  points: FeatureCollection<Point>,
): FeatureCollection {
  return turf.tin(points as any) as FeatureCollection;
}

export function dbscanClustering(
  points: FeatureCollection<Point>,
  maxDistance: number,
  minPoints: number,
  units: "kilometers" | "miles" = "kilometers",
): FeatureCollection {
  return turf.clustersDbscan(points as any, maxDistance, {
    units,
    minPoints,
  }) as FeatureCollection;
}

export function kMeansClustering(
  points: FeatureCollection<Point>,
  numberOfClusters: number,
): FeatureCollection {
  return turf.clustersKmeans(points as any, {
    numberOfClusters,
  }) as FeatureCollection;
}

export function convexHull(fc: FeatureCollection): Feature | null {
  return turf.convex(fc) ?? null;
}

export function envelope(fc: FeatureCollection): Feature {
  return turf.envelope(fc);
}

export function simplifyFeatures(
  fc: FeatureCollection,
  tolerance: number,
): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: fc.features.map((f) =>
      turf.simplify(f, { tolerance, highQuality: true }),
    ),
  };
}

export function collectStatistics(fc: FeatureCollection): {
  featureCount: number;
  geometryTypes: Record<string, number>;
  totalArea: number;
  totalLength: number;
  bbox: [number, number, number, number] | null;
} {
  const geometryTypes: Record<string, number> = {};
  let totalArea = 0;
  let totalLength = 0;

  for (const f of fc.features) {
    const type = f.geometry?.type ?? "Unknown";
    geometryTypes[type] = (geometryTypes[type] ?? 0) + 1;

    if (type === "Polygon" || type === "MultiPolygon") {
      totalArea += turf.area(f);
    }
    if (type === "LineString" || type === "MultiLineString") {
      totalLength += turf.length(f);
    }
  }

  const bbox = fc.features.length > 0 ? (turf.bbox(fc) as [number, number, number, number]) : null;

  return {
    featureCount: fc.features.length,
    geometryTypes,
    totalArea,
    totalLength,
    bbox,
  };
}
