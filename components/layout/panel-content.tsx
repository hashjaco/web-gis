"use client";

import { LayerPanel } from "@/features/layers/components/layer-panel";
import { EditPanel } from "@/features/editing/components/edit-panel";
import { SpatialQueryPanel } from "@/features/analysis/components/spatial-query-panel";
import { RoutingPanel } from "@/features/routing/components/routing-panel";
import { MediaPanel } from "@/features/media/components/media-panel";
import { VizPanel } from "@/features/visualization/components/viz-panel";
import { ImageryPanel } from "@/features/imagery/components/imagery-panel";
import { ImportPanel } from "@/features/import/components/import-panel";
import { WorkflowPanel } from "@/features/workflows/components/workflow-panel";
import { GeoAIPanel } from "@/features/geoai/components/geoai-panel";
import { DashboardBuilder } from "@/features/dashboard/components/dashboard-builder";
import { ScriptingPanel } from "@/features/scripting/components/scripting-panel";
import { useLayerStore } from "@/features/layers/store";
import dynamic from "next/dynamic";
import { Download, FileImage, FileJson, FileSpreadsheet, Lock, LogIn, Printer, Sparkles } from "lucide-react";

const CollaborationPanel = dynamic(
  () =>
    import("@/features/collaboration/components/collaboration-panel").then(
      (m) => m.CollaborationPanel,
    ),
  { ssr: false },
);
import { useState } from "react";
import { useExport } from "@/features/export/hooks/use-export";
import { PrintDialog } from "@/features/export/components/print-dialog";
import { useUserPlan } from "@/lib/auth/use-user-plan";
import { FEATURE_PLAN_REQUIREMENTS } from "@/lib/auth/plans";

interface PanelContentProps {
  activePanel: string | null;
  onUpgrade?: () => void;
}

function UpgradeUpsell({ feature, onUpgrade }: { feature: string; onUpgrade?: () => void }) {
  const { isGuest } = useUserPlan();
  const required = FEATURE_PLAN_REQUIREMENTS[feature] ?? "free";
  const needsAccount = isGuest && required === "free";

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-background p-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <Lock className="h-6 w-6 text-primary" />
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">
          {needsAccount ? "Account Required" : "Pro Feature"}
        </h3>
        <p className="text-xs text-muted-foreground">
          {needsAccount ? (
            <>
              <span className="font-medium capitalize">{feature}</span> requires
              a free account. Sign up to unlock this feature.
            </>
          ) : (
            <>
              <span className="font-medium capitalize">{feature}</span> is
              available on the Pro plan. Upgrade to unlock advanced GIS
              capabilities.
            </>
          )}
        </p>
      </div>
      {needsAccount ? (
        <a
          href="/sign-up"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <LogIn className="h-3.5 w-3.5" />
          Sign up free
        </a>
      ) : (
        <button
          type="button"
          onClick={onUpgrade}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Upgrade to Pro
        </button>
      )}
    </div>
  );
}

function ExportPanel() {
  const { exportPng, exportGeoJson, exportCsv } = useExport();
  const [printOpen, setPrintOpen] = useState(false);

  const items = [
    { label: "Export as PNG", icon: FileImage, action: exportPng },
    { label: "Export GeoJSON", icon: FileJson, action: () => exportGeoJson() },
    { label: "Export CSV", icon: FileSpreadsheet, action: () => exportCsv() },
    { label: "Print Map", icon: Printer, action: () => setPrintOpen(true) },
  ];

  return (
    <div className="flex h-full w-full flex-col bg-background">
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <Download className="h-4 w-4" />
        <h2 className="text-sm font-semibold">Export</h2>
      </div>
      <div className="flex-1 space-y-1 p-2">
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={item.action}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
          >
            <item.icon className="h-4 w-4 text-muted-foreground" />
            {item.label}
          </button>
        ))}
      </div>
      <PrintDialog open={printOpen} onClose={() => setPrintOpen(false)} />
    </div>
  );
}

export function PanelContent({ activePanel, onUpgrade }: PanelContentProps) {
  const layers = useLayerStore((s) => s.layers);
  const { canAccess } = useUserPlan();

  if (!activePanel) return null;

  if (!canAccess(activePanel)) {
    return <UpgradeUpsell feature={activePanel} onUpgrade={onUpgrade} />;
  }

  switch (activePanel) {
    case "home":
      return null;
    case "layers":
      return <LayerPanel />;
    case "editing":
      return <EditPanel />;
    case "analysis":
      return (
        <SpatialQueryPanel
          layers={layers.map((l) => ({ id: l.id, name: l.name }))}
        />
      );
    case "visualization":
      return <VizPanel />;
    case "imagery":
      return <ImageryPanel />;
    case "import":
      return <ImportPanel />;
    case "geoai":
      return <GeoAIPanel />;
    case "workflows":
      return <WorkflowPanel />;
    case "dashboard":
      return <DashboardBuilder />;
    case "scripting":
      return <ScriptingPanel />;
    case "routing":
      return <RoutingPanel />;
    case "media":
      return <MediaPanel />;
    case "export":
      return <ExportPanel />;
    case "collaboration":
      return <CollaborationPanel />;
    default:
      return null;
  }
}
