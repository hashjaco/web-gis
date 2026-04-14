export const LAYER_PALETTE = [
  "#3388ff",
  "#e6194b",
  "#3cb44b",
  "#f58231",
  "#911eb4",
  "#42d4f4",
  "#f032e6",
  "#bfef45",
];

export function getDefaultStyle(
  index: number,
  geometryType?: string,
): Record<string, unknown> {
  const color = LAYER_PALETTE[index % LAYER_PALETTE.length];

  if (geometryType === "Point" || geometryType === "MultiPoint") {
    return {
      type: "circle",
      paint: {
        "circle-color": color,
        "circle-radius": 6,
        "circle-stroke-color": "#fff",
        "circle-stroke-width": 1.5,
        "circle-opacity": 0.85,
      },
    };
  }

  if (geometryType === "LineString" || geometryType === "MultiLineString") {
    return {
      type: "line",
      paint: {
        "line-color": color,
        "line-width": 2.5,
        "line-opacity": 0.8,
      },
    };
  }

  return {
    paint: {
      "fill-color": color,
      "fill-opacity": 0.6,
    },
  };
}
