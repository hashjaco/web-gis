export interface ConceptCard {
  id: string;
  title: string;
  summary: string;
  explanation: string;
  arcgisEquivalent?: string;
  relatedPanel?: string;
}

export const CONCEPT_CARDS: ConceptCard[] = [
  {
    id: "what-is-gis",
    title: "What is GIS?",
    summary:
      "Geographic Information Systems capture, store, analyze, and visualize location-based data.",
    explanation:
      "GIS stands for Geographic Information System. It is a framework for gathering, managing, and analyzing spatial data. Instead of just looking at a table of data, GIS lets you see that data on a map, revealing patterns, relationships, and trends that are not obvious in spreadsheets. Everything from city planning to environmental science to logistics uses GIS daily.",
  },
  {
    id: "layers",
    title: "What is a Layer?",
    summary:
      "Layers are stacked collections of map data, like transparent sheets on top of each other.",
    explanation:
      "A layer is a single dataset displayed on the map. For example, one layer might show roads, another shows buildings, and another shows parks. Each layer can be styled independently, turned on or off, and has its own set of features (the individual shapes on the map). Layers stack on top of each other, with the top layer drawn last.",
    arcgisEquivalent: "Layer / Feature Layer in the Table of Contents",
    relatedPanel: "layers",
  },
  {
    id: "features",
    title: "What is a Feature?",
    summary:
      "Features are individual geographic objects -- a point, line, or polygon with attributes.",
    explanation:
      "A feature is a single item on the map: a city (point), a road (line), or a park boundary (polygon). Each feature has a geometry (its shape and location) and properties (attributes like name, population, or type). When you click on something on the map, you are selecting a feature.",
    arcgisEquivalent: "Feature / Record in a Feature Class",
    relatedPanel: "editing",
  },
  {
    id: "geometry-types",
    title: "Points, Lines, and Polygons",
    summary:
      "The three basic shapes used to represent real-world objects on a map.",
    explanation:
      "Points represent locations (cities, sensors, trees). Lines represent linear features (roads, rivers, pipelines). Polygons represent areas (countries, parks, lakes). Most GIS data uses one of these three types. Some datasets mix types, but typically each layer contains just one geometry type.",
    arcgisEquivalent: "Point / Polyline / Polygon feature classes",
    relatedPanel: "editing",
  },
  {
    id: "projections",
    title: "What are Projections?",
    summary:
      "Map projections transform the 3D Earth onto a flat 2D screen, with trade-offs.",
    explanation:
      "The Earth is a sphere, but your screen is flat. A projection is the math used to flatten the globe. Different projections preserve different things: some keep shapes accurate (conformal), some keep areas accurate (equal-area), some keep distances accurate. The most common web projection is Web Mercator (EPSG:3857), which preserves shapes but distorts sizes near the poles. When you import data, ShimGIS can reproject it to match the map.",
    arcgisEquivalent: "Coordinate System / Spatial Reference",
    relatedPanel: "import",
  },
  {
    id: "geojson",
    title: "What is GeoJSON?",
    summary:
      "A simple, human-readable format for encoding geographic data as JSON.",
    explanation:
      "GeoJSON is the most common format for web GIS data. It is just JSON with a specific structure: each Feature has a 'geometry' (the shape) and 'properties' (the attributes). A FeatureCollection groups multiple features together. You can open a GeoJSON file in any text editor. ShimGIS uses GeoJSON as its primary data format internally.",
    arcgisEquivalent: "Shapefile / Feature Class (different format, same idea)",
    relatedPanel: "import",
  },
  {
    id: "buffer",
    title: "What is a Buffer?",
    summary:
      "A buffer creates a zone of a specified distance around a feature.",
    explanation:
      "Buffering is one of the most common GIS operations. You pick a feature (like a school) and a distance (like 500 meters), and the tool creates a polygon showing everything within that distance. This is useful for proximity analysis: 'What is within 1 mile of this hospital?' or 'Which homes are within 100 feet of a flood zone?'",
    arcgisEquivalent: "Buffer tool in Analysis / Geoprocessing",
    relatedPanel: "analysis",
  },
  {
    id: "geocoding",
    title: "What is Geocoding?",
    summary:
      "Converting an address or place name into map coordinates (latitude/longitude).",
    explanation:
      "When you type 'Central Park, New York' into the search bar and the map flies there, that is geocoding. It converts text into coordinates. The reverse (clicking a spot and getting an address) is called reverse geocoding. ShimGIS uses the Nominatim geocoding service.",
    arcgisEquivalent: "Geocode Addresses / Locator",
  },
  {
    id: "basemap",
    title: "What is a Basemap?",
    summary:
      "The background map layer that provides geographic context for your data.",
    explanation:
      "A basemap is the reference map underneath your data layers. Common basemaps include street maps (showing roads and labels), satellite imagery (aerial photos), and topographic maps (showing terrain). Your data sits on top of the basemap. You can switch basemaps without affecting your data. ShimGIS offers several basemap options in the bottom-right corner of the map.",
    arcgisEquivalent: "Basemap Gallery",
  },
  {
    id: "symbology",
    title: "What is Symbology?",
    summary:
      "Symbology controls how features look on the map -- colors, sizes, and shapes.",
    explanation:
      "Symbology (or styling) is how you visually represent your data. A simple example: coloring all parks green. A more advanced example: sizing city dots by population so bigger cities have bigger dots (graduated symbols), or coloring countries by GDP (choropleth map). Good symbology makes your data immediately understandable.",
    arcgisEquivalent: "Symbology pane / Change Style",
    relatedPanel: "layers",
  },
  {
    id: "spatial-analysis",
    title: "What is Spatial Analysis?",
    summary:
      "Using geographic relationships to answer questions about your data.",
    explanation:
      "Spatial analysis goes beyond 'what does the map look like' to 'what does the map mean.' Examples: finding all restaurants within 500m of a subway station (proximity), identifying clusters of crime incidents (hotspot analysis), or determining which flood zones overlap with schools (overlay analysis). These operations use the location of features to derive new insights.",
    arcgisEquivalent: "Analysis tools / Geoprocessing toolbox",
    relatedPanel: "analysis",
  },
  {
    id: "attribute-table",
    title: "What is an Attribute Table?",
    summary:
      "A spreadsheet-like view of all the properties attached to your map features.",
    explanation:
      "Every feature on the map has attributes (properties) beyond just its shape. An attribute table shows all features in rows and all their properties in columns, like a spreadsheet. You can sort, filter, and edit values. Selecting a row highlights the feature on the map, and vice versa. In ShimGIS, the attribute table appears at the bottom of the map view.",
    arcgisEquivalent: "Attribute Table / Open Table",
  },
];

