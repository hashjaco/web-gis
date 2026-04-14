export interface LayerConfig {
  id: string;
  name: string;
  description?: string;
  sourceType: string;
  style?: Record<string, unknown>;
  /** Inline GeoJSON data for client-side layers (sourceType "geojson"). */
  data?: GeoJSON.GeoJSON;
  order: number;
  isVisible: boolean;
  opacity: number;
}
