"use client";

import {
  BarChart3,
  Brain,
  Download,
  Eye,
  FileUp,
  Home,
  LayoutDashboard,
  Layers,
  Lock,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Route,
  Satellite,
  Settings,
  Terminal,
  Users,
  Video,
  Workflow,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useUserPlan } from "@/lib/auth/use-user-plan";
import { UsageMeter } from "./usage-meter";

interface NavItem {
  icon: React.ElementType;
  label: string;
  id: string;
}

const freeItems: NavItem[] = [
  { icon: Layers, label: "Layers", id: "layers" },
  { icon: FileUp, label: "Import", id: "import" },
  { icon: Pencil, label: "Edit", id: "editing" },
  { icon: Route, label: "Routing", id: "routing" },
  { icon: Download, label: "Export", id: "export" },
];

const proItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" },
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
  showHome: boolean;
  onPanelChange: (panel: string | null) => void;
  onHomeClick: () => void;
  onUpgrade?: () => void;
}

export function AppSidebar({
  activePanel,
  showHome,
  onPanelChange,
  onHomeClick,
  onUpgrade,
}: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { canAccess, hasCollaboration } = useUserPlan();

  function renderNavItem(item: NavItem) {
    const locked = !canAccess(item.id);
    const isActive = !locked && activePanel === item.id;
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
              "relative flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-all duration-150",
              locked
                ? "cursor-not-allowed opacity-50"
                : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
            )}
          >
            {isActive && (
              <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
            )}
            <item.icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} />
            {!collapsed && (
              <span className="flex flex-1 items-center justify-between overflow-hidden">
                <span className="truncate">{item.label}</span>
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

  const isHomeActive = showHome && !activePanel;

  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col border-r bg-sidebar transition-[width] duration-200 ease-out",
        collapsed ? "w-12" : "w-56",
      )}
    >
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto overflow-x-hidden p-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onHomeClick}
              className={cn(
                "relative flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-all duration-150 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isHomeActive && "bg-sidebar-accent text-sidebar-accent-foreground",
              )}
            >
              {isHomeActive && (
                <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
              )}
              <Home className={cn("h-4 w-4 shrink-0", isHomeActive && "text-primary")} />
              {!collapsed && <span>Home</span>}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Home</TooltipContent>
        </Tooltip>

        {!collapsed && (
          <p className="mt-3 mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Free
          </p>
        )}
        {collapsed && <div className="my-1.5 border-t" />}
        {freeItems.map((item) => renderNavItem(item))}

        {!collapsed && (
          <p className="mt-3 mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Pro
          </p>
        )}
        {collapsed && <div className="my-1.5 border-t" />}
        {proItems.map((item) => renderNavItem(item))}

        {hasCollaboration && (
          <>
            {!collapsed && (
              <p className="mt-3 mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Add-ons
              </p>
            )}
            {collapsed && <div className="my-1.5 border-t" />}
            {renderNavItem({
              icon: Users,
              label: "Collaboration",
              id: "collaboration",
            })}
          </>
        )}
      </nav>

      {!collapsed && <UsageMeter onUpgrade={onUpgrade} />}
      <div className="flex items-center justify-center gap-1 border-t p-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/settings/team"
              className="flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Settings className="h-4 w-4" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">Team Settings</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className="flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
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