export interface GuidedExercise {
  id: string;
  title: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  sampleDataset: string;
  steps: string[];
  concepts: string[];
}

export const GUIDED_EXERCISES: GuidedExercise[] = [
  {
    id: "first-map",
    title: "Create Your First Map",
    difficulty: "beginner",
    sampleDataset: "world-cities",
    steps: [
      "Click 'Import' in the sidebar",
      "Scroll down and load the 'World Cities' sample dataset",
      "Click on a city point to see its attributes",
      "Try changing the basemap using the buttons at the bottom-right",
      "Zoom in and out using your scroll wheel",
    ],
    concepts: ["layers", "features", "basemap"],
  },
  {
    id: "style-choropleth",
    title: "Color a Map by Data",
    difficulty: "beginner",
    sampleDataset: "us-states",
    steps: [
      "Load the 'US States' sample dataset from Import",
      "Open the Layers panel and click on the US States layer",
      "Adjust the fill color and opacity to make states visible",
      "Open the attribute table at the bottom to see state data",
      "Notice how each state has population and area values",
    ],
    concepts: ["symbology", "layers", "attribute-table"],
  },
  {
    id: "heatmap",
    title: "Create an Earthquake Heatmap",
    difficulty: "intermediate",
    sampleDataset: "earthquakes",
    steps: [
      "Load the 'Earthquakes' sample dataset",
      "Open the Visualize panel (under Advanced Tools)",
      "Select 'Heatmap' as the visualization type",
      "Choose the earthquake layer as the data source",
      "Adjust the radius and intensity to see earthquake clusters",
    ],
    concepts: ["spatial-analysis", "symbology"],
  },
  {
    id: "buffer-analysis",
    title: "Buffer Analysis: What's Nearby?",
    difficulty: "intermediate",
    sampleDataset: "parks",
    steps: [
      "Load the 'City Parks' sample dataset",
      "Open the Analysis panel (under Advanced Tools)",
      "Select 'Buffer' as the operation",
      "Choose the parks layer and set distance to 500 meters",
      "Click 'Run' to see a zone around each park",
    ],
    concepts: ["buffer", "spatial-analysis", "layers"],
  },
  {
    id: "draw-and-measure",
    title: "Draw Features and Measure",
    difficulty: "beginner",
    sampleDataset: "parks",
    steps: [
      "Load the 'City Parks' sample dataset",
      "Open the Edit panel in the sidebar",
      "Select the parks layer as your target layer",
      "Use the polygon tool in the draw toolbar to outline an area",
      "Click the polygon to see its measurements (area, perimeter)",
    ],
    concepts: ["features", "geometry-types"],
  },
];
