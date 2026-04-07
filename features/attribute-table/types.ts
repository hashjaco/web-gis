export interface TableFeature {
  id: string;
  layer: string;
  geometryType: string;
  geometry: GeoJSON.Geometry | null;
  properties: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse {
  features: TableFeature[];
  total: number;
  page: number;
  limit: number;
}
