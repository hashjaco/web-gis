"use client";

import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FileUp,
  FolderPlus,
  Layers,
  Map,
  MoreHorizontal,
  Palette,
  Plus,
  Rocket,
  Save,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";
import { useLayerStore } from "@/features/layers/store";
import { useProjectStore } from "@/features/projects/store";
import { useDeleteProject } from "@/features/projects/hooks/use-project-mutations";
import { hydrateProjectState } from "@/features/projects/lib/project-state";
import { useProjects, type ProjectRecord } from "../hooks/use-projects";
import type { LayerConfig } from "@/features/layers/types";

interface HomeViewProps {
  onClose: () => void;
  onPanelChange?: (panel: string) => void;
  onCreateProject?: () => void;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function ProjectCard({
  project,
  onClick,
  onDelete,
}: {
  project: ProjectRecord;
  onClick: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [thumbError, setThumbError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const thumbnail = thumbError ? undefined : project.state?.thumbnail;

  return (
    <div className="group relative flex flex-col rounded-lg border bg-card text-left transition-colors hover:border-primary/40 hover:shadow-sm">
      <button type="button" onClick={onClick} className="absolute inset-0 z-0 rounded-lg" />

      {thumbnail && (
        <div className="relative h-28 w-full overflow-hidden rounded-t-lg">
          <img
            src={thumbnail}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setThumbError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
        </div>
      )}

      <div className="flex flex-col gap-2 p-4">
      <div className="relative z-[1] flex items-start justify-between">
        {!thumbnail && (
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Map className="h-4 w-4" />
          </div>
        )}
        <div className="flex items-center gap-1.5">
          {project.org_id && (
            <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400">
              Team
            </span>
          )}
          {project.is_public && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              Public
            </span>
          )}
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
                setConfirmDelete(false);
              }}
              className="rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-accent-foreground group-hover:opacity-100"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => { setMenuOpen(false); setConfirmDelete(false); }} />
                <div className="absolute right-0 z-20 mt-1 w-40 rounded-md border bg-popover p-1 shadow-md">
                  {confirmDelete ? (
                    <div className="space-y-1 p-1">
                      <p className="text-xs text-muted-foreground">Delete this project?</p>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                            setMenuOpen(false);
                            setConfirmDelete(false);
                          }}
                          className="flex-1 rounded bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive-foreground transition-colors hover:bg-destructive/20"
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDelete(false);
                          }}
                          className="flex-1 rounded px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDelete(true);
                      }}
                      className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs text-destructive-foreground transition-colors hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete project
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="min-w-0">
        <h3 className="truncate text-sm font-medium">{project.name}</h3>
        {project.description && (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
            {project.description}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
        <Clock className="h-3 w-3" />
        {formatRelativeTime(project.updated_at)}
      </div>
      </div>
    </div>
  );
}

interface OnboardingStep {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  action: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "import",
    label: "Import your first dataset",
    description: "Upload GeoJSON, Shapefile, KML, CSV, or other geospatial formats.",
    icon: FileUp,
    action: "import",
  },
  {
    id: "style",
    label: "Style your layers",
    description: "Customize colors, labels, and visualization settings.",
    icon: Palette,
    action: "layers",
  },
  {
    id: "save",
    label: "Save as a project",
    description: "Preserve your map configuration and share it with others.",
    icon: Save,
    action: "create-project",
  },
];

const ONBOARDING_KEY = "shimgis-onboarding-completed";

