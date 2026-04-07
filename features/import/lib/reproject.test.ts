import type { FeatureCollection } from "geojson";
import { describe, expect, it } from "vitest";
import { detectSrid, reprojectIfNeeded } from "./reproject";

function makeFC(
  coords: number[][],
  crs?: unknown,
): FeatureCollection & { crs?: unknown } {
  return {
    type: "FeatureCollection",
    ...(crs !== undefined ? { crs } : {}),
    features: coords.map((c) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: c },
      properties: {},
    })),
  };
}

function makePolygonFC(
  rings: number[][][],
  crs?: unknown,
): FeatureCollection & { crs?: unknown } {
  return {
    type: "FeatureCollection",
    ...(crs !== undefined ? { crs } : {}),
    features: [
      {
        type: "Feature" as const,
        geometry: { type: "Polygon" as const, coordinates: rings },
        properties: {},
      },
    ],
  };
}

describe("detectSrid", () => {
  it("returns 3857 when crs property declares EPSG:3857", () => {
    const fc = makeFC(
      [[0, 0]],
      { type: "name", properties: { name: "EPSG:3857" } },
    );
    expect(detectSrid(fc)).toBe(3857);
  });

  it("returns 3857 for urn:ogc style CRS string", () => {
    const fc = makeFC(
      [[0, 0]],
      { type: "name", properties: { name: "urn:ogc:def:crs:EPSG::3857" } },
    );
    expect(detectSrid(fc)).toBe(3857);
  });

  it("returns 3857 for EPSG:900913 alias", () => {
    const fc = makeFC(
      [[0, 0]],
      { type: "name", properties: { name: "EPSG:900913" } },
    );
    expect(detectSrid(fc)).toBe(3857);
  });

  it("returns 4326 when crs declares EPSG:4326", () => {
    const fc = makeFC(
      [[-122, 37]],
      { type: "name", properties: { name: "EPSG:4326" } },
    );
    expect(detectSrid(fc)).toBe(4326);
  });

  it("returns 4326 when no crs and coords are in WGS-84 range", () => {
    const fc = makeFC([[-122.4, 37.8]]);
    expect(detectSrid(fc)).toBe(4326);
  });

  it("returns 3857 when no crs but coordinates exceed WGS-84 range", () => {
    const fc = makeFC([[-13296596, 4383675]]);
    expect(detectSrid(fc)).toBe(3857);
  });

  it("returns 4326 for an empty FeatureCollection", () => {
    const fc: FeatureCollection = { type: "FeatureCollection", features: [] };
    expect(detectSrid(fc)).toBe(4326);
  });
});

describe("reprojectIfNeeded", () => {
  it("no-ops when data is already WGS-84", async () => {
    const fc = makeFC([[-122.4, 37.8]]);
    await reprojectIfNeeded(fc);
    const [lng, lat] = fc.features[0].geometry.type === "Point"
      ? (fc.features[0].geometry as GeoJSON.Point).coordinates
      : [0, 0];
    expect(lng).toBeCloseTo(-122.4, 5);
    expect(lat).toBeCloseTo(37.8, 5);
  });

  it("reprojects EPSG:3857 point coordinates to WGS-84", async () => {
    const fc = makeFC(
      [[-13627665.27, 4547675.35]],
      { type: "name", properties: { name: "EPSG:3857" } },
    );
    await reprojectIfNeeded(fc);
    const [lng, lat] = (fc.features[0].geometry as GeoJSON.Point).coordinates;
    expect(lng).toBeCloseTo(-122.42, 1);
    expect(lat).toBeCloseTo(37.78, 1);
  });

  it("reprojects EPSG:3857 polygon coordinates to WGS-84", async () => {
    const ring: number[][] = [
      [-13627665, 4547675, 0],
      [-13626665, 4547675, 0],
      [-13626665, 4548675, 0],
      [-13627665, 4548675, 0],
      [-13627665, 4547675, 0],
    ];
    const fc = makePolygonFC(
      [ring],
      { type: "name", properties: { name: "EPSG:3857" } },
    );
    await reprojectIfNeeded(fc);

    const coords = (fc.features[0].geometry as GeoJSON.Polygon).coordinates[0];
    for (const coord of coords) {
      expect(coord.length).toBe(2);
      expect(Math.abs(coord[0])).toBeLessThan(180);
      expect(Math.abs(coord[1])).toBeLessThan(90);
    }
  });

  it("strips Z coordinates", async () => {
    const fc = makeFC(
      [[-13627665.27, 4547675.35, 0]],
      { type: "name", properties: { name: "EPSG:3857" } },
    );
    await reprojectIfNeeded(fc);
    const coords = (fc.features[0].geometry as GeoJSON.Point).coordinates;
    expect(coords.length).toBe(2);
  });

  it("removes the crs property after reprojection", async () => {
    const fc = makeFC(
      [[-13627665.27, 4547675.35]],
      { type: "name", properties: { name: "EPSG:3857" } },
    );
    expect(fc.crs).toBeDefined();
    await reprojectIfNeeded(fc);
    expect(fc.crs).toBeUndefined();
  });

  it("uses coordinate heuristic when crs property is absent", async () => {
    const fc = makeFC([[-13627665.27, 4547675.35]]);
    await reprojectIfNeeded(fc);
    const [lng, lat] = (fc.features[0].geometry as GeoJSON.Point).coordinates;
    expect(lng).toBeCloseTo(-122.42, 1);
    expect(lat).toBeCloseTo(37.78, 1);
  });

  it("handles MultiPoint geometry", async () => {
    const fc: FeatureCollection & { crs?: unknown } = {
      type: "FeatureCollection",
      crs: { type: "name", properties: { name: "EPSG:3857" } },
      features: [
        {
          type: "Feature",
          geometry: {
            type: "MultiPoint",
            coordinates: [
              [-13627665.27, 4547675.35],
              [-13626665.27, 4548675.35],
            ],
          },
          properties: {},
        },
      ],
    };
    await reprojectIfNeeded(fc);
    const coords = (fc.features[0].geometry as GeoJSON.MultiPoint).coordinates;
    for (const coord of coords) {
      expect(Math.abs(coord[0])).toBeLessThan(180);
      expect(Math.abs(coord[1])).toBeLessThan(90);
    }
  });

  it("handles LineString geometry", async () => {
    const fc: FeatureCollection & { crs?: unknown } = {
      type: "FeatureCollection",
      crs: { type: "name", properties: { name: "EPSG:3857" } },
      features: [
        {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [
              [-13627665.27, 4547675.35],
              [-13626665.27, 4548675.35],
            ],
          },
          properties: {},
        },
      ],
    };
    await reprojectIfNeeded(fc);
    const coords = (fc.features[0].geometry as GeoJSON.LineString).coordinates;
    for (const coord of coords) {
      expect(Math.abs(coord[0])).toBeLessThan(180);
      expect(Math.abs(coord[1])).toBeLessThan(90);
    }
  });
});
