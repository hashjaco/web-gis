"use client";

import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  RotateCcw,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface SandboxTask {
  id: string;
  label: string;
  hint: string;
}

const SANDBOX_TASKS: SandboxTask[] = [
  {
    id: "zoom",
    label: "Zoom into New York City",
    hint: "Use the search bar at the top to find 'New York' and fly there.",
  },
  {
    id: "basemap",
    label: "Switch to the satellite basemap",
    hint: "Click one of the basemap options at the bottom-right of the map.",
  },
  {
    id: "click-feature",
    label: "Click a park to see its properties",
    hint: "Click on the green park polygon to open a popup with attributes.",
  },
  {
    id: "open-layers",
    label: "Open the Layers panel",
    hint: "Click the Layers icon in the sidebar to see all loaded layers.",
  },
  {
    id: "draw-point",
    label: "Draw a point on the map",
    hint: "Select a layer in the Edit panel, then use the point tool in the draw toolbar.",
  },
  {
    id: "open-table",
    label: "Open the attribute table",
    hint: "Click the 'Attribute Table' bar at the bottom of the map view.",
  },
];

const SANDBOX_KEY = "shimgis-sandbox-tasks";
const SANDBOX_DISMISSED_KEY = "shimgis-sandbox-dismissed";

export function SandboxOverlay() {
  const [dismissed, setDismissed] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [completed, setCompleted] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = localStorage.getItem(SANDBOX_KEY);
      return stored ? new Set(JSON.parse(stored) as string[]) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (localStorage.getItem(SANDBOX_DISMISSED_KEY) === "true") {
        setDismissed(true);
      }
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SANDBOX_KEY, JSON.stringify([...completed]));
    } catch {
      /* noop */
    }
  }, [completed]);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(SANDBOX_DISMISSED_KEY, "true");
    } catch {
      /* noop */
    }
  };

  const handleReset = () => {
    setCompleted(new Set());
    setMinimized(false);
    try {
      localStorage.removeItem(SANDBOX_KEY);
      localStorage.removeItem(SANDBOX_DISMISSED_KEY);
    } catch {
      /* noop */
    }
  };

  const toggleTask = (id: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (dismissed) return null;

  const progress = Math.round(
    (completed.size / SANDBOX_TASKS.length) * 100,
  );
  const allDone = completed.size === SANDBOX_TASKS.length;

  return (
    <div className="absolute bottom-20 right-4 z-20 w-80 animate-fade-in-up rounded-xl border bg-popover shadow-2xl">
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <FlaskConical className="h-4 w-4 text-primary" />
        <span className="flex-1 text-xs font-semibold">
          Sandbox Challenge
        </span>
        <span className="text-[10px] font-medium text-muted-foreground">
          {completed.size}/{SANDBOX_TASKS.length}
        </span>
        <button
          type="button"
          onClick={() => setMinimized(!minimized)}
          className="rounded p-0.5 text-muted-foreground hover:bg-accent"
        >
          {minimized ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="rounded p-0.5 text-muted-foreground hover:bg-accent"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {!minimized && (
        <>
          <div className="mx-3 mt-2 h-1.5 rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {allDone && (
            <div className="mx-3 mt-2 rounded-md bg-green-500/10 p-2 text-center">
              <p className="text-xs font-medium text-green-600 dark:text-green-400">
                All tasks completed! You now know the GIS basics.
              </p>
            </div>
          )}

          <div className="max-h-64 space-y-0.5 overflow-y-auto p-2">
            {SANDBOX_TASKS.map((task) => {
              const done = completed.has(task.id);
              return (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => toggleTask(task.id)}
                  className={cn(
                    "flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent/50",
                    done && "opacity-60",
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                      done
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground",
                    )}
                  >
                    {done && <CheckCircle2 className="h-3 w-3" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-xs font-medium",
                        done && "line-through",
                      )}
                    >
                      {task.label}
                    </p>
                    {!done && (
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {task.hint}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between border-t px-3 py-2">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="text-[10px] text-muted-foreground transition-colors hover:text-foreground"
            >
              Hide challenge
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function useSandboxMode() {
  const [active, setActive] = useState(false);

  const startSandbox = async () => {
    const { useLayerStore } = await import("@/features/layers/store");
    const { getDefaultStyle } = await import("@/features/layers/palette");

    try {
      const response = await fetch("/samples/parks.geojson");
      if (!response.ok) return;
      const geojson = await response.json();

      const layers = useLayerStore.getState().layers;
      const alreadyLoaded = layers.some((l) => l.name === "Sandbox: City Parks");
      if (!alreadyLoaded) {
        useLayerStore.getState().addLayer({
          id: crypto.randomUUID(),
          name: "Sandbox: City Parks",
          sourceType: "geojson",
          data: geojson,
          style: getDefaultStyle(layers.length, geojson.features?.[0]?.geometry?.type),
          order: layers.length,
          isVisible: true,
          opacity: 100,
        });
      }
    } catch {
      /* noop */
    }

    try {
      localStorage.removeItem("shimgis-sandbox-dismissed");
    } catch {
      /* noop */
    }

    setActive(true);
  };

  return { active, startSandbox, setActive };
}
