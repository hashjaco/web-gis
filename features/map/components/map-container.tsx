"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import type { MapLayerMouseEvent } from "maplibre-gl";
import { useEffect, useMemo, useRef } from "react";
import type { MapRef } from "react-map-gl/maplibre";
import { Map } from "react-map-gl/maplibre";
import { useLayerSources } from "@/features/layers/hooks/use-layer-sources";
import { useLayerStore } from "@/features/layers/store";
import { useDraw } from "@/features/editing/hooks/use-draw";
import { useEditingStore } from "@/features/editing/store";
import type { GeoFeature } from "@/features/editing/types";
import { useRoutingStore } from "@/features/routing/store";
import { MapRefContext, useMapInstance } from "../hooks/use-map-instance";
import { useViewport } from "../hooks/use-viewport";
import { useMapStore } from "../store";
import { getBasemapUrl } from "../styles";
import { BasemapSwitcher } from "./basemap-switcher";
import { DeckOverlay } from "./deck-overlay";
import { MapControls } from "./map-controls";
import { TerrainControl } from "./terrain-control";
import { useTerrain } from "../hooks/use-terrain";
import { useBuildings3D } from "../hooks/use-buildings-3d";
import { useImagerySources } from "@/features/imagery/hooks/use-imagery-sources";
import { AnnotationPlacer } from "@/features/editing/components/annotation-placer";
import { ImageOverlay } from "@/features/editing/components/image-overlay";

function DrawController() {
  const activeLayerId = useLayerStore((s) => s.activeLayerId);
  const layers = useLayerStore((s) => s.layers);

  const activeLayer = activeLayerId
    ? layers.find((l) => l.id === activeLayerId && l.isVisible !== false)
    : null;

  const drawLayers = activeLayer ? [activeLayer.id] : [];
  const layerColors: Record<string, string> = {};
  if (activeLayer) {
    const paint = ((activeLayer.style ?? {}) as Record<string, unknown>).paint as
      | Record<string, unknown>
      | undefined;
    layerColors[activeLayer.id] = (paint?.["fill-color"] as string) ?? "#3bb2d0";
  }

  useDraw(drawLayers, layerColors);
  return null;
}

interface MapContainerProps {
  deckLayers?: import("@deck.gl/core").Layer[];
}

function TerrainAndBuildings() {
  useTerrain();
  useBuildings3D();
  return null;
}

function ImageryLayerController() {
  useImagerySources();
  return null;
}

function FlyToHandler() {
  const map = useMapInstance();
  const pendingFlyTo = useMapStore((s) => s.pendingFlyTo);
  const clearFlyTo = useMapStore((s) => s.clearFlyTo);
  const setViewState = useMapStore((s) => s.setViewState);

  useEffect(() => {
    if (!pendingFlyTo || !map) return;

    const { longitude, latitude, zoom } = pendingFlyTo;
    map.flyTo({ center: [longitude, latitude], zoom, duration: 1500 });

    map.once("moveend", () => {
      const center = map.getCenter();
      setViewState({
        longitude: center.lng,
        latitude: center.lat,
        zoom: map.getZoom(),
        bearing: map.getBearing(),
        pitch: map.getPitch(),
      });
    });

    clearFlyTo();
  }, [pendingFlyTo, map, clearFlyTo, setViewState]);

  return null;
}

export function MapContainer({ deckLayers = [] }: MapContainerProps) {
  const mapRef = useRef<MapRef>(null);
  const { viewState, onMove } = useViewport();
  const activeBasemap = useMapStore((s) => s.activeBasemap);
  const drawMode = useEditingStore((s) => s.drawMode);
  const setSelectedFeatures = useEditingStore((s) => s.setSelectedFeatures);
  const clearSelection = useEditingStore((s) => s.clearSelection);
  const annotationMode = useEditingStore((s) => s.annotationMode);
  const setAnnotationLngLat = useEditingStore((s) => s.setAnnotationLngLat);
  const pendingPick = useRoutingStore((s) => s.pendingPick);
  const resolvePick = useRoutingStore((s) => s.resolvePick);
  const layers = useLayerStore((s) => s.layers);
  const visibleLayerIds = useMemo(
    () => layers.filter((l) => l.isVisible !== false).map((l) => l.id),
    [layers],
  );

  useLayerSources();

  const isDrawing =
    drawMode != null && drawMode !== "simple_select";
  const isAnnotating = annotationMode != null;
  const isPicking = pendingPick != null;

  const handleClick = (e: MapLayerMouseEvent) => {
    if (isPicking) {
      resolvePick([e.lngLat.lng, e.lngLat.lat]);
      return;
    }

    if (isAnnotating) {
      setAnnotationLngLat([e.lngLat.lng, e.lngLat.lat]);
      return;
    }

    if (isDrawing) return;

    const map = mapRef.current?.getMap();
    if (!map) return;

    const features = map.queryRenderedFeatures(e.point);
    const mapped: GeoFeature[] = features
      .filter((f) => f.source?.startsWith("layer-"))
      .slice(0, 1)
      .map((f) => ({
        id: String(f.id ?? f.properties?.id ?? ""),
        geometry: f.geometry,
        properties: f.properties as Record<string, unknown>,
        layer: f.source ?? "",
        createdAt: "",
        updatedAt: "",
      }));
    if (mapped.length > 0) {
      setSelectedFeatures(mapped);
    } else {
      clearSelection();
    }
  };

  return (
    <MapRefContext value={mapRef}>
      <div className={`relative h-full w-full${isDrawing || isPicking || isAnnotating ? " drawing-active" : ""}`}>
        <Map
          ref={mapRef}
          {...viewState}
          onMove={onMove}
          onClick={handleClick}
          cursor={isDrawing || isPicking || isAnnotating ? "crosshair" : ""}
          mapStyle={getBasemapUrl(activeBasemap)}
          renderWorldCopies={false}
          minZoom={1}
          style={{ width: "100%", height: "100%" }}
        >
          <MapControls />
          <DeckOverlay layers={deckLayers} />
          <DrawController />
          <TerrainAndBuildings />
          <ImageryLayerController />
          <AnnotationPlacer />
          <ImageOverlay layers={visibleLayerIds} />
          <FlyToHandler />
        </Map>
        <TerrainControl />
        <BasemapSwitcher />
      </div>
    </MapRefContext>
  );
}
