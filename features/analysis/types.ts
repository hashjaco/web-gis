export type AnalysisOperation =
  | "buffer"
  | "intersect"
  | "union"
  | "within"
  | "nearest";

export type ClientAnalysisOperation =
  | "voronoi"
  | "tin"
  | "dbscan"
  | "kmeans"
  | "convex-hull"
  | "dissolve"
  | "centroid"
  | "simplify"
  | "statistics";

export interface AnalysisParams {
  operation: AnalysisOperation;
  projectId?: string;
  geometry?: GeoJSON.Geometry;
  distance?: number;
  distanceUnit?: "meters" | "kilometers" | "miles";
  layer?: string;
  targetLayer?: string;
}

export interface ClientAnalysisParams {
  operation: ClientAnalysisOperation;
  layerId: string;
  distance?: number;
  clusters?: number;
  minPoints?: number;
  tolerance?: number;
  propertyKey?: string;
}

export interface AnalysisResult {
  type: "FeatureCollection";
  features: GeoJSON.Feature[];
}

export interface StatisticsResult {
  featureCount: number;
  geometryTypes: Record<string, number>;
  totalArea: number;
  totalLength: number;
  bbox: [number, number, number, number] | null;
}
