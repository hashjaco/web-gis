"use client";

import { cn } from "@/lib/utils";
import { COLOR_RAMPS } from "../utils";

interface ColorRampPickerProps {
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export function ColorRampPicker({
  selectedIndex,
  onSelect,
}: ColorRampPickerProps) {
  return (
    <div className="space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">
        Color Ramp
      </span>
      <div className="space-y-1">
        {COLOR_RAMPS.map((ramp, idx) => (
          <button
            key={ramp.join("-")}
            type="button"
            onClick={() => onSelect(idx)}
            className={cn(
              "flex h-5 w-full overflow-hidden rounded border transition-all",
              selectedIndex === idx && "ring-2 ring-ring ring-offset-1",
            )}
          >
            {ramp.map((color) => (
              <div
                key={color}
                className="flex-1"
                style={{ backgroundColor: color }}
              />
            ))}
          </button>
        ))}
      </div>
    </div>
  );
}
