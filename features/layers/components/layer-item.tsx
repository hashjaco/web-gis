"use client";

import { Eye, EyeOff, GripVertical, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useLayerStore } from "../store";
import type { LayerConfig } from "../types";
import { EditLayerForm } from "./edit-layer-form";

interface LayerItemProps {
  layer: LayerConfig;
  isActive: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: Partial<LayerConfig>) => Promise<unknown>;
}

export function LayerItem({ layer, isActive, onSelect, onDelete, onUpdate }: LayerItemProps) {
  const toggleVisibility = useLayerStore((s) => s.toggleVisibility);
  const setOpacity = useLayerStore((s) => s.setOpacity);
  const [editing, setEditing] = useState(false);

  const style = (layer.style ?? {}) as Record<string, unknown>;
  const paint = (style.paint ?? {}) as Record<string, unknown>;
  const color = (paint["fill-color"] as string) ?? "#088";

  if (editing) {
    return (
      <EditLayerForm
        layer={layer}
        onSave={onUpdate}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-md border px-2 py-1.5 transition-colors",
        isActive
          ? "border-primary bg-primary/10"
          : "bg-card hover:bg-accent/50",
      )}
    >
      <GripVertical className="h-3.5 w-3.5 shrink-0 cursor-grab text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => toggleVisibility(layer.id)}
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            {layer.isVisible ? (
              <Eye className="h-3.5 w-3.5" />
            ) : (
              <EyeOff className="h-3.5 w-3.5" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent>{layer.isVisible ? "Hide layer" : "Show layer"}</TooltipContent>
      </Tooltip>

      <div
        className="h-3 w-3 shrink-0 rounded-sm border"
        style={{ backgroundColor: color }}
      />

      <button
        type="button"
        onClick={() => onSelect(layer.id)}
        className="flex-1 truncate text-left text-sm"
      >
        {layer.name}
      </button>

      <input
        type="range"
        min={0}
        max={100}
        value={layer.opacity}
        onChange={(e) => setOpacity(layer.id, Number(e.target.value))}
        className="hidden h-1 w-16 cursor-pointer group-hover:block"
      />

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="shrink-0 text-muted-foreground opacity-0 hover:text-foreground group-hover:opacity-100"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Edit layer</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => onDelete(layer.id)}
            className="shrink-0 text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Delete layer</TooltipContent>
      </Tooltip>
    </div>
  );
}
