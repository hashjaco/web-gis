"use client";

import { BarChart3, Loader2 } from "lucide-react";
import { useState } from "react";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { useAnalysis } from "../hooks/use-analysis";
import { useClientAnalysis } from "../hooks/use-client-analysis";
import type { AnalysisOperation, ClientAnalysisOperation } from "../types";
import { AnalyticsDashboard } from "./analytics-dashboard";
import { AnalysisResults } from "./analysis-results";
import { StatisticsDisplay } from "./statistics-display";

type AllOperations = AnalysisOperation | ClientAnalysisOperation;

const SERVER_OPERATIONS: {
  value: AnalysisOperation;
  label: string;
  description: string;
}[] = [
  { value: "buffer", label: "Buffer", description: "Create a buffer zone around features" },
  { value: "intersect", label: "Intersect", description: "Find overlapping areas between layers" },
  { value: "union", label: "Union", description: "Merge all features into one" },
  { value: "within", label: "Within", description: "Find features within a polygon" },
];

const CLIENT_OPERATIONS: {
  value: ClientAnalysisOperation;
  label: string;
  description: string;
}[] = [
  { value: "voronoi", label: "Voronoi", description: "Create Voronoi polygons from points" },
  { value: "tin", label: "TIN", description: "Triangulated irregular network" },
  { value: "dbscan", label: "DBSCAN Cluster", description: "Density-based spatial clustering" },
  { value: "kmeans", label: "K-Means Cluster", description: "Partition points into k groups" },
  { value: "convex-hull", label: "Convex Hull", description: "Smallest convex polygon enclosing features" },
  { value: "dissolve", label: "Dissolve", description: "Merge polygons by attribute" },
  { value: "centroid", label: "Centroids", description: "Calculate center points of features" },
  { value: "simplify", label: "Simplify", description: "Reduce vertex count preserving shape" },
  { value: "statistics", label: "Statistics", description: "Compute spatial statistics for a layer" },
];

const ALL_OPERATIONS = [...SERVER_OPERATIONS, ...CLIENT_OPERATIONS];

const isServerOp = (op: string): op is AnalysisOperation =>
  SERVER_OPERATIONS.some((o) => o.value === op);

const needsTargetLayer = (op: string) =>
  op === "intersect" || op === "within";
const needsDistance = (op: string) =>
  op === "buffer" || op === "dbscan";
const needsClusters = (op: string) =>
  op === "kmeans";
const needsTolerance = (op: string) =>
  op === "simplify";

interface SpatialQueryPanelProps {
  layers: { id: string; name: string }[];
}

