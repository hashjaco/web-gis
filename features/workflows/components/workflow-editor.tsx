"use client";

import { useEffect, useState } from "react";
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  type Connection,
  type Node,
  type Edge,
  Handle,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Check, Loader2, Play, Save, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import * as turf from "@turf/turf";
import { apiFetch } from "@/lib/api/client";
import { useProjectStore } from "@/features/projects/store";
import type { GeoNodeData, GeoNodeType } from "../types";
import type { FeatureCollection } from "geojson";

const NODE_CATALOG: {
  category: string;
  items: { type: GeoNodeType; label: string }[];
}[] = [
  {
    category: "Input",
    items: [
      { type: "layer-input", label: "Layer" },
      { type: "file-input", label: "File Upload" },
    ],
  },
  {
    category: "Processing",
    items: [
      { type: "buffer", label: "Buffer" },
      { type: "clip", label: "Clip" },
      { type: "intersect", label: "Intersect" },
      { type: "union", label: "Union" },
      { type: "dissolve", label: "Dissolve" },
    ],
  },
  {
    category: "Analysis",
    items: [
      { type: "centroid", label: "Centroid" },
      { type: "voronoi", label: "Voronoi" },
      { type: "dbscan", label: "DBSCAN" },
      { type: "kmeans", label: "K-Means" },
      { type: "statistics", label: "Statistics" },
    ],
  },
  {
    category: "Output",
    items: [
      { type: "output-layer", label: "New Layer" },
      { type: "output-export", label: "Export File" },
    ],
  },
];

function SaveButton({ onClick }: { onClick: () => void }) {
  const [saved, setSaved] = useState(false);

  const handleClick = () => {
    onClick();
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex items-center gap-1 rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground transition-all hover:bg-secondary/80 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-ring"
    >
      {saved ? <Check className="h-3 w-3 text-green-500" /> : <Save className="h-3 w-3" />}
      {saved ? "Saved!" : "Save"}
    </button>
  );
}

function GeoProcessingNode({ data }: { data: GeoNodeData }) {
  const isInput = data.nodeType.includes("input");
  const isOutput = data.nodeType.includes("output");
  const hasResult = !!data.result;

  return (
    <div
      className={cn(
        "rounded-lg border bg-card px-3 py-2 shadow-sm",
        isInput && "border-blue-500/50",
        isOutput && "border-green-500/50",
        !isInput && !isOutput && "border-orange-500/50",
        hasResult && "ring-2 ring-green-500/30",
      )}
    >
      {!isInput && (
        <Handle
          type="target"
          position={Position.Left}
          className="!h-3 !w-3 !border-2 !bg-muted-foreground"
        />
      )}
      <div className="text-xs font-medium">{data.label}</div>
      {Object.keys(data.params).length > 0 && (
        <div className="mt-1 text-xs text-muted-foreground">
          {Object.entries(data.params)
            .slice(0, 2)
            .map(([k, v]) => `${k}: ${v}`)
            .join(", ")}
        </div>
      )}
      {!isOutput && (
        <Handle
          type="source"
          position={Position.Right}
          className="!h-3 !w-3 !border-2 !bg-muted-foreground"
        />
      )}
    </div>
  );
}

const nodeTypes = { geoNode: GeoProcessingNode };

interface WorkflowEditorProps {
  onClose?: () => void;
  initialNodeType?: string | null;
}

async function executeNode(
  nodeType: GeoNodeType,
  input: FeatureCollection | null,
  params: Record<string, unknown>,
  projectId?: string,
): Promise<FeatureCollection | null> {
  if (!input && !nodeType.includes("input")) return null;

  switch (nodeType) {
    case "layer-input": {
      const layerId = params.layerId as string;
      if (!layerId || !projectId) return null;
      const qp = new URLSearchParams({ layer: layerId });
      qp.set("projectId", projectId);
      return apiFetch<FeatureCollection>(`/api/features?${qp}`);
    }
    case "buffer": {
      if (!input) return null;
      const distance = (params.distance as number) ?? 1;
      const buffered = input.features
        .map((f) => turf.buffer(f, distance, { units: "kilometers" }))
        .filter(Boolean) as GeoJSON.Feature[];
      return { type: "FeatureCollection", features: buffered };
    }
    case "union": {
      if (!input || input.features.length === 0) return null;
      const merged = turf.union(input as GeoJSON.FeatureCollection<GeoJSON.Polygon>);
      return merged
        ? { type: "FeatureCollection", features: [merged] }
        : input;
    }
    case "centroid": {
      if (!input) return null;
      const centroids = input.features.map((f) => turf.centroid(f));
      return { type: "FeatureCollection", features: centroids };
    }
    case "dissolve": {
      if (!input) return null;
      const prop = params.propertyKey as string | undefined;
      return turf.dissolve(
        input as GeoJSON.FeatureCollection<GeoJSON.Polygon>,
        { propertyName: prop },
      );
    }
    case "statistics": {
      if (!input) return null;
      return input;
    }
    case "output-layer":
    case "output-export":
      return input;
    default:
      return input;
  }
}