function GettingStarted({
  onAction,
}: {
  onAction: (step: string) => void;
}) {
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = localStorage.getItem(ONBOARDING_KEY);
      return stored ? new Set(JSON.parse(stored) as string[]) : new Set();
    } catch {
      return new Set();
    }
  });
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(ONBOARDING_KEY, JSON.stringify([...completedSteps]));
    } catch { /* noop */ }
  }, [completedSteps]);

  if (dismissed || completedSteps.size >= ONBOARDING_STEPS.length) return null;

  return (
    <div className="animate-fade-in-up rounded-xl border bg-gradient-to-br from-primary/5 to-accent/30 p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Rocket className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Get started with ShimGIS</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Complete these steps to set up your first map project.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Dismiss
        </button>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {ONBOARDING_STEPS.map((step, i) => {
          const done = completedSteps.has(step.id);
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => {
                setCompletedSteps((prev) => new Set([...prev, step.id]));
                onAction(step.action);
              }}
              className={`flex flex-col gap-2 rounded-lg border p-4 text-left transition-all ${
                done
                  ? "border-primary/30 bg-primary/5"
                  : "bg-card hover:border-primary/30 hover:shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                  </span>
                  <step.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                {!done && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />}
              </div>
              <h3 className="text-sm font-medium">{step.label}</h3>
              <p className="text-[11px] text-muted-foreground">{step.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EmptyProjects({ onAction }: { onAction: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <FolderPlus className="h-5 w-5 text-muted-foreground" />
      </div>
      <h3 className="mt-3 text-sm font-medium">No projects yet</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Create your first project to save map configurations.
      </p>
      <button
        type="button"
        onClick={onAction}
        className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <Plus className="h-3 w-3" />
        New Project
      </button>
    </div>
  );
}

function LayerRow({
  layer,
  onClick,
}: {
  layer: LayerConfig;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-accent/50"
    >
      <div className="flex h-7 w-7 items-center justify-center rounded bg-muted">
        <Layers className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{layer.name}</p>
        <p className="text-[11px] text-muted-foreground capitalize">
          {layer.sourceType}
        </p>
      </div>
    </button>
  );
}

export function HomeView({
  onClose,
  onPanelChange,
  onCreateProject,
}: HomeViewProps) {
  const { data: projects, isLoading: loadingProjects } = useProjects();
  const projectId = useProjectStore((s) => s.activeProject?.id);
  const { data: layers, isLoading: loadingLayers } = useQuery({
    queryKey: queryKeys.layers.byProject(projectId!),
    queryFn: () =>
      apiFetch<LayerConfig[]>(`/api/layers?projectId=${projectId}`),
    enabled: !!projectId,
  });
  const setActiveLayer = useLayerStore((s) => s.setActiveLayer);
  const deleteProject = useDeleteProject();
  const [loadingProjectId, setLoadingProjectId] = useState<string | null>(null);

  const recentProjects = projects?.slice(0, 6) ?? [];
  const recentLayers = layers?.slice(0, 8) ?? [];

  const handleOpenProject = async (project: ProjectRecord) => {
    setLoadingProjectId(project.id);
    try {
      const full = await apiFetch<ProjectRecord>(
        `/api/projects/${project.id}`,
      );
      hydrateProjectState(full.state);
      useProjectStore
        .getState()
        .setActiveProject({ id: full.id, name: full.name });
      onClose();
    } catch {
      setLoadingProjectId(null);
    }
  };

  const handleQuickAction = (panelId: string | null) => {
    if (panelId === null) {
      onCreateProject?.();
      return;
    }
    onClose();
    onPanelChange?.(panelId);
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-background">
      <div className="mx-auto w-full max-w-5xl px-8 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome back
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Pick up where you left off, or start something new.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Map className="h-4 w-4" />
            Open Map
          </button>
        </div>

        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={() => handleQuickAction("import")}
            className="inline-flex items-center gap-2 rounded-lg border bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent/50"
          >
            <FileUp className="h-4 w-4 text-muted-foreground" />
            Import Data
          </button>
          <button
            type="button"
            onClick={() => handleQuickAction("layers")}
            className="inline-flex items-center gap-2 rounded-lg border bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent/50"
          >
            <Layers className="h-4 w-4 text-muted-foreground" />
            New Layer
          </button>
          <button
            type="button"
            onClick={() => handleQuickAction(null)}
            className="inline-flex items-center gap-2 rounded-lg border bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent/50"
          >
            <FolderPlus className="h-4 w-4 text-muted-foreground" />
            Create Project
          </button>
        </div>

        {!loadingProjects &&
          !loadingLayers &&
          recentProjects.length === 0 &&
          recentLayers.length === 0 && (
            <div className="mt-8">
              <GettingStarted
                onAction={(action) => {
                  if (action === "create-project") {
                    onCreateProject?.();
                  } else {
                    onClose();
                    onPanelChange?.(action);
                  }
                }}
              />
            </div>
          )}

        <section className="mt-10">
          <h2 className="text-base font-semibold">Recent Projects</h2>
          <div className="mt-4">
            {loadingProjects ? (
              <div className="grid grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={`skel-proj-${i}`}
                    className="h-32 animate-pulse rounded-lg bg-muted"
                  />
                ))}
              </div>
            ) : recentProjects.length === 0 ? (
              <EmptyProjects
                onAction={() => onCreateProject?.()}
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recentProjects.map((project, i) => (
                  <div
                    key={project.id}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <ProjectCard
                      project={project}
                      onClick={() => handleOpenProject(project)}
                      onDelete={() => deleteProject.mutate(project.id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-base font-semibold">Recent Layers</h2>
          <div className="mt-4">
            {loadingLayers ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={`skel-layer-${i}`}
                    className="h-11 animate-pulse rounded-md bg-muted"
                  />
                ))}
              </div>
            ) : recentLayers.length === 0 ? (
              <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
                No layers yet. Import data or create a layer to get started.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                {recentLayers.map((layer, i) => (
                  <div
                    key={layer.id}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <LayerRow
                      layer={layer}
                      onClick={() => {
                        setActiveLayer(layer.id);
                        onClose();
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {loadingProjectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-logo-pulse">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Map className="h-5 w-5 text-primary" />
              </div>
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Loading project...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
