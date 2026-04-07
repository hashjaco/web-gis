export type GeoNodeType =
  | "layer-input"
  | "file-input"
  | "buffer"
  | "clip"
  | "intersect"
  | "union"
  | "dissolve"
  | "centroid"
  | "voronoi"
  | "dbscan"
  | "kmeans"
  | "statistics"
  | "output-layer"
  | "output-export";

export interface GeoNodeData {
  label: string;
  nodeType: GeoNodeType;
  params: Record<string, unknown>;
  result?: unknown;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  nodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    data: GeoNodeData;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
  }>;
}
