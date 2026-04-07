import type { FeatureCollection, Position } from "geojson";

const EPSG_3857_ALIASES = [
  "EPSG:3857",
  "EPSG::3857",
  "EPSG:900913",
  "EPSG::900913",
  "GOOGLE",
  "3857",
  "900913",
];

/**
 * Detects the source SRID from a FeatureCollection's `crs` property or by
 * checking whether coordinates fall outside the valid WGS-84 range.
 * Returns 4326 when the data is already in longitude/latitude.
 */
export function detectSrid(
  fc: FeatureCollection & { crs?: unknown },
): number {
  const srid = sridFromCrsProperty(fc.crs);
  if (srid !== null) return srid;

  if (coordinatesExceedWgs84(fc)) return 3857;

  return 4326;
}

function sridFromCrsProperty(crs: unknown): number | null {
  if (crs == null || typeof crs !== "object") return null;

  const props = (crs as Record<string, unknown>).properties;
  if (props == null || typeof props !== "object") return null;

  const name = String((props as Record<string, unknown>).name ?? "");
  const upper = name.toUpperCase().replace(/\s+/g, "");

  for (const alias of EPSG_3857_ALIASES) {
    if (upper.includes(alias)) return 3857;
  }

  const epsgMatch = upper.match(/EPSG:{1,2}(\d+)/);
  if (epsgMatch) return Number.parseInt(epsgMatch[1], 10);

  return null;
}

function coordinatesExceedWgs84(fc: FeatureCollection): boolean {
  const limit = Math.min(fc.features.length, 5);
  for (let i = 0; i < limit; i++) {
    const geom = fc.features[i]?.geometry;
    if (!geom || !("coordinates" in geom)) continue;

    const sample = firstPosition(geom.coordinates as Position | Position[]);
    if (!sample) continue;

    if (Math.abs(sample[0]) > 180 || Math.abs(sample[1]) > 90) {
      return true;
    }
  }
  return false;
}

function firstPosition(coords: unknown): Position | null {
  if (!Array.isArray(coords)) return null;
  if (typeof coords[0] === "number") return coords as Position;
  return firstPosition(coords[0]);
}

/**
 * Reprojects a FeatureCollection in-place from the detected source CRS to
 * WGS-84 (EPSG:4326). Also strips Z coordinates and the legacy `crs` property.
 * No-ops when data is already in 4326.
 */
export async function reprojectIfNeeded(
  fc: FeatureCollection & { crs?: unknown },
): Promise<void> {
  const srid = detectSrid(fc);
  if (srid === 4326) return;

  const proj4Module = await import("proj4");
  const proj4 = proj4Module.default;

  const transform = buildTransform(proj4, srid);

  for (const feature of fc.features) {
    if (!feature.geometry || !("coordinates" in feature.geometry)) continue;
    feature.geometry.coordinates = transformCoords(
      feature.geometry.coordinates,
      transform,
    );
  }

  delete (fc as Record<string, unknown>).crs;
}

type TransformFn = (coord: Position) => Position;

function buildTransform(
  proj4: typeof import("proj4").default,
  sourceSrid: number,
): TransformFn {
  const knownProjections: Record<string, string> = {
    "3857":
      "+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs +type=crs",
    "900913":
      "+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs +type=crs",
  };

  const srcDef = knownProjections[String(sourceSrid)];
  if (!srcDef) {
    throw new Error(
      `Unsupported source CRS: EPSG:${sourceSrid}. Only EPSG:4326 and EPSG:3857 are currently supported for import.`,
    );
  }

  const converter = proj4(srcDef, "EPSG:4326");

  return (coord: Position): Position => {
    const [x, y] = converter.forward(coord);
    return [x, y];
  };
}

function transformCoords(
  coords: unknown,
  transform: TransformFn,
): GeoJSON.Position | GeoJSON.Position[] | GeoJSON.Position[][] | GeoJSON.Position[][][] {
  if (!Array.isArray(coords)) return coords as GeoJSON.Position;

  if (typeof coords[0] === "number") {
    return transform(coords as Position);
  }

  return coords.map((c) => transformCoords(c, transform));
}
