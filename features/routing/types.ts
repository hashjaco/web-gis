export type RoutingProfile = "car" | "bike" | "foot" | "truck" | "wheelchair";

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  name: string;
}

export interface RouteResult {
  geometry: GeoJSON.LineString;
  distance: number;
  duration: number;
  steps: RouteStep[];
}
