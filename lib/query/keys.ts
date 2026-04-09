export const queryKeys = {
  layers: {
    all: ["layers"] as const,
    byProject: (projectId: string) => ["layers", projectId] as const,
  },
  features: {
    all: ["features"] as const,
    list: (filters: {
      projectId?: string;
      layer?: string;
      layers?: string[];
      bbox?: string;
    }) => ["features", filters] as const,
  },
  geocode: {
    search: (query: string) => ["geocode", query] as const,
  },
};
