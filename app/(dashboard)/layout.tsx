"use client";

import { useEffect, useRef, useState } from "react";
import type { PanelImperativeHandle } from "react-resizable-panels";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { PanelContent } from "@/components/layout/panel-content";
import { HomeView } from "@/features/home/components/home-view";
import { CreateProjectDialog } from "@/features/projects/components/create-project-dialog";
import { useAutoSave } from "@/features/projects/hooks/use-auto-save";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [showHome, setShowHome] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const featurePanelRef = useRef<PanelImperativeHandle>(null);

  useAutoSave();

  useEffect(() => {
    if (activePanel) {
      featurePanelRef.current?.expand();
    } else {
      featurePanelRef.current?.collapse();
    }
  }, [activePanel]);

  const handlePanelChange = (panel: string | null) => {
    setActivePanel(panel);
    if (panel !== null) setShowHome(false);
  };

  const handleHomeClick = () => {
    setShowHome(true);
    setActivePanel(null);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <AppHeader onCreateProject={() => setCreateDialogOpen(true)} />
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar
          activePanel={activePanel}
          showHome={showHome}
          onPanelChange={handlePanelChange}
          onHomeClick={handleHomeClick}
        />
        <ResizablePanelGroup orientation="horizontal">
          <ResizablePanel
            panelRef={featurePanelRef}
            defaultSize="20"
            minSize="15"
            maxSize="40"
            collapsible
            collapsedSize="0"
            onResize={(size) => {
              if (size.asPercentage === 0) setActivePanel(null);
            }}
          >
            <PanelContent activePanel={activePanel} />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize="80" minSize="50">
            {showHome ? (
              <HomeView
                onClose={() => setShowHome(false)}
                onPanelChange={handlePanelChange}
                onCreateProject={() => setCreateDialogOpen(true)}
              />
            ) : (
              <main className="relative h-full overflow-hidden">
                {children}
              </main>
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      <CreateProjectDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      />
    </div>
  );
}
