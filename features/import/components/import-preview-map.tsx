"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useState, useRef } from "react";
import { Map, Source, Layer } from "react-map-gl/maplibre";
import type { MapRef } from "react-map-gl/maplibre";
import * as turf from "@turf/turf";
import { reprojectIfNeeded } from "@/features/import/lib/reproject";
import type { FeatureCollection } from "geojson";

interface ImportPreviewMapProps {
  data: FeatureCollection & { crs?: unknown };
}

export function ImportPreviewMap({ data }: ImportPreviewMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [fc, setFc] = useState<FeatureCollection | null>(null);

  useEffect(() => {
    let cancelled = false;
    const clone = JSON.parse(JSON.stringify(data)) as FeatureCollection & {
      crs?: unknown;
    };
    reprojectIfNeeded(clone).then(() => {
      if (!cancelled) setFc(clone);
    });
    return () => {
      cancelled = true;
    };
  }, [data]);

  useEffect(() => {
    if (!fc || fc.features.length === 0) return;
    const map = mapRef.current?.getMap();
    if (!map) return;

    const onLoad = () => {
      try {
        const [minLng, minLat, maxLng, maxLat] = turf.bbox(fc);
        map.fitBounds(
          [
            [minLng, minLat],
            [maxLng, maxLat],
          ],
          { padding: 40, maxZoom: 14, duration: 0 },
        );
      } catch {}
    };

    if (map.loaded()) onLoad();
    else map.once("load", onLoad);
  }, [fc]);

  const hasGeometry =
    fc != null &&
    fc.features.some((f) => f.geometry && "coordinates" in f.geometry);

  const geometryTypes = new Set(
    fc?.features.map((f) => f.geometry?.type).filter(Boolean) ?? [],
  );
  const hasPolygons =
    geometryTypes.has("Polygon") || geometryTypes.has("MultiPolygon");
  const hasLines =
    geometryTypes.has("LineString") || geometryTypes.has("MultiLineString");
  const hasPoints =
    geometryTypes.has("Point") || geometryTypes.has("MultiPoint");

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Map
        ref={mapRef}
        initialViewState={{ longitude: -119.5, latitude: 37.5, zoom: 5 }}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        style={{ width: "100%", height: "100%" }}
      >
        {hasGeometry && fc && (
          <Source id="preview" type="geojson" data={fc}>
            {hasPolygons && (
              <Layer
                id="preview-fill"
                type="fill"
                paint={{ "fill-color": "#3bb2d0", "fill-opacity": 0.5 }}
                filter={[
                  "any",
                  ["==", ["geometry-type"], "Polygon"],
                  ["==", ["geometry-type"], "MultiPolygon"],
                ]}
              />
            )}
            {hasPolygons && (
              <Layer
                id="preview-outline"
                type="line"
                paint={{ "line-color": "#1a8fa8", "line-width": 1.5 }}
                filter={[
                  "any",
                  ["==", ["geometry-type"], "Polygon"],
                  ["==", ["geometry-type"], "MultiPolygon"],
                ]}
              />
            )}
            {hasLines && (
              <Layer
                id="preview-line"
                type="line"
                paint={{ "line-color": "#3bb2d0", "line-width": 2 }}
                filter={[
                  "any",
                  ["==", ["geometry-type"], "LineString"],
                  ["==", ["geometry-type"], "MultiLineString"],
                ]}
              />
            )}
            {hasPoints && (
              <Layer
                id="preview-circle"
                type="circle"
                paint={{
                  "circle-radius": 5,
                  "circle-color": "#3bb2d0",
                  "circle-stroke-color": "#1a8fa8",
                  "circle-stroke-width": 1,
                }}
                filter={[
                  "any",
                  ["==", ["geometry-type"], "Point"],
                  ["==", ["geometry-type"], "MultiPoint"],
                ]}
              />
            )}
          </Source>
        )}
      </Map>
    </div>
  );
}
