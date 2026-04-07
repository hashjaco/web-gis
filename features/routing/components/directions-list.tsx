"use client";

import type { RouteStep } from "../types";

interface DirectionsListProps {
  steps: RouteStep[];
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)} sec`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}

export function DirectionsList({ steps }: DirectionsListProps) {
  return (
    <div className="space-y-1">
      {steps.map((step, idx) => (
        <div
          key={`${idx}-${step.name}`}
          className="flex items-start gap-2 rounded px-2 py-1.5 text-xs hover:bg-accent/50"
        >
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {idx + 1}
          </span>
          <div className="flex-1">
            <p>{step.instruction || step.name || "Continue"}</p>
            <p className="text-muted-foreground">
              {formatDistance(step.distance)} &middot;{" "}
              {formatDuration(step.duration)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
