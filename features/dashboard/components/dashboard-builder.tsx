"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, PieChart, Pie, LineChart, Line, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { Plus, X, BarChart3 } from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import { useLayerStore } from "@/features/layers/store";
import { useProjectStore } from "@/features/projects/store";
import type { FeatureCollection } from "geojson";

type WidgetType = "bar" | "pie" | "line" | "scatter" | "stat";

interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  layerId: string;
  attribute: string;
}

const COLORS = [
  "#0088FE", "#00C49F", "#FFBB28", "#FF8042",
  "#8884d8", "#82ca9d", "#ffc658", "#ff7300",
];

export function DashboardBuilder() {
  const layers = useLayerStore((s) => s.layers);
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  const addWidget = (widget: Omit<DashboardWidget, "id">) => {
    setWidgets((prev) => [
      ...prev,
      { ...widget, id: crypto.randomUUID() },
    ]);
    setShowAddForm(false);
  };

  const removeWidget = (id: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          <h2 className="text-sm font-semibold">Dashboard</h2>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="rounded-md p-1 text-muted-foreground hover:bg-accent"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {showAddForm && (
        <AddWidgetForm
          layers={layers.map((l) => ({ id: l.id, name: l.name }))}
          onAdd={addWidget}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {widgets.length === 0 && (
          <p className="py-8 text-center text-xs text-muted-foreground">
            Click + to add chart widgets
          </p>
        )}
        {widgets.map((widget) => (
          <WidgetCard
            key={widget.id}
            widget={widget}
            onRemove={() => removeWidget(widget.id)}
          />
        ))}
      </div>
    </div>
  );
}

function AddWidgetForm({
  layers,
  onAdd,
  onCancel,
}: {
  layers: { id: string; name: string }[];
  onAdd: (w: Omit<DashboardWidget, "id">) => void;
  onCancel: () => void;
}) {
  const [type, setType] = useState<WidgetType>("bar");
  const [layerId, setLayerId] = useState(layers[0]?.id ?? "");
  const [attribute, setAttribute] = useState("");
  const [title, setTitle] = useState("");

  return (
    <div className="space-y-2 border-b p-3">
      <select
        value={type}
        onChange={(e) => setType(e.target.value as WidgetType)}
        className="w-full rounded border bg-background px-2 py-1.5 text-xs"
      >
        <option value="bar">Bar Chart</option>
        <option value="pie">Pie Chart</option>
        <option value="line">Line Chart</option>
        <option value="scatter">Scatter Plot</option>
        <option value="stat">Stat Card</option>
      </select>
      <select
        value={layerId}
        onChange={(e) => setLayerId(e.target.value)}
        className="w-full rounded border bg-background px-2 py-1.5 text-xs"
      >
        {layers.map((l) => (
          <option key={l.id} value={l.id}>{l.name}</option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Attribute name"
        value={attribute}
        onChange={(e) => setAttribute(e.target.value)}
        className="w-full rounded border bg-background px-2 py-1.5 text-xs"
      />
      <input
        type="text"
        placeholder="Widget title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full rounded border bg-background px-2 py-1.5 text-xs"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onAdd({ type, layerId, attribute, title: title || `${type} chart` })}
          className="flex-1 rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground"
        >
          Add
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function WidgetCard({
  widget,
  onRemove,
}: { widget: DashboardWidget; onRemove: () => void }) {
  const layers = useLayerStore((s) => s.layers);
  const layer = layers.find((l) => l.id === widget.layerId);
  const projectId = useProjectStore((s) => s.activeProject?.id);

  const { data: fc } = useQuery({
    queryKey: ["features", "dashboard", layer?.id, projectId],
    queryFn: () => {
      const qp = new URLSearchParams();
      if (layer?.id) qp.set("layer", layer.id);
      if (projectId) qp.set("projectId", projectId);
      return apiFetch<FeatureCollection>(`/api/features?${qp}`);
    },
    enabled: !!layer && !!projectId,
  });

  const chartData = (() => {
    if (!fc) return [];
    const counts: Record<string, number> = {};
    for (const f of fc.features) {
      const val = String(f.properties?.[widget.attribute] ?? "unknown");
      counts[val] = (counts[val] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([name, value]) => ({ name, value }));
  })();

  return (
    <div className="rounded border bg-card p-2">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-medium">{widget.title}</span>
        <button
          type="button"
          onClick={onRemove}
          className="rounded p-0.5 text-muted-foreground hover:text-destructive"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      {widget.type === "stat" ? (
        <div className="text-center">
          <p className="text-2xl font-bold">{fc?.features.length ?? 0}</p>
          <p className="text-xs text-muted-foreground">Features</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={120}>
          {widget.type === "bar" ? (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 8 }} />
              <YAxis tick={{ fontSize: 8 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#0088FE" />
            </BarChart>
          ) : widget.type === "pie" ? (
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={40}
                label={({ name }) => name}
                fontSize={8}
              >
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          ) : widget.type === "line" ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 8 }} />
              <YAxis tick={{ fontSize: 8 }} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#0088FE" />
            </LineChart>
          ) : (
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 8 }} />
              <YAxis dataKey="value" tick={{ fontSize: 8 }} />
              <Tooltip />
              <Scatter data={chartData} fill="#00C49F" />
            </ScatterChart>
          )}
        </ResponsiveContainer>
      )}
    </div>
  );
}
