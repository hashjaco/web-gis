import type { BBox, Feature, FeatureCollection } from "geojson";

export function toFeatureCollection(features: Feature[]): FeatureCollection {
  return {
    type: "FeatureCollection",
    features,
  };
}

export function bboxToPolygon(bbox: BBox): GeoJSON.Polygon {
  const [minX, minY, maxX, maxY] = bbox;
  return {
    type: "Polygon",
    coordinates: [
      [
        [minX, minY],
        [maxX, minY],
        [maxX, maxY],
        [minX, maxY],
        [minX, minY],
      ],
    ],
  };
}

export function parseBBox(bboxStr: string): BBox | null {
  const parts = bboxStr.split(",").map(Number);
  if (parts.length !== 4 || parts.some(Number.isNaN)) return null;
  return parts as unknown as BBox;
}
