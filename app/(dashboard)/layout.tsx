"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { PanelImperativeHandle } from "react-resizable-panels";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { CommandPalette } from "@/components/command-palette";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";
import { PricingModal } from "@/components/pricing-modal";
import { PanelContent } from "@/components/layout/panel-content";
import { HomeView } from "@/features/home/components/home-view";
import { CreateProjectDialog } from "@/features/projects/components/create-project-dialog";
import { useAutoSave } from "@/features/projects/hooks/use-auto-save";
import { useSaveProject } from "@/features/projects/hooks/use-project-mutations";
import { useProjectStore } from "@/features/projects/store";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { useGuestPersistence } from "@/lib/guest/use-guest-persistence";
import { GuestMigrationBanner } from "@/lib/guest/guest-migration-banner";
import { CollaborationProvider } from "@/features/collaboration/components/collaboration-provider";
import { useEditingStore } from "@/features/editing/store";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [showHome, setShowHome] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);
  const featurePanelRef = useRef<PanelImperativeHandle>(null);
  const pathname = usePathname();
  const router = useRouter();

  const isSettingsRoute = pathname.startsWith("/settings");

  const save = useSaveProject();

  useAutoSave();
  useGuestPersistence();

  const selectedFeatures = useEditingStore((s) => s.selectedFeatures);
  useEffect(() => {
    if (selectedFeatures.length > 0) {
      setActivePanel("editing");
      setShowHome(false);
    }
  }, [selectedFeatures]);

  const handleSave = () => {
    const project = useProjectStore.getState().activeProject;
    if (project) {
      save.mutate(project.id);
    } else {
      setCreateDialogOpen(true);
    }
  };

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
    if (isSettingsRoute) router.push("/");
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <AppHeader onCreateProject={() => setCreateDialogOpen(true)} />
      <GuestMigrationBanner />
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar
          activePanel={activePanel}
          showHome={showHome}
          onPanelChange={handlePanelChange}
          onHomeClick={handleHomeClick}
          onUpgrade={() => setPricingOpen(true)}
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
            <PanelContent activePanel={activePanel} onUpgrade={() => setPricingOpen(true)} />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize="80" minSize="50">
            {isSettingsRoute ? (
              <main className="relative h-full overflow-hidden">
                {children}
              </main>
            ) : showHome ? (
              <HomeView
                onClose={() => setShowHome(false)}
                onPanelChange={handlePanelChange}
                onCreateProject={() => setCreateDialogOpen(true)}
              />
            ) : (
              <CollaborationProvider>
                <main className="relative h-full overflow-hidden">
                  {children}
                </main>
              </CollaborationProvider>
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      <CreateProjectDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      />
      <CommandPalette
        onPanelChange={handlePanelChange}
        onHomeClick={handleHomeClick}
        onCreateProject={() => setCreateDialogOpen(true)}
      />
      <PricingModal open={pricingOpen} onClose={() => setPricingOpen(false)} />
      <KeyboardShortcuts
        onPanelChange={(panel) => {
          setActivePanel((current) => (current === panel ? null : panel));
          setShowHome(false);
        }}
        onHomeClick={handleHomeClick}
        onSave={handleSave}
      />
    </div>
  );
}
