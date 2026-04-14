"use client";

import {
  BookOpen,
  CircleDot,
  Database,
  Hexagon,
  Loader2,
  Minus,
  Shapes,
} from "lucide-react";
import { useState } from "react";
import { useLayerStore } from "@/features/layers/store";
import { getDefaultStyle } from "@/features/layers/palette";
import { SAMPLE_DATASETS, type SampleDataset } from "../sample-datasets";

const GEOMETRY_ICONS: Record<string, React.ElementType> = {
  Point: CircleDot,
  LineString: Minus,
  Polygon: Hexagon,
  Mixed: Shapes,
};

interface SampleDataSectionProps {
  onLoaded?: () => void;
}

export function SampleDataSection({ onLoaded }: SampleDataSectionProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<Set<string>>(new Set());

  const handleLoad = async (dataset: SampleDataset) => {
    setLoading(dataset.id);
    try {
      const response = await fetch(`/samples/${dataset.fileName}`);
      if (!response.ok) throw new Error("Failed to fetch sample data");
      const geojson = await response.json();

      const layers = useLayerStore.getState().layers;
      const firstGeomType = geojson.features?.[0]?.geometry?.type;
      const style = getDefaultStyle(layers.length, firstGeomType);
      useLayerStore.getState().addLayer({
        id: crypto.randomUUID(),
        name: dataset.name,
        sourceType: "geojson",
        data: geojson,
        style,
        order: layers.length,
        isVisible: true,
        opacity: 100,
      });

      setLoaded((prev) => new Set([...prev, dataset.id]));
      onLoaded?.();
    } catch {
      /* noop — toast or inline error could go here */
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Database className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Sample Datasets</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Load pre-built datasets to explore GIS tools without needing your own
        data.
      </p>
      <div className="space-y-2">
        {SAMPLE_DATASETS.map((dataset) => {
          const Icon = GEOMETRY_ICONS[dataset.geometryType] ?? Shapes;
          const isLoaded = loaded.has(dataset.id);
          const isLoading = loading === dataset.id;

          return (
            <div
              key={dataset.id}
              className="rounded-lg border bg-card p-3 transition-colors hover:border-primary/30"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-semibold">{dataset.name}</h4>
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {dataset.featureCount} features
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                    {dataset.description}
                  </p>
                  {dataset.suggestedExercises.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {dataset.suggestedExercises.map((ex) => (
                        <span
                          key={ex}
                          className="inline-flex items-center gap-0.5 rounded bg-accent/60 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                        >
                          <BookOpen className="h-2.5 w-2.5" />
                          {ex}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleLoad(dataset)}
                  disabled={isLoading || isLoaded}
                  className="shrink-0 rounded-md bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : isLoaded ? (
                    "Loaded"
                  ) : (
                    "Load"
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
