export interface SampleDataset {
  id: string;
  name: string;
  description: string;
  geometryType: "Point" | "LineString" | "Polygon" | "Mixed";
  featureCount: number;
  fileName: string;
  suggestedExercises: string[];
}

export const SAMPLE_DATASETS: SampleDataset[] = [
  {
    id: "world-cities",
    name: "World Cities",
    description:
      "20 major cities with population and continent data. Great for learning point symbology, filtering, and popups.",
    geometryType: "Point",
    featureCount: 20,
    fileName: "world-cities.geojson",
    suggestedExercises: [
      "Style points by population size",
      "Filter cities by continent",
      "Create a heatmap of city density",
    ],
  },
  {
    id: "us-states",
    name: "US States",
    description:
      "10 US states with population and area. Practice choropleth maps, spatial queries, and data-driven styling.",
    geometryType: "Polygon",
    featureCount: 10,
    fileName: "us-states.geojson",
    suggestedExercises: [
      "Color states by population",
      "Calculate population density",
      "Find which states overlap a region",
    ],
  },
  {
    id: "earthquakes",
    name: "Earthquakes",
    description:
      "15 global earthquake events with magnitude, depth, and timestamp. Ideal for heatmaps and temporal visualization.",
    geometryType: "Point",
    featureCount: 15,
    fileName: "earthquakes.geojson",
    suggestedExercises: [
      "Create a heatmap by magnitude",
      "Filter by depth or magnitude",
      "Cluster nearby earthquakes",
    ],
  },
  {
    id: "rivers",
    name: "Major Rivers",
    description:
      "5 major world rivers as line features. Practice line styling, measurements, and labeling.",
    geometryType: "LineString",
    featureCount: 5,
    fileName: "rivers.geojson",
    suggestedExercises: [
      "Style lines by river length",
      "Measure total river lengths",
      "Create buffers around rivers",
    ],
  },
  {
    id: "parks",
    name: "City Parks",
    description:
      "Parks, landmarks, and paths in major cities. A mixed-geometry dataset for practicing editing and measurement.",
    geometryType: "Mixed",
    featureCount: 9,
    fileName: "parks.geojson",
    suggestedExercises: [
      "Measure park areas",
      "Add new features by drawing",
      "Edit feature properties",
    ],
  },
];
