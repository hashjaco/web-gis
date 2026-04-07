import type { Feature, Geometry } from "geojson";

export type DrawMode =
  | "simple_select"
  | "draw_point"
  | "draw_line_string"
  | "draw_polygon"
  | "draw_circle"
  | "draw_rectangle"
  | "draw_freehand"
  | "draw_text"
  | "draw_image"
  | "draw_marker"
  | null;

export interface GeoFeature {
  id: string;
  geometry: Geometry;
  properties: Record<string, unknown>;
  layer: string;
  createdAt: string;
  updatedAt: string;
}

export type GeoJSONFeature = Feature<Geometry, Record<string, unknown>>;
