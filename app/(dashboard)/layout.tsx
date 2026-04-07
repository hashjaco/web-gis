"use client";

import { useEffect, useRef, useState } from "react";
import type { PanelImperativeHandle } from "react-resizable-panels";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { PanelContent } from "@/components/layout/panel-content";
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
  const featurePanelRef = useRef<PanelImperativeHandle>(null);

  useEffect(() => {
    if (activePanel) {
      featurePanelRef.current?.expand();
    } else {
      featurePanelRef.current?.collapse();
    }
  }, [activePanel]);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <AppHeader />
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar activePanel={activePanel} onPanelChange={setActivePanel} />
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
            <main className="relative h-full overflow-hidden">{children}</main>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
