"use client";

import { Layers, Plus } from "lucide-react";
import { useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { useLayers } from "../hooks/use-layers";
import { getDefaultStyle } from "../palette";
import { useLayerStore } from "../store";
import type { LayerConfig } from "../types";
import { AddLayerForm } from "./add-layer-form";
import { LayerItem } from "./layer-item";

export function LayerPanel() {
  const { layers, createLayer, updateLayer, deleteLayer } = useLayers();
  const activeLayerId = useLayerStore((s) => s.activeLayerId);
  const setActiveLayer = useLayerStore((s) => s.setActiveLayer);
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="flex h-full w-full flex-col bg-background">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4" />
          <h2 className="text-sm font-semibold">Layers</h2>
          <HelpTooltip
            title="Layers"
            description="Layers are stacked collections of map data. Each layer contains features (points, lines, or polygons) that you can style, show/hide, and edit independently. Think of them like transparent sheets stacked on top of each other."
            arcgisEquivalent="Table of Contents / Layer List"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {layers.length} layer{layers.length !== 1 ? "s" : ""}
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setShowForm(!showForm)}
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <Plus className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Add new layer</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {showForm && (
        <AddLayerForm
          onSubmit={(data: Partial<LayerConfig>) =>
            createLayer({ ...data, style: getDefaultStyle(layers.length) })
          }
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="flex-1 space-y-1 overflow-y-auto p-2">
        {layers.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-2 py-8 text-center">
            <Layers className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-xs font-medium text-muted-foreground">
              No layers yet
            </p>
            <p className="text-[11px] text-muted-foreground/70">
              Layers hold your map data. Import a file or click + above to
              create an empty layer and start drawing.
            </p>
          </div>
        ) : (
          layers.map((layer) => (
            <LayerItem
              key={layer.id}
              layer={layer}
              isActive={activeLayerId === layer.id}
              onSelect={setActiveLayer}
              onDelete={deleteLayer}
              onUpdate={updateLayer}
            />
          ))
        )}
      </div>
    </div>
  );
}