export function SpatialQueryPanel({ layers }: SpatialQueryPanelProps) {
  const [operation, setOperation] = useState<AllOperations>("buffer");
  const [selectedLayer, setSelectedLayer] = useState(layers[0]?.id ?? "");
  const [targetLayer, setTargetLayer] = useState(layers[1]?.id ?? layers[0]?.id ?? "");
  const [distance, setDistance] = useState(1000);
  const [clusters, setClusters] = useState(5);
  const [tolerance, setTolerance] = useState(0.001);

  const serverAnalysis = useAnalysis();
  const clientAnalysis = useClientAnalysis();

  const loading = serverAnalysis.loading || clientAnalysis.loading;
  const error = serverAnalysis.error || clientAnalysis.error;
  const result = serverAnalysis.result || clientAnalysis.result;

  const handleRun = () => {
    if (isServerOp(operation)) {
      serverAnalysis.runAnalysis({
        operation,
        layer: selectedLayer,
        targetLayer: needsTargetLayer(operation) ? targetLayer : undefined,
        distance: operation === "buffer" ? distance : undefined,
        distanceUnit: "meters",
      });
    } else {
      clientAnalysis.run({
        operation,
        layerId: selectedLayer,
        distance: needsDistance(operation) ? distance / 1000 : undefined,
        clusters: needsClusters(operation) ? clusters : undefined,
        tolerance: needsTolerance(operation) ? tolerance : undefined,
        minPoints: operation === "dbscan" ? 3 : undefined,
      });
    }
  };

  const handleClear = () => {
    serverAnalysis.clearResult();
    clientAnalysis.clearResult();
  };

  return (
    <div className="flex h-full w-full flex-col bg-background">
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <BarChart3 className="h-4 w-4" />
        <h2 className="text-sm font-semibold">Analyze</h2>
        <HelpTooltip
          title="Spatial Analysis"
          description="Run geographic calculations on your data. For example, create buffer zones around features, find where layers overlap, or cluster nearby points into groups."
          arcgisEquivalent="Analysis tools / Geoprocessing"
        />
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        <div>
          <label
            htmlFor="operation"
            className="mb-0.5 block text-xs font-medium text-muted-foreground"
          >
            Operation
          </label>
          <select
            id="operation"
            value={operation}
            onChange={(e) => setOperation(e.target.value as AllOperations)}
            className="w-full rounded border bg-background px-2 py-1.5 text-sm"
          >
            <optgroup label="Server-side">
              {SERVER_OPERATIONS.map((op) => (
                <option key={op.value} value={op.value}>{op.label}</option>
              ))}
            </optgroup>
            <optgroup label="Browser-side">
              {CLIENT_OPERATIONS.map((op) => (
                <option key={op.value} value={op.value}>{op.label}</option>
              ))}
            </optgroup>
          </select>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {ALL_OPERATIONS.find((o) => o.value === operation)?.description}
          </p>
        </div>

        <div>
          <label
            htmlFor="layer-select"
            className="mb-0.5 block text-xs font-medium text-muted-foreground"
          >
            Layer
          </label>
          <select
            id="layer-select"
            value={selectedLayer}
            onChange={(e) => setSelectedLayer(e.target.value)}
            className="w-full rounded border bg-background px-2 py-1.5 text-sm"
          >
            {layers.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>

        {needsTargetLayer(operation) && (
          <div>
            <label
              htmlFor="target-layer-select"
              className="mb-0.5 block text-xs font-medium text-muted-foreground"
            >
              Target Layer
            </label>
            <select
              id="target-layer-select"
              value={targetLayer}
              onChange={(e) => setTargetLayer(e.target.value)}
              className="w-full rounded border bg-background px-2 py-1.5 text-sm"
            >
              {layers.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
        )}

        {needsDistance(operation) && (
          <div>
            <label
              htmlFor="buffer-distance"
              className="mb-0.5 block text-xs font-medium text-muted-foreground"
            >
              Distance {operation === "buffer" ? "(meters)" : "(km)"}
            </label>
            <input
              id="buffer-distance"
              type="number"
              min={0.001}
              step={operation === "dbscan" ? 0.1 : 1}
              value={distance}
              onChange={(e) => setDistance(Number(e.target.value))}
              className="w-full rounded border bg-background px-2 py-1.5 text-sm"
            />
          </div>
        )}

        {needsClusters(operation) && (
          <div>
            <label
              htmlFor="cluster-count"
              className="mb-0.5 block text-xs font-medium text-muted-foreground"
            >
              Number of Clusters
            </label>
            <input
              id="cluster-count"
              type="number"
              min={2}
              max={50}
              value={clusters}
              onChange={(e) => setClusters(Number(e.target.value))}
              className="w-full rounded border bg-background px-2 py-1.5 text-sm"
            />
          </div>
        )}

        {needsTolerance(operation) && (
          <div>
            <label
              htmlFor="simplify-tolerance"
              className="mb-0.5 block text-xs font-medium text-muted-foreground"
            >
              Tolerance (degrees)
            </label>
            <input
              id="simplify-tolerance"
              type="number"
              min={0.0001}
              step={0.0001}
              value={tolerance}
              onChange={(e) => setTolerance(Number(e.target.value))}
              className="w-full rounded border bg-background px-2 py-1.5 text-sm"
            />
          </div>
        )}

        {error && (
          <p className="rounded bg-destructive/10 px-2 py-1 text-xs text-destructive">
            {error}
          </p>
        )}

        {clientAnalysis.statistics && (
          <StatisticsDisplay stats={clientAnalysis.statistics} />
        )}

        {result && <AnalysisResults result={result} />}

        {result && "features" in result && (
          <AnalyticsDashboard data={result} title="Analysis Results" />
        )}
      </div>

      <div className="flex gap-2 border-t p-3">
        <button
          type="button"
          onClick={handleRun}
          disabled={loading}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
        >
          {loading && <Loader2 className="h-3 w-3 animate-spin" />}
          Run
        </button>
        {result && (
          <button
            type="button"
            onClick={handleClear}
            className="rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
