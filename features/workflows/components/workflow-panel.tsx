"use client";

import { Info, Play, Plus, Trash2, Workflow } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const WorkflowEditor = dynamic(
  () => import("./workflow-editor").then((m) => m.WorkflowEditor),
  { ssr: false },
);

interface WorkflowItem {
  id: string;
  name: string;
  nodeCount: number;
}

export function WorkflowPanel() {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("gis-workflows");
      return stored ? (JSON.parse(stored) as WorkflowItem[]) : [];
    } catch {
      return [];
    }
  });
  const [showEditor, setShowEditor] = useState(false);
  const [initialNodeType, setInitialNodeType] = useState<string | null>(null);

  const handleOpenEditorWithNode = (nodeType: string) => {
    setInitialNodeType(nodeType);
    setShowEditor(true);
  };

  const handleEditorClose = () => {
    setShowEditor(false);
    setInitialNodeType(null);
    try {
      const stored = localStorage.getItem("gis-workflows");
      if (stored) setWorkflows(JSON.parse(stored));
    } catch {}
  };

  const handleDeleteWorkflow = (id: string) => {
    try {
      localStorage.removeItem(`gis-workflow-${id}`);
      const updated = workflows.filter((w) => w.id !== id);
      localStorage.setItem("gis-workflows", JSON.stringify(updated));
      setWorkflows(updated);
    } catch {}
  };

  return (
    <>
      <div className="flex h-full w-full flex-col bg-background">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <div className="flex items-center gap-2">
            <Workflow className="h-4 w-4" />
            <h2 className="text-sm font-semibold">Geoprocessing</h2>
          </div>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 cursor-help text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-56">
                Build visual geoprocessing workflows with drag-and-drop nodes. Chain operations like buffer, union, and clustering.
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setShowEditor(true)}
                  className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>New workflow</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-3">
          <ToolboxSection title="Analysis">
            <ToolItem label="Buffer" description="Create buffer zones around features" onClick={() => handleOpenEditorWithNode("buffer")} />
            <ToolItem label="Clip" description="Clip features by polygon boundary" onClick={() => handleOpenEditorWithNode("clip")} />
            <ToolItem label="Intersect" description="Find overlapping areas" onClick={() => handleOpenEditorWithNode("intersect")} />
            <ToolItem label="Union" description="Merge features into one" onClick={() => handleOpenEditorWithNode("union")} />
            <ToolItem label="Dissolve" description="Merge features by attribute" onClick={() => handleOpenEditorWithNode("dissolve")} />
          </ToolboxSection>

          <ToolboxSection title="Statistics">
            <ToolItem label="Centroid" description="Calculate feature centroids" onClick={() => handleOpenEditorWithNode("centroid")} />
            <ToolItem label="Statistics" description="Compute spatial statistics" onClick={() => handleOpenEditorWithNode("statistics")} />
          </ToolboxSection>

          <ToolboxSection title="Clustering">
            <ToolItem label="DBSCAN" description="Density-based clustering" onClick={() => handleOpenEditorWithNode("dbscan")} />
            <ToolItem label="K-Means" description="Partition into k groups" onClick={() => handleOpenEditorWithNode("kmeans")} />
          </ToolboxSection>

          <ToolboxSection title="Interpolation">
            <ToolItem label="Voronoi" description="Create Voronoi polygons" onClick={() => handleOpenEditorWithNode("voronoi")} />
          </ToolboxSection>

          {workflows.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Saved Workflows</p>
              {workflows.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between rounded bg-muted/50 px-2 py-1.5 text-xs"
                >
                  <span>{w.name}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">{w.nodeCount} nodes</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => handleDeleteWorkflow(w.id)}
                          className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Delete workflow</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2 border-t p-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setShowEditor(true)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Play className="h-3 w-3" />
                Workflow Editor
              </button>
            </TooltipTrigger>
            <TooltipContent>Open the visual workflow editor</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {showEditor && (
        <WorkflowEditor
          onClose={handleEditorClose}
          initialNodeType={initialNodeType}
        />
      )}
    </>
  );
}

function ToolboxSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {title}
      </p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function ToolItem({ label, description, onClick }: { label: string; description: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent"
    >
      <span className="text-xs font-medium">{label}</span>
      <span className="text-xs text-muted-foreground">{description}</span>
    </button>
  );
}
