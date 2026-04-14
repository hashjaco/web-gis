"use client";

import {
  BarChart3,
  Brain,
  ChevronDown,
  ChevronRight,
  Download,
  Eye,
  FileUp,
  GraduationCap,
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
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useUserPlan } from "@/lib/auth/use-user-plan";
import { FEATURE_PLAN_REQUIREMENTS } from "@/lib/auth/plans";
import { UsageMeter } from "./usage-meter";

interface NavItem {
  icon: React.ElementType;
  label: string;
  id: string;
  description: string;
}

const essentialItems: NavItem[] = [
  { icon: Layers, label: "Layers", id: "layers", description: "Manage and style your map data" },
  { icon: FileUp, label: "Import", id: "import", description: "Upload files to the map" },
  { icon: Pencil, label: "Draw & Edit", id: "editing", description: "Draw and modify features" },
  { icon: Route, label: "Directions", id: "routing", description: "Find routes between places" },
  { icon: Download, label: "Export", id: "export", description: "Download maps and data" },
];

const advancedItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", id: "dashboard", description: "Build interactive dashboards" },
  { icon: BarChart3, label: "Analyze", id: "analysis", description: "Run spatial calculations" },
  { icon: Eye, label: "Visualize", id: "visualization", description: "Heatmaps, clusters, and more" },
  { icon: Satellite, label: "Imagery", id: "imagery", description: "Work with satellite data" },
  { icon: Brain, label: "GeoAI", id: "geoai", description: "AI-powered analysis" },
  { icon: Workflow, label: "Workflows", id: "workflows", description: "Automate GIS tasks" },
  { icon: Terminal, label: "Scripting", id: "scripting", description: "Write custom scripts" },
  { icon: Video, label: "Media", id: "media", description: "Video and image overlays" },
];

const SIDEBAR_MODE_KEY = "shimgis-sidebar-mode";

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
  const [advancedExpanded, setAdvancedExpanded] = useState(false);
  const { canAccess, hasCollaboration, isPro } = useUserPlan();

  useEffect(() => {
    try {
      if (localStorage.getItem(SIDEBAR_MODE_KEY) === "expanded") {
        setAdvancedExpanded(true);
      }
    } catch { /* noop */ }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        SIDEBAR_MODE_KEY,
        advancedExpanded ? "expanded" : "collapsed",
      );
    } catch {
      /* noop */
    }
  }, [advancedExpanded]);

  const hasActiveAdvanced = advancedItems.some(
    (item) => activePanel === item.id,
  );
  const showAdvanced = advancedExpanded || hasActiveAdvanced || isPro;

  function renderNavItem(item: NavItem, showDescription: boolean) {
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
              <span className="flex flex-1 flex-col items-start overflow-hidden">
                <span className="flex w-full items-center justify-between">
                  <span className="truncate">{item.label}</span>
                  {locked && <Lock className="h-3 w-3 text-muted-foreground" />}
                </span>
                {showDescription && (
                  <span className="truncate text-[10px] font-normal text-muted-foreground">
                    {item.description}
                  </span>
                )}
              </span>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">
          {locked
            ? `${item.label} — ${(FEATURE_PLAN_REQUIREMENTS[item.id] ?? "pro") === "edu" ? "Student or Pro plan" : "Upgrade to Pro"}`
            : `${item.label}: ${item.description}`}
        </TooltipContent>
      </Tooltip>
    );
  }

  const isHomeActive = showHome && !activePanel;

  return (
    <aside
      data-tour="sidebar"
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
            Essentials
          </p>
        )}
        {collapsed && <div className="my-1.5 border-t" />}
        {essentialItems.map((item) => renderNavItem(item, !collapsed))}

        {!collapsed ? (
          <button
            type="button"
            onClick={() => setAdvancedExpanded(!showAdvanced)}
            className="mt-3 mb-1 flex w-full items-center gap-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
          >
            {showAdvanced ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            Advanced Tools
          </button>
        ) : (
          <div className="my-1.5 border-t" />
        )}
        {(collapsed || showAdvanced) &&
          advancedItems.map((item) => renderNavItem(item, !collapsed && !isPro))}

        {hasCollaboration && (
          <>
            {!collapsed && (
              <p className="mt-3 mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Add-ons
              </p>
            )}
            {collapsed && <div className="my-1.5 border-t" />}
            {renderNavItem(
              {
                icon: Users,
                label: "Collaboration",
                id: "collaboration",
                description: "Real-time teamwork on maps",
              },
              !collapsed,
            )}
          </>
        )}

        {!collapsed && (
          <>
            <div className="my-1.5 border-t" />
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() =>
                    onPanelChange(activePanel === "learn" ? null : "learn")
                  }
                  className={cn(
                    "relative flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-all duration-150 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    activePanel === "learn" &&
                      "bg-sidebar-accent text-sidebar-accent-foreground",
                  )}
                >
                  {activePanel === "learn" && (
                    <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
                  )}
                  <GraduationCap
                    className={cn(
                      "h-4 w-4 shrink-0",
                      activePanel === "learn" && "text-primary",
                    )}
                  />
                  <span className="flex flex-col items-start overflow-hidden">
                    <span className="truncate">Learn GIS</span>
                    <span className="truncate text-[10px] font-normal text-muted-foreground">
                      Concepts, tutorials, exercises
                    </span>
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                Learn GIS: Concepts, tutorials, and guided exercises
              </TooltipContent>
            </Tooltip>
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
