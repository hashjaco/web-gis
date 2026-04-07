"use client";

import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useLayerStore } from "../store";

export function LegendPanel() {
  const layers = useLayerStore((s) => s.layers);
  const visibleLayers = layers.filter((l) => l.isVisible);

  if (visibleLayers.length === 0) return null;

  return (
    <div className="absolute bottom-6 left-4 z-10 rounded-lg border bg-background/90 p-3 shadow-sm backdrop-blur-sm">
      <div className="mb-2 flex items-center gap-1">
        <h3 className="text-xs font-semibold">Legend</h3>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-3 w-3 cursor-help text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent>Color key for visible map layers</TooltipContent>
        </Tooltip>
      </div>
      <div className="space-y-1.5">
        {visibleLayers.map((layer) => {
          const style = (layer.style ?? {}) as Record<string, unknown>;
          const paint = (style.paint ?? {}) as Record<string, unknown>;
          const color = (paint["fill-color"] as string) ?? "#088";

          return (
            <div key={layer.id} className="flex items-center gap-2">
              <div
                className="h-3 w-4 rounded-sm border"
                style={{ backgroundColor: color, opacity: layer.opacity / 100 }}
              />
              <span className="text-xs">{layer.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
