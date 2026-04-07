"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useState, use } from "react";
import { Map, NavigationControl, ScaleControl } from "react-map-gl/maplibre";
import { apiFetch } from "@/lib/api/client";
import { getBasemapUrl } from "@/features/map/styles";
import type { ViewState } from "@/features/map/types";

interface ProjectState {
  viewState?: ViewState;
  basemap?: string;
  layers?: string[];
}

interface ProjectData {
  id: string;
  name: string;
  state: ProjectState;
  is_public: boolean;
}

export default function EmbedPage({
  params,
}: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const [project, setProject] = useState<ProjectData | null>(null);
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
      })
      .catch((err) => setError(err.message));
  }, [projectId]);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <p className="text-sm text-gray-600">Map not found or not public</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen">
      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState as ViewState)}
        mapStyle={getBasemapUrl(project?.state?.basemap ?? "streets")}
        style={{ width: "100%", height: "100%" }}
      >
        <NavigationControl position="top-right" />
        <ScaleControl position="bottom-left" />
      </Map>
      <div className="absolute bottom-2 right-2 rounded bg-black/50 px-2 py-1 text-xs text-white">
        {project?.name ?? "Loading..."}
      </div>
    </div>
  );
}
