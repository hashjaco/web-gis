"use client";

import {
  AllCommunityModule,
  type ColDef,
  type GetRowIdParams,
  type GridApi,
  type GridReadyEvent,
  type RowClickedEvent,
  type SelectionChangedEvent,
  themeQuartz,
} from "ag-grid-community";
import { AgGridProvider, AgGridReact } from "ag-grid-react";
import * as turf from "@turf/turf";
import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";
import { useEditingStore } from "@/features/editing/store";
import { useMapStore } from "@/features/map/store";
import { useTableData } from "../hooks/use-table-data";
import { ColorCell } from "./color-cell";
import { SetFilter } from "./set-filter";
import { TableToolbar } from "./table-toolbar";

interface AttributeTableProps {
  layers?: string[];
}

function formatHeader(key: string): string {
  return key
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const gridTheme = themeQuartz.withParams({
  fontSize: 12,
  spacing: 4,
});

const modules = [AllCommunityModule];

const rowSelection = {
  mode: "multiRow" as const,
  selectAll: "filtered" as const,
};

const defaultColDef: ColDef = { sortable: true, resizable: true };

const autoSizeStrategy = {
  type: "fitGridWidth" as const,
  defaultMinWidth: 100,
};

export function AttributeTable({ layers }: AttributeTableProps) {
  const {
    data,
    columns: propertyKeys,
    loading,
    refetch,
  } = useTableData({ layers });
  const selectedFeatures = useEditingStore((s) => s.selectedFeatures);
  const setSelectedFeatures = useEditingStore((s) => s.setSelectedFeatures);
  const selectedIds = new Set(selectedFeatures.map((f) => f.id));
  const selectedIdArray = [...selectedIds];
  const { resolvedTheme } = useTheme();
  const gridApiRef = useRef<GridApi | null>(null);
  const isSyncingFromStore = useRef(false);

  const fixedCols: ColDef[] = [
    {
      field: "_id",
      headerName: "ID",
      valueFormatter: (params) => {
        const v = String(params.value ?? "");
        return v.length > 8 ? `${v.slice(0, 8)}...` : v;
      },
    },
    {
      field: "_layer",
      headerName: "Layer",
      filter: SetFilter,
    },
    {
      field: "_geometry_type",
      headerName: "Type",
      filter: SetFilter,
    },
  ];

  const dynamicCols: ColDef[] = propertyKeys.map((key) => ({
    field: key,
    headerName: formatHeader(key),
    filter: true,
    ...(key === "layer_color" && { cellRenderer: ColorCell }),
  }));

  const colDefs = [...fixedCols, ...dynamicCols];

  const rowData = data.map((d) => ({
    _id: d.id,
    _layer: d.layer,
    _geometry_type: d.geometryType,
    _geometry: d.geometry,
    ...d.properties,
  }));

  const onSelectionChanged = (event: SelectionChangedEvent) => {
    if (isSyncingFromStore.current) return;

    const selectedRows = event.api.getSelectedRows();
    setSelectedFeatures(
      selectedRows.map((row: Record<string, unknown>) => ({
        id: row._id as string,
        geometry:
          (row._geometry as GeoJSON.Geometry) ?? {
            type: "Point" as const,
            coordinates: [0, 0],
          },
        properties: row,
        layer: (row._layer as string) ?? "",
        createdAt: "",
        updatedAt: "",
      })),
    );
  };

  const onRowClicked = (event: RowClickedEvent) => {
    const geom = event.data?._geometry as GeoJSON.Geometry | undefined;
    if (!geom || !("coordinates" in geom)) return;

    try {
      const feature: GeoJSON.Feature = {
        type: "Feature",
        geometry: geom,
        properties: {},
      };
      const center = turf.centroid(feature);
      const [lng, lat] = center.geometry.coordinates;

      if (Math.abs(lng) > 180 || Math.abs(lat) > 90) return;

      const isArea =
        geom.type === "Polygon" || geom.type === "MultiPolygon";
      const zoom = isArea ? 14 : 16;

      useMapStore.getState().requestFlyTo(lng, lat, zoom);
    } catch {}
  };

  const onGridReady = (event: GridReadyEvent) => {
    gridApiRef.current = event.api;
  };

  useEffect(() => {
    const api = gridApiRef.current;
    if (!api) return;

    isSyncingFromStore.current = true;
    api.forEachNode((node) => {
      const id = node.data?._id as string;
      const shouldSelect = selectedIds.has(id);
      if (node.isSelected() !== shouldSelect) {
        node.setSelected(shouldSelect);
      }
    });
    isSyncingFromStore.current = false;
  }, [selectedIds]);

  const getRowId = (params: GetRowIdParams) => String(params.data._id);

  if (!layers || layers.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-background text-sm text-muted-foreground">
        Select one or more layers to view features
      </div>
    );
  }

  return (
    <AgGridProvider modules={modules}>
      <div className="flex h-full flex-col bg-background">
        <TableToolbar
          data={data}
          columns={propertyKeys}
          selectedIds={selectedIdArray}
          onRefresh={refetch}
          onExportCsv={() => gridApiRef.current?.exportDataAsCsv()}
          onSelectAll={() => {
            const api = gridApiRef.current;
            if (!api) return;
            const filtered: { id: string; geometry: GeoJSON.Geometry | null; properties: Record<string, unknown>; layer: string }[] = [];
            api.forEachNodeAfterFilterAndSort((node) => {
              if (node.data) {
                filtered.push({
                  id: node.data._id as string,
                  geometry: (node.data._geometry as GeoJSON.Geometry) ?? null,
                  properties: node.data,
                  layer: (node.data._layer as string) ?? "",
                });
              }
            });
            setSelectedFeatures(
              filtered.map((d) => ({
                id: d.id,
                geometry: d.geometry ?? { type: "Point" as const, coordinates: [0, 0] },
                properties: d.properties,
                layer: d.layer,
                createdAt: "",
                updatedAt: "",
              })),
            );
          }}
          onClearSelection={() => setSelectedFeatures([])}
        />
        <div
          className="flex-1"
          data-ag-theme-mode={resolvedTheme === "dark" ? "dark" : "light"}
        >
          <AgGridReact
            theme={gridTheme}
            rowData={rowData}
            columnDefs={colDefs}
            rowSelection={rowSelection}
            onSelectionChanged={onSelectionChanged}
            onRowClicked={onRowClicked}
            onGridReady={onGridReady}
            getRowId={getRowId}
            loading={loading}
            defaultColDef={defaultColDef}
            autoSizeStrategy={autoSizeStrategy}
          />
        </div>
      </div>
    </AgGridProvider>
  );
}
