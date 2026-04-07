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

export function getDefaultStyle(index: number): Record<string, unknown> {
  const color = LAYER_PALETTE[index % LAYER_PALETTE.length];
  return {
    paint: {
      "fill-color": color,
      "fill-opacity": 0.6,
    },
  };
}
