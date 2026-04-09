"use client";

import {
  BarChart3,
  Brain,
  Download,
  Eye,
  FileUp,
  Home,
  Layers,
  LayoutDashboard,
  Map,
  Pencil,
  Route,
  Satellite,
  Search,
  Terminal,
  Video,
  Workflow,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useProjects } from "@/features/home/hooks/use-projects";
import { useProjectStore } from "@/features/projects/store";
import { hydrateProjectState } from "@/features/projects/lib/project-state";
import { apiFetch } from "@/lib/api/client";
import type { ProjectRecord } from "@/features/projects/types";

interface CommandPaletteProps {
  onPanelChange: (panel: string | null) => void;
  onHomeClick: () => void;
  onCreateProject: () => void;
}

interface CommandItem {
  id: string;
  label: string;
  section: string;
  icon: React.ElementType;
  keywords?: string;
  action: () => void;
}

const PANEL_COMMANDS: Omit<CommandItem, "action">[] = [
  { id: "nav-home", label: "Go to Home", section: "Navigation", icon: Home, keywords: "home dashboard" },
  { id: "nav-layers", label: "Open Layers", section: "Navigation", icon: Layers, keywords: "layers panel" },
  { id: "nav-import", label: "Import Data", section: "Navigation", icon: FileUp, keywords: "import upload file" },
  { id: "nav-editing", label: "Edit Features", section: "Navigation", icon: Pencil, keywords: "edit draw" },
  { id: "nav-routing", label: "Routing", section: "Navigation", icon: Route, keywords: "route directions" },
  { id: "nav-export", label: "Export / Print", section: "Navigation", icon: Download, keywords: "export download print png" },
  { id: "nav-analysis", label: "Spatial Analysis", section: "Navigation", icon: BarChart3, keywords: "analysis buffer intersection" },
  { id: "nav-visualization", label: "Visualization", section: "Navigation", icon: Eye, keywords: "visualize heatmap" },
  { id: "nav-imagery", label: "Imagery", section: "Navigation", icon: Satellite, keywords: "imagery satellite" },
  { id: "nav-geoai", label: "GeoAI", section: "Navigation", icon: Brain, keywords: "ai machine learning" },
  { id: "nav-workflows", label: "Workflows", section: "Navigation", icon: Workflow, keywords: "workflow automate" },
  { id: "nav-dashboard", label: "Dashboard Builder", section: "Navigation", icon: LayoutDashboard, keywords: "dashboard charts" },
  { id: "nav-scripting", label: "Scripting Console", section: "Navigation", icon: Terminal, keywords: "script code" },
  { id: "nav-media", label: "Media Streams", section: "Navigation", icon: Video, keywords: "media video" },
];

export function CommandPalette({
  onPanelChange,
  onHomeClick,
  onCreateProject,
}: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { data: projects } = useProjects();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
        setQuery("");
        setSelectedIndex(0);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const buildCommands = (): CommandItem[] => {
    const items: CommandItem[] = [];

    for (const cmd of PANEL_COMMANDS) {
      items.push({
        ...cmd,
        action: () => {
          if (cmd.id === "nav-home") {
            onHomeClick();
          } else {
            onPanelChange(cmd.id.replace("nav-", ""));
          }
        },
      });
    }

    items.push({
      id: "action-new-project",
      label: "Create New Project",
      section: "Actions",
      icon: Map,
      keywords: "new project create",
      action: onCreateProject,
    });

    if (projects) {
      for (const project of projects.slice(0, 8)) {
        items.push({
          id: `project-${project.id}`,
          label: project.name,
          section: "Projects",
          icon: Map,
          keywords: project.description ?? "",
          action: async () => {
            const full = await apiFetch<ProjectRecord>(`/api/projects/${project.id}`);
            hydrateProjectState(full.state);
            useProjectStore.getState().setActiveProject({ id: full.id, name: full.name });
          },
        });
      }
    }

    return items;
  };

  const allCommands = buildCommands();

  const filtered = query.trim()
    ? allCommands.filter((cmd) => {
        const hay = `${cmd.label} ${cmd.keywords ?? ""} ${cmd.section}`.toLowerCase();
        return query.toLowerCase().split(/\s+/).every((word) => hay.includes(word));
      })
    : allCommands;

  const sections = Array.from(new Set(filtered.map((c) => c.section)));

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const runCommand = (cmd: CommandItem) => {
    setOpen(false);
    cmd.action();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      e.preventDefault();
      runCommand(filtered[selectedIndex]);
    }
  };

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  if (!open) return null;

  let flatIndex = 0;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setOpen(false)} />
      <div className="fixed inset-x-0 top-[20%] z-50 mx-auto w-full max-w-lg">
        <div className="overflow-hidden rounded-xl border bg-popover shadow-2xl">
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search commands, panels, projects..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              ESC
            </kbd>
          </div>
          <div ref={listRef} className="max-h-80 overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No results found.
              </p>
            ) : (
              sections.map((section) => {
                const sectionItems = filtered.filter((c) => c.section === section);
                return (
                  <div key={section}>
                    <p className="px-2 py-1.5 text-[11px] font-medium text-muted-foreground">
                      {section}
                    </p>
                    {sectionItems.map((cmd) => {
                      const idx = flatIndex++;
                      return (
                        <button
                          key={cmd.id}
                          type="button"
                          data-index={idx}
                          onClick={() => runCommand(cmd)}
                          className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                            idx === selectedIndex
                              ? "bg-accent text-accent-foreground"
                              : "text-foreground hover:bg-accent/50"
                          }`}
                        >
                          <cmd.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                          {cmd.label}
                        </button>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
          <div className="flex items-center gap-3 border-t px-4 py-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">&uarr;</kbd>
              <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">&darr;</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">&crarr;</kbd>
              select
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
