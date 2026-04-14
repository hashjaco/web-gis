"use client";

import {
  BarChart3,
  CircleDot,
  Flame,
  Hexagon,
  Loader2,
  MoveUpRight,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { useLayerStore } from "@/features/layers/store";
import { useVisualizationStore, type VisualizationType } from "../store";
import { usePointCloud } from "../hooks/use-point-cloud";

const VIZ_OPTIONS: { type: VisualizationType; label: string; icon: React.ElementType }[] = [
  { type: "none", label: "None", icon: XCircle },
  { type: "heatmap", label: "Heatmap", icon: Flame },
  { type: "hexbin", label: "Hex Bins", icon: Hexagon },
  { type: "arc", label: "Arc Flow", icon: MoveUpRight },
  { type: "scatterplot", label: "Scatterplot", icon: CircleDot },
];

export function VizPanel() {
  const vizType = useVisualizationStore((s) => s.vizType);
  const setVizType = useVisualizationStore((s) => s.setVizType);
  const vizLayerId = useVisualizationStore((s) => s.vizLayerId);
  const setVizLayerId = useVisualizationStore((s) => s.setVizLayerId);
  const layers = useLayerStore((s) => s.layers);
  const pointCloud = usePointCloud();
  const setPointCloudLayer = useVisualizationStore((s) => s.setPointCloudLayer);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPointCloudLayer(pointCloud.layer);
    return () => setPointCloudLayer(null);
  }, [pointCloud.layer, setPointCloudLayer]);

  return (
    <div className="flex h-full w-full flex-col bg-background">
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <BarChart3 className="h-4 w-4" />
        <h2 className="text-sm font-semibold">Visualize Data</h2>
        <HelpTooltip
          title="Data Visualization"
          description="Transform your point data into visual patterns. Heatmaps show density, hex bins aggregate counts, arcs show flow, and scatterplots render individual points. Choose a layer and a style to see your data differently."
          arcgisEquivalent="Change Style / Smart Mapping"
        />
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        <div>
          <label
            htmlFor="viz-layer"
            className="mb-0.5 block text-xs font-medium text-muted-foreground"
          >
            Data Layer
          </label>
          <select
            id="viz-layer"
            value={vizLayerId ?? ""}
            onChange={(e) => setVizLayerId(e.target.value || null)}
            className="w-full rounded border bg-background px-2 py-1.5 text-sm"
          >
            <option value="">Select a layer...</option>
            {layers.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">
            Visualization Type
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {VIZ_OPTIONS.map((opt) => (
              <button
                key={opt.type}
                type="button"
                onClick={() => setVizType(opt.type)}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2.5 py-2 text-xs font-medium transition-colors",
                  vizType === opt.type
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <opt.icon className="h-3.5 w-3.5" />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {vizType !== "none" && !vizLayerId && (
          <p className="rounded bg-yellow-500/10 px-2 py-1.5 text-xs text-yellow-600 dark:text-yellow-400">
            Choose a layer above first. Need data? Import a file or load a
            sample dataset from the Import panel.
          </p>
        )}

        {vizType === "heatmap" && (
          <p className="text-xs text-muted-foreground">
            Shows point density as a continuous color gradient. Works best with point data.
          </p>
        )}
        {vizType === "hexbin" && (
          <p className="text-xs text-muted-foreground">
            Aggregates points into hexagonal bins with 3D elevation showing counts.
          </p>
        )}
        {vizType === "arc" && (
          <p className="text-xs text-muted-foreground">
            Connects sequential points with colored arcs showing flow direction.
          </p>
        )}
        {vizType === "scatterplot" && (
          <p className="text-xs text-muted-foreground">
            Renders each point as a filled circle with configurable size.
          </p>
        )}

        <div className="border-t pt-3">
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">
            Point Cloud (LAS/LAZ)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".las,.laz"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) pointCloud.loadFile(file);
            }}
          />
          {pointCloud.data ? (
            <div className="space-y-2">
              <div className="rounded bg-muted/50 px-2 py-1.5">
                <p className="text-xs font-medium">
                  {pointCloud.data.count.toLocaleString()} points loaded
                </p>
              </div>
              <div>
                <label
                  htmlFor="point-size"
                  className="mb-0.5 block text-xs text-muted-foreground"
                >
                  Point Size: {pointCloud.pointSize}
                </label>
                <input
                  id="point-size"
                  type="range"
                  min={1}
                  max={10}
                  value={pointCloud.pointSize}
                  onChange={(e) => pointCloud.setPointSize(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <button
                type="button"
                onClick={pointCloud.clear}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3 w-3" />
                Remove point cloud
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={pointCloud.loading}
              className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed px-3 py-3 text-xs text-muted-foreground hover:bg-accent"
            >
              {pointCloud.loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              {pointCloud.loading ? "Loading..." : "Upload LAS/LAZ file"}
            </button>
          )}
          {pointCloud.error && (
            <p className="mt-1 rounded bg-destructive/10 px-2 py-1 text-xs text-destructive">
              {pointCloud.error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
