"use client";

import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useMapStore } from "../store";
import { basemapStyles } from "../styles";

export function BasemapSwitcher() {
  const activeBasemap = useMapStore((s) => s.activeBasemap);
  const setActiveBasemap = useMapStore((s) => s.setActiveBasemap);

  return (
    <div className="absolute bottom-6 right-4 z-10 flex gap-1 rounded-lg border bg-background/90 p-1 shadow-sm backdrop-blur-sm">
      {basemapStyles.map((style) => (
        <Tooltip key={style.id}>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => setActiveBasemap(style.id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                activeBasemap === style.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              {style.name}
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">Switch to {style.name} basemap</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
