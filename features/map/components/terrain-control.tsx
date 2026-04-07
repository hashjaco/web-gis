"use client";

import { Building2, Mountain } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useMapStore } from "../store";

const hasMapTilerKey = !!process.env.NEXT_PUBLIC_MAPTILER_KEY;

export function TerrainControl() {
  const terrainEnabled = useMapStore((s) => s.terrainEnabled);
  const setTerrainEnabled = useMapStore((s) => s.setTerrainEnabled);
  const buildings3DEnabled = useMapStore((s) => s.buildings3DEnabled);
  const setBuildings3DEnabled = useMapStore((s) => s.setBuildings3DEnabled);

  const terrainLabel = !hasMapTilerKey
    ? "Requires NEXT_PUBLIC_MAPTILER_KEY"
    : terrainEnabled
      ? "Disable 3D Terrain"
      : "Enable 3D Terrain";

  const buildingsLabel = !hasMapTilerKey
    ? "Requires NEXT_PUBLIC_MAPTILER_KEY"
    : buildings3DEnabled
      ? "Disable 3D Buildings"
      : "Enable 3D Buildings";

  return (
    <div className="absolute top-48 right-2.5 z-10 flex flex-col gap-1 rounded-lg border bg-background/90 p-1 shadow-sm backdrop-blur-sm">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => hasMapTilerKey && setTerrainEnabled(!terrainEnabled)}
            disabled={!hasMapTilerKey}
            className={cn(
              "rounded-md p-1.5 transition-colors",
              !hasMapTilerKey && "cursor-not-allowed opacity-40",
              terrainEnabled
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <Mountain className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="left">{terrainLabel}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => hasMapTilerKey && setBuildings3DEnabled(!buildings3DEnabled)}
            disabled={!hasMapTilerKey}
            className={cn(
              "rounded-md p-1.5 transition-colors",
              !hasMapTilerKey && "cursor-not-allowed opacity-40",
              buildings3DEnabled
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <Building2 className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="left">{buildingsLabel}</TooltipContent>
      </Tooltip>
    </div>
  );
}
