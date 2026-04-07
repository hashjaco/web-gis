export const queryKeys = {
  layers: {
    all: ["layers"] as const,
  },
  features: {
    all: ["features"] as const,
    list: (filters: { layer?: string; layers?: string[]; bbox?: string }) =>
      ["features", filters] as const,
  },
  geocode: {
    search: (query: string) => ["geocode", query] as const,
  },
};
