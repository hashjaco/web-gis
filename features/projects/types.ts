import type { ViewState } from "@/features/map/types";

export interface LayerOverride {
  isVisible?: boolean;
  opacity?: number;
  order?: number;
}

export interface ProjectState {
  viewState: ViewState;
  basemap: string;
  terrainEnabled: boolean;
  buildings3DEnabled: boolean;
  layerIds: string[];
  layerOverrides: Record<string, LayerOverride>;
  thumbnail?: string;
}

export interface ProjectRecord {
  id: string;
  name: string;
  description: string | null;
  state: ProjectState;
  owner_id: string;
  org_id: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}
