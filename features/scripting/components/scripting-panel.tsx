"use client";

import { Terminal, Play } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";

const ScriptConsole = dynamic(
  () => import("./script-console").then((m) => m.ScriptConsole),
  { ssr: false },
);

export function ScriptingPanel() {
  const [showConsole, setShowConsole] = useState(false);

  return (
    <>
      <div className="flex h-full w-full flex-col bg-background">
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <Terminal className="h-4 w-4" />
          <h2 className="text-sm font-semibold">Scripting</h2>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-3">
          <p className="text-xs text-muted-foreground">
            Write and run JavaScript scripts with full access to the GIS API.
            Use Turf.js spatial operations, fetch layer data, and automate
            geoprocessing tasks.
          </p>

          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Available APIs
            </p>
            {[
              { fn: "gis.fetchFeatures(layer)", desc: "Load layer features" },
              { fn: "gis.buffer(geojson, dist)", desc: "Buffer geometry" },
              { fn: "gis.area(feature)", desc: "Calculate area (m²)" },
              { fn: "gis.length(feature)", desc: "Calculate length (km)" },
              { fn: "gis.centroid(feature)", desc: "Get centroid point" },
              { fn: "gis.union(features)", desc: "Union polygons" },
              { fn: "gis.dissolve(fc, prop)", desc: "Dissolve by attribute" },
              { fn: "gis.simplify(geojson, t)", desc: "Simplify geometry" },
              { fn: "gis.log(value)", desc: "Print to output" },
            ].map((api) => (
              <div key={api.fn} className="rounded bg-muted/50 px-2 py-1.5">
                <code className="text-xs font-medium">{api.fn}</code>
                <p className="text-xs text-muted-foreground">{api.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t p-3">
          <button
            type="button"
            onClick={() => setShowConsole(true)}
            className="flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
          >
            <Play className="h-3 w-3" />
            Open Console
          </button>
        </div>
      </div>

      {showConsole && <ScriptConsole onClose={() => setShowConsole(false)} />}
    </>
  );
}
