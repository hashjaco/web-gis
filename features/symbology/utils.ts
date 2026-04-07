import type { LayerStyle, SimpleStyle } from "./types";

export function styleToMaplibrePaint(
  style: LayerStyle,
): Record<string, unknown> {
  switch (style.mode) {
    case "simple":
      return {
        "fill-color": style.fillColor,
        "fill-opacity": style.fillOpacity,
        "fill-outline-color": style.strokeColor,
      };
    case "categorized": {
      const stops: unknown[] = [];
      for (const cat of style.categories) {
        stops.push(cat.value, cat.color);
      }
      return {
        "fill-color": [
          "match",
          ["get", style.field],
          ...stops,
          style.defaultColor,
        ],
        "fill-opacity": 0.7,
      };
    }
    case "graduated": {
      const stops: unknown[] = [];
      for (const b of style.breaks) {
        stops.push(b.min, b.color);
      }
      return {
        "fill-color": [
          "interpolate",
          ["linear"],
          ["get", style.field],
          ...stops,
        ],
        "fill-opacity": 0.7,
      };
    }
  }
}

export function styleToLinePaint(style: LayerStyle): Record<string, unknown> {
  if (style.mode === "simple") {
    return {
      "line-color": style.strokeColor,
      "line-width": style.strokeWidth,
    };
  }
  return { "line-color": "#333", "line-width": 1 };
}

export const DEFAULT_STYLE: SimpleStyle = {
  mode: "simple",
  fillColor: "#3388ff",
  strokeColor: "#2266cc",
  strokeWidth: 1,
  fillOpacity: 0.6,
};

export const COLOR_RAMPS = [
  ["#ffffb2", "#fecc5c", "#fd8d3c", "#f03b20", "#bd0026"],
  ["#eff3ff", "#bdd7e7", "#6baed6", "#3182bd", "#08519c"],
  ["#edf8e9", "#bae4b3", "#74c476", "#31a354", "#006d2c"],
  ["#feedde", "#fdbe85", "#fd8d3c", "#e6550d", "#a63603"],
  ["#f2f0f7", "#cbc9e2", "#9e9ac8", "#756bb1", "#54278f"],
];