function topoSort(nodes: Node[], edges: Edge[]): Node[] {
  const inDeg: Record<string, number> = {};
  const adj: Record<string, string[]> = {};
  for (const n of nodes) {
    inDeg[n.id] = 0;
    adj[n.id] = [];
  }
  for (const e of edges) {
    inDeg[e.target] = (inDeg[e.target] ?? 0) + 1;
    (adj[e.source] ??= []).push(e.target);
  }
  const queue = nodes.filter((n) => inDeg[n.id] === 0);
  const sorted: Node[] = [];
  while (queue.length > 0) {
    const node = queue.shift()!;
    sorted.push(node);
    for (const t of adj[node.id] ?? []) {
      inDeg[t]--;
      if (inDeg[t] === 0) {
        const targetNode = nodes.find((n) => n.id === t);
        if (targetNode) queue.push(targetNode);
      }
    }
  }
  return sorted;
}

export function WorkflowEditor({ onClose, initialNodeType }: WorkflowEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [showCatalog, setShowCatalog] = useState(true);
  const [running, setRunning] = useState(false);
  const [executionLog, setExecutionLog] = useState<string[]>([]);
  const projectId = useProjectStore((s) => s.activeProject?.id);

  useEffect(() => {
    if (initialNodeType) {
      const catalog = NODE_CATALOG.flatMap((c) => c.items);
      const item = catalog.find((i) => i.type === initialNodeType);
      if (item) {
        addNode(item.type, item.label);
      }
    }
    // only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onConnect = (connection: Connection) =>
    setEdges((eds) => addEdge(connection, eds));

  const addNode = (nodeType: GeoNodeType, label: string) => {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: "geoNode",
      position: { x: 250 + nodes.length * 50, y: 100 + nodes.length * 80 },
      data: { label, nodeType, params: {} } satisfies GeoNodeData,
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const saveWorkflow = () => {
    const workflow = {
      id: `wf-${Date.now()}`,
      name: `Workflow ${new Date().toLocaleDateString()}`,
      nodes: nodes.map((n) => ({
        id: n.id,
        type: n.type ?? "geoNode",
        position: n.position,
        data: n.data as unknown as GeoNodeData,
      })),
      edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target })),
    };

    try {
      const existing = JSON.parse(localStorage.getItem("gis-workflows") ?? "[]");
      existing.push({
        id: workflow.id,
        name: workflow.name,
        nodeCount: workflow.nodes.length,
      });
      localStorage.setItem("gis-workflows", JSON.stringify(existing));
      localStorage.setItem(`gis-workflow-${workflow.id}`, JSON.stringify(workflow));
      setExecutionLog((prev) => [...prev, `Saved: ${workflow.name}`]);
    } catch (err) {
      setExecutionLog((prev) => [...prev, `Save failed: ${err}`]);
    }
  };

  const executeWorkflow = async () => {
    setRunning(true);
    setExecutionLog([]);
    try {
      const sorted = topoSort(nodes, edges);
      const results = new Map<string, FeatureCollection | null>();

      for (const node of sorted) {
        const data = node.data as unknown as GeoNodeData;
        setExecutionLog((prev) => [...prev, `Running: ${data.label}...`]);

        const incoming = edges.filter((e) => e.target === node.id);
        let input: FeatureCollection | null = null;
        if (incoming.length > 0) {
          input = results.get(incoming[0].source) ?? null;
        }

        const result = await executeNode(data.nodeType, input, data.params, projectId);
        results.set(node.id, result);

        const count = result?.features?.length ?? 0;
        setExecutionLog((prev) => [
          ...prev,
          `  → ${data.label}: ${count} features`,
        ]);
      }

      setExecutionLog((prev) => [...prev, "Workflow complete."]);
    } catch (err) {
      setExecutionLog((prev) => [
        ...prev,
        `Error: ${err instanceof Error ? err.message : "Unknown error"}`,
      ]);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-background">
      {showCatalog && (
        <div className="w-56 shrink-0 overflow-y-auto border-r p-3">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Toolbox</h3>
            <button
              type="button"
              onClick={() => setShowCatalog(false)}
              className="rounded p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          {NODE_CATALOG.map((cat) => (
            <div key={cat.category} className="mb-3">
              <p className="mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {cat.category}
              </p>
              <div className="space-y-1">
                {cat.items.map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => addNode(item.type, item.label)}
                    className="flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-xs transition-colors hover:bg-accent"
                  >
                    <Plus className="h-3 w-3" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-1 flex-col">
        <div className="flex items-center gap-2 border-b px-3 py-2">
          {!showCatalog && (
            <button
              type="button"
              onClick={() => setShowCatalog(true)}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
              title="Show toolbox"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
          <h2 className="flex-1 text-sm font-semibold">Workflow Editor</h2>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={executeWorkflow}
                disabled={running || nodes.length === 0}
                className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              >
                {running ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                {running ? "Running..." : "Execute"}
              </button>
            </TooltipTrigger>
            <TooltipContent>Run all nodes in order</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <SaveButton onClick={saveWorkflow} />
            </TooltipTrigger>
            <TooltipContent>Save workflow to browser</TooltipContent>
          </Tooltip>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
          >
            <Controls />
            <Background />
            <MiniMap />
          </ReactFlow>
        </div>

        {executionLog.length > 0 && (
          <div className="max-h-32 overflow-y-auto border-t bg-black/90 p-2 font-mono text-xs">
            {executionLog.map((line, i) => (
              <div
                key={i}
                className={
                  line.startsWith("Error")
                    ? "text-red-400"
                    : line.startsWith("Saved") || line === "Workflow complete."
                      ? "text-green-400"
                      : "text-gray-300"
                }
              >
                {line}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
