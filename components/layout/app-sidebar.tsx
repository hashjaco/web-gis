"use client";

import {
  BarChart3,
  Brain,
  Download,
  Eye,
  FileUp,
  LayoutDashboard,
  Layers,
  Lock,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Route,
  Satellite,
  Terminal,
  Video,
  Workflow,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useUserPlan } from "@/lib/auth/use-user-plan";

interface NavItem {
  icon: React.ElementType;
  label: string;
  id: string;
}

const standardItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" },
  { icon: Layers, label: "Layers", id: "layers" },
  { icon: FileUp, label: "Import", id: "import" },
  { icon: Pencil, label: "Edit", id: "editing" },
  { icon: Route, label: "Routing", id: "routing" },
  { icon: Download, label: "Export", id: "export" },
];

const proItems: NavItem[] = [
  { icon: BarChart3, label: "Analysis", id: "analysis" },
  { icon: Eye, label: "Visualize", id: "visualization" },
  { icon: Satellite, label: "Imagery", id: "imagery" },
  { icon: Brain, label: "GeoAI", id: "geoai" },
  { icon: Workflow, label: "Workflows", id: "workflows" },
  { icon: Terminal, label: "Scripting", id: "scripting" },
  { icon: Video, label: "Media", id: "media" },
];

interface AppSidebarProps {
  activePanel: string | null;
  onPanelChange: (panel: string | null) => void;
}

export function AppSidebar({ activePanel, onPanelChange }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { canAccess } = useUserPlan();

  function renderNavItem(item: NavItem) {
    const locked = !canAccess(item.id);
    return (
      <Tooltip key={item.id}>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => {
              if (locked) return;
              onPanelChange(activePanel === item.id ? null : item.id);
            }}
            className={cn(
              "flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors",
              locked
                ? "cursor-not-allowed opacity-50"
                : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              !locked &&
                activePanel === item.id &&
                "bg-sidebar-accent text-sidebar-accent-foreground",
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && (
              <span className="flex flex-1 items-center justify-between">
                {item.label}
                {locked && <Lock className="h-3 w-3 text-muted-foreground" />}
              </span>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">
          {locked ? `${item.label} — Upgrade to Pro` : item.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col border-r bg-sidebar transition-[width] duration-200",
        collapsed ? "w-12" : "w-56",
      )}
    >
      <nav className="flex flex-1 flex-col gap-1 p-2">
        {standardItems.map((item) => renderNavItem(item))}
        <div className="my-1 border-t" />
        {proItems.map((item) => renderNavItem(item))}
      </nav>

      <div className="border-t p-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className="flex w-full items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              {collapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {collapsed ? "Expand sidebar" : "Collapse sidebar"}
          </TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
}
