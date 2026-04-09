"use client";

import { ChevronDown, ChevronUp, Table2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import type { PanelImperativeHandle } from "react-resizable-panels";
import { useEditingStore } from "@/features/editing/store";
import { DrawToolbar } from "@/features/editing/components/draw-toolbar";
import { FeaturePopup } from "@/features/editing/components/feature-popup";
import { AttributeForm } from "@/features/editing/components/attribute-form";
import { LegendPanel } from "@/features/layers/components/legend-panel";
import { useLayerStore } from "@/features/layers/store";
import { AttributeTable } from "@/features/attribute-table/components/attribute-table";
import type { GeoFeature } from "@/features/editing/types";
import { useDeckLayers } from "@/features/visualization/hooks/use-deck-layers";
import { useVisualizationStore } from "@/features/visualization/store";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

const MapContainer = dynamic(
  () =>
    import("@/features/map/components/map-container").then(
      (mod) => mod.MapContainer,
    ),
  { ssr: false },
);

export default function DashboardPage() {
  const selectedFeatures = useEditingStore((s) => s.selectedFeatures);
  const clearSelection = useEditingStore((s) => s.clearSelection);
  const drawMode = useEditingStore((s) => s.drawMode);
  const setDrawMode = useEditingStore((s) => s.setDrawMode);
  const annotationMode = useEditingStore((s) => s.annotationMode);
  const setAnnotationMode = useEditingStore((s) => s.setAnnotationMode);

  const activeLayerId = useLayerStore((s) => s.activeLayerId);
  const vizDeckLayers = useDeckLayers();
  const pointCloudLayer = useVisualizationStore((s) => s.pointCloudLayer);
  const deckLayers = pointCloudLayer
    ? [...vizDeckLayers, pointCloudLayer]
    : vizDeckLayers;
  const [tableOpen, setTableOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<GeoFeature | null>(null);
  const tablePanelRef = useRef<PanelImperativeHandle>(null);

  const selectedFeature = selectedFeatures[0] ?? null;

  const handleEdit = (feature: GeoFeature) => {
    setEditingFeature(feature);
  };

  const handleEditClose = () => {
    setEditingFeature(null);
  };

  const handleSaved = () => {
    setEditingFeature(null);
    clearSelection();
  };

  const toggleTable = () => {
    if (tableOpen) {
      tablePanelRef.current?.collapse();
    } else {
      tablePanelRef.current?.expand();
    }
  };

  return (
    <ResizablePanelGroup orientation="vertical">
      <ResizablePanel defaultSize="75" minSize="30">
        <div className="relative h-full overflow-hidden">
          <MapContainer deckLayers={deckLayers} />

          <DrawToolbar
            drawMode={drawMode ?? "simple_select"}
            annotationMode={annotationMode}
            onModeChange={(mode) => {
              setDrawMode(mode);
            }}
            onAnnotation={(type) => {
              setAnnotationMode(annotationMode === type ? null : type);
            }}
          />

          <LegendPanel />

          {selectedFeature && !editingFeature && (
            <div className="absolute top-4 right-4 z-10">
              <FeaturePopup
                feature={selectedFeature}
                onClose={clearSelection}
                onEdit={handleEdit}
              />
            </div>
          )}

          {editingFeature && (
            <div className="absolute top-4 right-4 z-10">
              <AttributeForm
                feature={editingFeature}
                onClose={handleEditClose}
                onSaved={handleSaved}
              />
            </div>
          )}
        </div>
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel
        panelRef={tablePanelRef}
        defaultSize="25"
        minSize="5"
        maxSize="60"
        collapsible
        collapsedSize="0"
        onResize={(size) => {
          setTableOpen(size.asPercentage > 0);
        }}
      >
        <div className="flex h-full flex-col bg-background">
          <button
            type="button"
            onClick={toggleTable}
            className="flex w-full items-center gap-2 border-b px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-accent"
          >
            <Table2 className="h-3.5 w-3.5" />
            Attribute Table
            {tableOpen ? (
              <ChevronDown className="ml-auto h-3.5 w-3.5" />
            ) : (
              <ChevronUp className="ml-auto h-3.5 w-3.5" />
            )}
          </button>
          {tableOpen && (
            <div className="flex-1 overflow-hidden">
              <AttributeTable layers={activeLayerId ? [activeLayerId] : []} />
            </div>
          )}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
