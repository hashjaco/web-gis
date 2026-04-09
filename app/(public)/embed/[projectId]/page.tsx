"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useState, use } from "react";
import {
  Map,
  NavigationControl,
  ScaleControl,
  Source,
  Layer,
} from "react-map-gl/maplibre";
import { apiFetch } from "@/lib/api/client";
import { getBasemapUrl } from "@/features/map/styles";
import type { ViewState } from "@/features/map/types";
import type { ProjectState } from "@/features/projects/types";

interface ProjectData {
  id: string;
  name: string;
  state: ProjectState;
  is_public: boolean;
}

interface EmbedLayer {
  id: string;
  name: string;
  sourceType: string;
  style: Record<string, unknown> | null;
  isVisible: boolean;
  opacity: number;
}

export default function EmbedPage({
  params,
}: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const [project, setProject] = useState<ProjectData | null>(null);
  const [layers, setLayers] = useState<EmbedLayer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [viewState, setViewState] = useState<ViewState>({
    longitude: -80,
    latitude: 35,
    zoom: 7,
    bearing: 0,
    pitch: 0,
  });

  useEffect(() => {
    apiFetch<ProjectData>(`/api/projects/${projectId}`)
      .then((data) => {
        setProject(data);
        if (data.state?.viewState) {
          setViewState(data.state.viewState);
        }
        if (data.state?.layerIds?.length) {
          apiFetch<EmbedLayer[]>(`/api/embed/${projectId}/layers`).then(
            (allLayers) => {
              const ordered = data.state.layerIds
                .map((id) => allLayers.find((l) => l.id === id))
                .filter((l): l is EmbedLayer => l != null)
                .map((l) => {
                  const override = data.state.layerOverrides?.[l.id];
                  if (!override) return l;
                  return {
                    ...l,
                    isVisible: override.isVisible ?? l.isVisible,
                    opacity: override.opacity ?? l.opacity,
                  };
                });
              setLayers(ordered);
            },
          );
        }
      })
      .catch((err) => setError(err.message));
  }, [projectId]);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Map not found or not public</p>
      </div>
    );
  }

  const terrainEnabled = project?.state?.terrainEnabled ?? false;
  const buildings3DEnabled = project?.state?.buildings3DEnabled ?? false;

  return (
    <div className="h-screen w-screen">
      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState as ViewState)}
        mapStyle={getBasemapUrl(project?.state?.basemap ?? "streets")}
        style={{ width: "100%", height: "100%" }}
        terrain={terrainEnabled ? { source: "terrain", exaggeration: 1.5 } : undefined}
      >
        <NavigationControl position="top-right" />
        <ScaleControl position="bottom-left" />

        {terrainEnabled && (
          <Source
            id="terrain"
            type="raster-dem"
            url="https://demotiles.maplibre.org/terrain-tiles/tiles.json"
            tileSize={256}
          />
        )}

        {layers
          .filter((l) => l.isVisible)
          .map((layer) => (
            <Source
              key={layer.id}
              id={`embed-${layer.id}`}
              type="geojson"
              data={`/api/embed/${projectId}/features?layer=${layer.id}`}
            >
              <Layer
                id={`embed-layer-${layer.id}`}
                type="circle"
                paint={{
                  "circle-radius": 5,
                  "circle-color": "#2EC4B6",
                  "circle-opacity": layer.opacity,
                  ...(layer.style as Record<string, unknown> ?? {}),
                }}
              />
            </Source>
          ))}
      </Map>
      <div className="absolute bottom-2 right-2 rounded bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
        {project?.name ?? "Loading..."}
      </div>
    </div>
  );
}
