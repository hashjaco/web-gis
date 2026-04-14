"use client";

import * as turf from "@turf/turf";
import {
  ChevronDown,
  ChevronRight,
  Clock,
  Crosshair,
  Lock,
  Paintbrush,
  Palette,
  Pencil,
  Plus,
  Ruler,
  RotateCcw,
  Target,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { useLayerStore } from "@/features/layers/store";
import { apiFetch } from "@/lib/api/client";
import { useUserPlan } from "@/lib/auth/use-user-plan";
import { useEditingStore } from "../store";
import { useFeatures } from "../hooks/use-features";
import type { GeoFeature } from "../types";

function Section({
  title,
  icon: Icon,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon: React.ElementType;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold hover:bg-accent/50"
      >
        {open ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        {title}
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}

function TargetLayerSection() {
  const layers = useLayerStore((s) => s.layers);
  const activeLayerId = useLayerStore((s) => s.activeLayerId);
  const activeLayer = layers.find((l) => l.id === activeLayerId);

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        New features will be added to the active layer.
      </p>
      {activeLayer ? (
        <p className="text-xs text-muted-foreground">
          Drawing to:{" "}
          <span className="font-medium text-foreground">
            {activeLayer.name}
          </span>
        </p>
      ) : (
        <p className="text-xs text-muted-foreground italic">
          No layer selected. Select a layer in the Layers panel to start drawing.
        </p>
      )}
    </div>
  );
}

function FeaturePropertiesSection() {
  const selectedFeatures = useEditingStore((s) => s.selectedFeatures);
  const clearSelection = useEditingStore((s) => s.clearSelection);
  const feature = selectedFeatures[0] ?? null;
  const { updateFeature, deleteFeature } = useFeatures();

  const [properties, setProperties] = useState<Record<string, unknown>>({});
  const [newKey, setNewKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (feature) {
      setProperties({ ...feature.properties });
      setConfirmDelete(false);
    } else {
      setProperties({});
    }
  }, [feature]);

  if (!feature) {
    return (
      <p className="text-xs text-muted-foreground">
        Select a feature on the map to view and edit its properties.
      </p>
    );
  }

  const editableEntries = Object.entries(properties).filter(
    ([key]) => !key.startsWith("_") && !STYLE_KEYS.has(key),
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const clean = Object.fromEntries(
        Object.entries(properties).filter(([key]) => !key.startsWith("_")),
      );
      await updateFeature(feature.id, { properties: clean });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    try {
      await deleteFeature(feature.id);
      clearSelection();
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleAddField = () => {
    const key = newKey.trim();
    if (key && !(key in properties)) {
      setProperties((prev) => ({ ...prev, [key]: "" }));
      setNewKey("");
    }
  };

  const handleRemoveField = (key: string) => {
    setProperties((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Feature <span className="font-mono">{feature.id.slice(0, 8)}...</span>
      </p>

      <div className="max-h-48 space-y-1.5 overflow-y-auto">
        {editableEntries.length === 0 ? (
          <p className="text-xs italic text-muted-foreground">
            No properties
          </p>
        ) : (
          editableEntries.map(([key, value]) => (
            <div key={key} className="flex items-end gap-1">
              <div className="flex-1">
                <label
                  htmlFor={`panel-attr-${key}`}
                  className="mb-0.5 block text-xs font-medium text-muted-foreground"
                >
                  {key}
                </label>
                <input
                  id={`panel-attr-${key}`}
                  type="text"
                  value={String(value ?? "")}
                  onChange={(e) =>
                    setProperties((prev) => ({
                      ...prev,
                      [key]: e.target.value,
                    }))
                  }
                  className="w-full rounded-md border bg-background px-2 py-1 text-xs focus:ring-1 focus:ring-ring focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemoveField(key)}
                className="mb-0.5 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                title="Remove field"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-1.5">
        <input
          type="text"
          placeholder="New field"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddField()}
          className="flex-1 rounded-md border bg-background px-2 py-1 text-xs focus:ring-1 focus:ring-ring focus:outline-none"
        />
        <button
          type="button"
          onClick={handleAddField}
          disabled={!newKey.trim()}
          className="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground disabled:opacity-50"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex-1 rounded-md bg-primary px-2 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Properties"}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className={cn(
            "rounded-md px-2 py-1.5 text-xs font-medium transition-colors disabled:opacity-50",
            confirmDelete
              ? "bg-destructive text-destructive-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-destructive/10 hover:text-destructive",
          )}
        >
          {deleting ? "..." : confirmDelete ? "Confirm" : "Delete"}
        </button>
      </div>
    </div>
  );
}

function formatMetric(meters: number): string {
  if (meters >= 1_000_000) return `${(meters / 1_000_000).toFixed(2)} km²`;
  if (meters >= 10_000) return `${(meters / 1_000_000).toFixed(4)} km²`;
  return `${meters.toFixed(1)} m²`;
}

function formatLength(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(3)} km`;
  return `${meters.toFixed(1)} m`;
}

function formatImperialArea(sqMeters: number): string {
  const sqFeet = sqMeters * 10.7639;
  const acres = sqFeet / 43560;
  if (acres >= 640) return `${(acres / 640).toFixed(2)} mi²`;
  if (acres >= 1) return `${acres.toFixed(2)} acres`;
  return `${sqFeet.toFixed(1)} ft²`;
}

function formatImperialLength(meters: number): string {
  const feet = meters * 3.28084;
  if (feet >= 5280) return `${(feet / 5280).toFixed(3)} mi`;
  return `${feet.toFixed(1)} ft`;
}

function MeasurementsSection() {
  const selectedFeatures = useEditingStore((s) => s.selectedFeatures);
  const feature = selectedFeatures[0] ?? null;
  const [imperial, setImperial] = useState(false);

  const computeMeasurements = () => {
    if (!feature) return null;
    const geom = feature.geometry;
    try {
      const feat = turf.feature(geom as GeoJSON.Geometry);
      if (geom.type === "Polygon" || geom.type === "MultiPolygon") {
        const areaM2 = turf.area(feat);
        const boundary = turf.polygonToLine(
          geom as GeoJSON.Polygon | GeoJSON.MultiPolygon,
        );
        const perimeterKm = turf.length(boundary, { units: "kilometers" });
        return {
          type: "polygon" as const,
          area: areaM2,
          perimeter: perimeterKm * 1000,
        };
      }
      if (geom.type === "LineString" || geom.type === "MultiLineString") {
        const lengthKm = turf.length(feat, {
          units: "kilometers",
        });
        return { type: "line" as const, length: lengthKm * 1000 };
      }
      if (geom.type === "Point") {
        const coords = (geom as GeoJSON.Point).coordinates;
        return {
          type: "point" as const,
          lng: coords[0],
          lat: coords[1],
        };
      }
    } catch {
      return null;
    }
    return null;
  };
  const measurements = computeMeasurements();

  if (!feature) {
    return (
      <p className="text-xs text-muted-foreground">
        Select a feature to see measurements.
      </p>
    );
  }

  if (!measurements) {
    return (
      <p className="text-xs text-muted-foreground">
        Unable to compute measurements for this geometry.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium capitalize text-muted-foreground">
          {measurements.type}
        </span>
        {measurements.type !== "point" && (
          <button
            type="button"
            onClick={() => setImperial(!imperial)}
            className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground"
          >
            {imperial ? "Imperial" : "Metric"}
          </button>
        )}
      </div>

      <div className="space-y-1 rounded-md bg-muted/50 p-2">
        {measurements.type === "polygon" && (
          <>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Area</span>
              <span className="font-mono font-medium">
                {imperial
                  ? formatImperialArea(measurements.area)
                  : formatMetric(measurements.area)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Perimeter</span>
              <span className="font-mono font-medium">
                {imperial
                  ? formatImperialLength(measurements.perimeter)
                  : formatLength(measurements.perimeter)}
              </span>
            </div>
          </>
        )}
        {measurements.type === "line" && (
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Length</span>
            <span className="font-mono font-medium">
              {imperial
                ? formatImperialLength(measurements.length)
                : formatLength(measurements.length)}
            </span>
          </div>
        )}
        {measurements.type === "point" && (
          <>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Longitude</span>
              <span className="font-mono font-medium">
                {measurements.lng.toFixed(6)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Latitude</span>
              <span className="font-mono font-medium">
                {measurements.lat.toFixed(6)}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function DrawStyleSection() {
  const drawStyle = useEditingStore((s) => s.drawStyle);
  const setDrawStyle = useEditingStore((s) => s.setDrawStyle);

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="stroke-color" className="text-xs text-muted-foreground">
            Stroke Color
          </label>
          <div className="flex items-center gap-1.5">
            <input
              id="stroke-color"
              type="color"
              value={drawStyle.strokeColor}
              onChange={(e) => setDrawStyle({ strokeColor: e.target.value })}
              className="h-6 w-8 cursor-pointer rounded border bg-transparent"
            />
            <span className="font-mono text-[10px] text-muted-foreground">{drawStyle.strokeColor}</span>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="stroke-width" className="text-xs text-muted-foreground">
            Stroke Width
          </label>
          <span className="font-mono text-xs font-medium">{drawStyle.strokeWidth}px</span>
        </div>
        <input
          id="stroke-width"
          type="range"
          min={1}
          max={10}
          value={drawStyle.strokeWidth}
          onChange={(e) => setDrawStyle({ strokeWidth: Number(e.target.value) })}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>1px</span>
          <span>10px</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="fill-color" className="text-xs text-muted-foreground">
            Fill Color
          </label>
          <div className="flex items-center gap-1.5">
            <input
              id="fill-color"
              type="color"
              value={drawStyle.fillColor}
              onChange={(e) => setDrawStyle({ fillColor: e.target.value })}
              className="h-6 w-8 cursor-pointer rounded border bg-transparent"
            />
            <span className="font-mono text-[10px] text-muted-foreground">{drawStyle.fillColor}</span>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="fill-opacity" className="text-xs text-muted-foreground">
            Fill Opacity
          </label>
          <span className="font-mono text-xs font-medium">{drawStyle.fillOpacity}%</span>
        </div>
        <input
          id="fill-opacity"
          type="range"
          min={0}
          max={100}
          value={drawStyle.fillOpacity}
          onChange={(e) => setDrawStyle({ fillOpacity: Number(e.target.value) })}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
}

const STYLE_KEYS = new Set([
  "stroke_color",
  "stroke_width",
  "fill_color",
  "fill_opacity",
  "layer_color",
]);

function FeatureStyleSection() {
  const selectedFeatures = useEditingStore((s) => s.selectedFeatures);
  const feature = selectedFeatures[0] ?? null;
  const { updateFeature } = useFeatures();
  const savingRef = useRef(false);

  const [strokeColor, setStrokeColor] = useState("#3bb2d0");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [fillColor, setFillColor] = useState("#3bb2d0");
  const [fillOpacity, setFillOpacity] = useState(30);

  useEffect(() => {
    if (!feature) return;
    const p = feature.properties;
    setStrokeColor((p.stroke_color as string) ?? "#3bb2d0");
    setStrokeWidth(Number(p.stroke_width ?? 2));
    setFillColor((p.fill_color as string) ?? "#3bb2d0");
    const rawOpacity = Number(p.fill_opacity ?? 0.3);
    setFillOpacity(rawOpacity <= 1 ? Math.round(rawOpacity * 100) : rawOpacity);
  }, [feature]);

  if (!feature) {
    return (
      <p className="text-xs text-muted-foreground">
        Select a feature to edit its style.
      </p>
    );
  }

  const persist = async (patch: Record<string, unknown>) => {
    if (savingRef.current) return;
    savingRef.current = true;
    try {
      const cleaned = Object.fromEntries(
        Object.entries(feature.properties).filter(([k]) => !k.startsWith("_")),
      );
      await updateFeature(feature.id, {
        properties: { ...cleaned, ...patch },
      });
    } finally {
      savingRef.current = false;
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Feature <span className="font-mono">{feature.id.slice(0, 8)}...</span>
      </p>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="feat-stroke-color" className="text-xs text-muted-foreground">
            Stroke Color
          </label>
          <div className="flex items-center gap-1.5">
            <input
              id="feat-stroke-color"
              type="color"
              value={strokeColor}
              onChange={(e) => {
                setStrokeColor(e.target.value);
                persist({ stroke_color: e.target.value });
              }}
              className="h-6 w-8 cursor-pointer rounded border bg-transparent"
            />
            <span className="font-mono text-[10px] text-muted-foreground">{strokeColor}</span>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="feat-stroke-width" className="text-xs text-muted-foreground">
            Stroke Width
          </label>
          <span className="font-mono text-xs font-medium">{strokeWidth}px</span>
        </div>
        <input
          id="feat-stroke-width"
          type="range"
          min={1}
          max={10}
          value={strokeWidth}
          onChange={(e) => {
            const v = Number(e.target.value);
            setStrokeWidth(v);
            persist({ stroke_width: v });
          }}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>1px</span>
          <span>10px</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="feat-fill-color" className="text-xs text-muted-foreground">
            Fill Color
          </label>
          <div className="flex items-center gap-1.5">
            <input
              id="feat-fill-color"
              type="color"
              value={fillColor}
              onChange={(e) => {
                setFillColor(e.target.value);
                persist({ fill_color: e.target.value });
              }}
              className="h-6 w-8 cursor-pointer rounded border bg-transparent"
            />
            <span className="font-mono text-[10px] text-muted-foreground">{fillColor}</span>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="feat-fill-opacity" className="text-xs text-muted-foreground">
            Fill Opacity
          </label>
          <span className="font-mono text-xs font-medium">{fillOpacity}%</span>
        </div>
        <input
          id="feat-fill-opacity"
          type="range"
          min={0}
          max={100}
          value={fillOpacity}
          onChange={(e) => {
            const v = Number(e.target.value);
            setFillOpacity(v);
            persist({ fill_opacity: v / 100 });
          }}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
}

function SnappingSection() {
  const snapping = useEditingStore((s) => s.snapping);
  const setSnapping = useEditingStore((s) => s.setSnapping);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium">Snap to vertices</p>
          <p className="text-[10px] text-muted-foreground">
            Snap new vertices to nearby existing ones
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSnapping({ enabled: !snapping.enabled })}
          className={cn(
            "relative h-5 w-9 rounded-full transition-colors",
            snapping.enabled ? "bg-primary" : "bg-muted",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform shadow-sm",
              snapping.enabled && "translate-x-4",
            )}
          />
        </button>
      </div>

      {snapping.enabled && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="snap-tolerance"
              className="text-xs text-muted-foreground"
            >
              Tolerance
            </label>
            <span className="text-xs font-mono font-medium">
              {snapping.tolerance}px
            </span>
          </div>
          <input
            id="snap-tolerance"
            type="range"
            min={1}
            max={50}
            value={snapping.tolerance}
            onChange={(e) =>
              setSnapping({ tolerance: Number(e.target.value) })
            }
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>1px</span>
            <span>50px</span>
          </div>
        </div>
      )}
    </div>
  );
}

interface HistoryEntry {
  hist_id: number;
  feature_id: string;
  geometry: GeoJSON.Geometry;
  properties: Record<string, unknown>;
  modified_at: string;
  modified_by: string | null;
}

function HistorySection() {
  const selectedFeatures = useEditingStore((s) => s.selectedFeatures);
  const feature = selectedFeatures[0] ?? null;
  const { updateFeature } = useFeatures();

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [reverting, setReverting] = useState<number | null>(null);

  const fetchHistory = async (featureId: string) => {
    setLoading(true);
    try {
      const data = await apiFetch<HistoryEntry[]>(
        `/api/features/${featureId}/history`,
      );
      setHistory(data);
    } catch {
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (feature?.id) {
      fetchHistory(feature.id);
    } else {
      setHistory([]);
    }
  }, [feature?.id]);

  const handleRevert = async (entry: HistoryEntry) => {
    setReverting(entry.hist_id);
    try {
      await updateFeature(entry.feature_id, {
        geometry: entry.geometry,
        properties: entry.properties,
      });
      await fetchHistory(entry.feature_id);
    } finally {
      setReverting(null);
    }
  };

  if (!feature) {
    return (
      <p className="text-xs text-muted-foreground">
        Select a feature to view its edit history.
      </p>
    );
  }

  if (loading) {
    return <p className="text-xs text-muted-foreground">Loading history...</p>;
  }

  if (history.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No edit history for this feature.
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] text-muted-foreground">
        {history.length} revision{history.length !== 1 && "s"}
      </p>
      <div className="max-h-40 space-y-1 overflow-y-auto">
        {history.map((entry, idx) => {
          const date = new Date(entry.modified_at);
          const isLatest = idx === 0;
          return (
            <div
              key={entry.hist_id}
              className={cn(
                "flex items-center justify-between rounded-md px-2 py-1.5",
                isLatest ? "bg-primary/5" : "bg-muted/50",
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium">
                  {date.toLocaleDateString()}{" "}
                  <span className="text-muted-foreground">
                    {date.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </p>
                {entry.modified_by && (
                  <p className="truncate text-[10px] text-muted-foreground">
                    by {entry.modified_by}
                  </p>
                )}
              </div>
              {!isLatest && (
                <button
                  type="button"
                  onClick={() => handleRevert(entry)}
                  disabled={reverting !== null}
                  className="ml-2 shrink-0 rounded-md bg-secondary px-2 py-1 text-[10px] font-medium text-secondary-foreground hover:bg-accent disabled:opacity-50"
                  title="Revert to this version"
                >
                  {reverting === entry.hist_id ? (
                    "..."
                  ) : (
                    <RotateCcw className="h-3 w-3" />
                  )}
                </button>
              )}
              {isLatest && (
                <span className="ml-2 text-[10px] font-medium text-primary">
                  Current
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProGate({ children }: { children: React.ReactNode }) {
  const { isPro } = useUserPlan();
  if (isPro) return <>{children}</>;
  return (
    <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
      <Lock className="h-3 w-3 shrink-0" />
      Upgrade to Pro to customize draw styles
    </div>
  );
}

export function EditPanel() {
  return (
    <div className="flex h-full w-full flex-col bg-background">
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <Pencil className="h-4 w-4" />
        <h2 className="text-sm font-semibold">Draw & Edit</h2>
        <HelpTooltip
          title="Drawing & Editing"
          description="Create and modify map features. Use the toolbar on the left side of the map to draw points, lines, polygons, circles, and rectangles. Click any feature to select it and edit its properties here."
          arcgisEquivalent="Edit toolbar / Feature editing"
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        <Section title="Target Layer" icon={Target}>
          <TargetLayerSection />
        </Section>
        <Section title="Draw Style" icon={Palette}>
          <ProGate>
            <DrawStyleSection />
          </ProGate>
        </Section>
        <Section title="Feature Style" icon={Paintbrush}>
          <ProGate>
            <FeatureStyleSection />
          </ProGate>
        </Section>
        <Section title="Feature Properties" icon={Pencil}>
          <FeaturePropertiesSection />
        </Section>
        <Section title="Measurements" icon={Ruler}>
          <MeasurementsSection />
        </Section>
        <Section title="Snapping" icon={Crosshair}>
          <SnappingSection />
        </Section>
        <Section title="Edit History" icon={Clock} defaultOpen={false}>
          <HistorySection />
        </Section>
      </div>
    </div>
  );
}
