"use client";

import {
  Circle,
  ImageIcon,
  Lock,
  MapPin,
  Minus,
  MousePointer,
  Pencil,
  Pentagon,
  RectangleHorizontal,
  Spline,
  Type,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useUserPlan } from "@/lib/auth/use-user-plan";
import type { DrawMode } from "../types";

interface DrawToolbarProps {
  drawMode: DrawMode;
  annotationMode: "text" | "image" | null;
  onModeChange: (mode: DrawMode) => void;
  onAnnotation: (type: "text" | "image") => void;
}

const basicTools: { mode: DrawMode; icon: React.ElementType; label: string; tip: string }[] = [
  { mode: "simple_select", icon: MousePointer, label: "Select", tip: "Select and edit features" },
  { mode: "draw_point", icon: Circle, label: "Point", tip: "Draw a point feature" },
  { mode: "draw_line_string", icon: Minus, label: "Line", tip: "Draw a line feature" },
  { mode: "draw_polygon", icon: Pentagon, label: "Polygon", tip: "Draw a polygon feature" },
];

const proTools: { mode: DrawMode; icon: React.ElementType; label: string; tip: string }[] = [
  { mode: "draw_circle", icon: Spline, label: "Circle", tip: "Draw a circle (click center, then radius)" },
  { mode: "draw_rectangle", icon: RectangleHorizontal, label: "Rectangle", tip: "Draw a rectangle (click two corners)" },
  { mode: "draw_freehand", icon: Pencil, label: "Freehand", tip: "Draw freehand by clicking and dragging" },
  { mode: "draw_marker", icon: MapPin, label: "Marker", tip: "Place a styled marker on the map" },
];

const annotationTools: { type: "text" | "image"; icon: React.ElementType; label: string; tip: string }[] = [
  { type: "text", icon: Type, label: "Text", tip: "Click the map to place a text label" },
  { type: "image", icon: ImageIcon, label: "Image", tip: "Click the map to place an image" },
];

export function DrawToolbar({ drawMode, annotationMode, onModeChange, onAnnotation }: DrawToolbarProps) {
  const { isPro } = useUserPlan();

  return (
    <div className="absolute top-4 left-4 z-10 flex flex-col gap-1 rounded-lg border bg-background/90 p-1 shadow-sm backdrop-blur-sm">
      {basicTools.map((tool) => (
        <Tooltip key={tool.mode}>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => onModeChange(tool.mode)}
              className={cn(
                "rounded-md p-2 transition-colors",
                drawMode === tool.mode && !annotationMode
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <tool.icon className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">{tool.tip}</TooltipContent>
        </Tooltip>
      ))}

      <div className="mx-1 border-t" />

      {proTools.map((tool) => (
        <Tooltip key={tool.mode}>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => {
                if (!isPro) return;
                onModeChange(tool.mode);
              }}
              className={cn(
                "relative rounded-md p-2 transition-colors",
                !isPro
                  ? "cursor-not-allowed opacity-40"
                  : drawMode === tool.mode && !annotationMode
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <tool.icon className="h-4 w-4" />
              {!isPro && <Lock className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 text-muted-foreground" />}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {isPro ? tool.tip : `${tool.label} — Upgrade to Pro`}
          </TooltipContent>
        </Tooltip>
      ))}

      <div className="mx-1 border-t" />

      {annotationTools.map((tool) => (
        <Tooltip key={tool.type}>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => {
                if (!isPro) return;
                onAnnotation(tool.type);
              }}
              className={cn(
                "relative rounded-md p-2 transition-colors",
                !isPro
                  ? "cursor-not-allowed opacity-40"
                  : annotationMode === tool.type
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <tool.icon className="h-4 w-4" />
              {!isPro && <Lock className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 text-muted-foreground" />}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {isPro ? tool.tip : `${tool.label} — Upgrade to Pro`}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
