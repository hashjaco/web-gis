"use client";

import { Globe } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import {
  GeolocateControl,
  NavigationControl,
  ScaleControl,
  useControl,
} from "react-map-gl/maplibre";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMapStore } from "../store";

interface MapControlPortalProps {
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  children: React.ReactNode;
}

function MapControlPortal({ position = "top-right", children }: MapControlPortalProps) {
  const [container] = useState(() => {
    const el = document.createElement("div");
    el.className = "maplibregl-ctrl";
    return el;
  });

  useControl(
    () => ({
      onAdd: () => container,
      onRemove: () => container.remove(),
    }),
    { position },
  );

  return createPortal(children, container);
}

function ZoomToWorldButton() {
  const setViewState = useMapStore((s) => s.setViewState);

  const handleClick = () => {
    setViewState({
      longitude: 0,
      latitude: 20,
      zoom: 1,
      bearing: 0,
      pitch: 0,
    });
  };

  return (
    <MapControlPortal position="top-right">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={handleClick}
            className="flex h-[29px] w-[29px] items-center justify-center rounded bg-background shadow transition-colors hover:bg-accent"
          >
            <Globe className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="left">Zoom to full extent</TooltipContent>
      </Tooltip>
    </MapControlPortal>
  );
}

export function MapControls() {
  return (
    <>
      <NavigationControl position="top-right" />
      <GeolocateControl position="top-right" />
      <ZoomToWorldButton />
      <ScaleControl position="bottom-left" />
    </>
  );
}
