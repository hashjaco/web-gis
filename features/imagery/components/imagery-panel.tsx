"use client";

import { Eye, EyeOff, Info, Loader2, Satellite, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useMapInstance } from "@/features/map/hooks/use-map-instance";
import { useMapStore } from "@/features/map/store";
import { useImagerySearch, type ImageryResult } from "../hooks/use-imagery-search";
import { useImageryStore, type ImageryLayer } from "../store";

export function ImageryPanel() {
  const [dateFrom, setDateFrom] = useState("2024-01-01");
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));
  const [maxCloud, setMaxCloud] = useState(20);
  const [collection, setCollection] = useState("sentinel-2-l2a");
  const viewState = useMapStore((s) => s.viewState);
  const { results, loading, error, search } = useImagerySearch();

  const activeLayers = useImageryStore((s) => s.layers);
  const addLayer = useImageryStore((s) => s.addLayer);
  const removeLayer = useImageryStore((s) => s.removeLayer);
  const toggleVisibility = useImageryStore((s) => s.toggleVisibility);
  const setOpacity = useImageryStore((s) => s.setOpacity);

  const map = useMapInstance();

  const handleSearch = () => {
    const { longitude, latitude, zoom } = viewState;
    const span = 360 / Math.pow(2, zoom);
    search({
      bbox: [longitude - span, latitude - span / 2, longitude + span, latitude + span / 2],
      dateFrom,
      dateTo,
      maxCloud,
      collection,
    });
  };

  const handleAdd = (item: ImageryResult) => {
    if (!item.cogUrl) return;
    addLayer({
      id: item.id,
      url: item.cogUrl,
      name: item.name,
      bbox: item.bbox,
    });
    if (map) {
      map.fitBounds(item.bbox, { padding: 40, maxZoom: 14 });
    }
  };

  return (
    <div className="flex h-full w-full flex-col bg-background">
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <Satellite className="h-4 w-4" />
        <h2 className="text-sm font-semibold">Satellite Imagery</h2>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="ml-auto h-3.5 w-3.5 cursor-help text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-56">
            Search and overlay satellite imagery from public STAC catalogs. Supports Sentinel-2 and Landsat collections.
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {activeLayers.length > 0 && (
          <ActiveLayersList
            layers={activeLayers}
            onRemove={removeLayer}
            onToggleVisibility={toggleVisibility}
            onSetOpacity={setOpacity}
          />
        )}

        <div>
          <div className="mb-0.5 flex items-center gap-1">
            <label htmlFor="img-collection" className="text-xs font-medium text-muted-foreground">
              Collection
            </label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 cursor-help text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>Satellite data collection to search from</TooltipContent>
            </Tooltip>
          </div>
          <select
            id="img-collection"
            value={collection}
            onChange={(e) => setCollection(e.target.value)}
            className="w-full rounded border bg-background px-2 py-1.5 text-sm"
          >
            <option value="sentinel-2-l2a">Sentinel-2 L2A</option>
            <option value="landsat-c2-l2">Landsat C2 L2</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="img-from" className="mb-0.5 block text-xs font-medium text-muted-foreground">
              From
            </label>
            <input
              id="img-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded border bg-background px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label htmlFor="img-to" className="mb-0.5 block text-xs font-medium text-muted-foreground">
              To
            </label>
            <input
              id="img-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded border bg-background px-2 py-1.5 text-sm"
            />
          </div>
        </div>

        <div>
          <div className="mb-0.5 flex items-center gap-1">
            <label htmlFor="img-cloud" className="text-xs font-medium text-muted-foreground">
              Max Cloud Cover: {maxCloud}%
            </label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 cursor-help text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>Filter out images with too much cloud cover</TooltipContent>
            </Tooltip>
          </div>
          <input
            id="img-cloud"
            type="range"
            min={0}
            max={100}
            value={maxCloud}
            onChange={(e) => setMaxCloud(Number(e.target.value))}
            className="w-full"
          />
        </div>

        {error && (
          <p className="rounded bg-destructive/10 px-2 py-1 text-xs text-destructive">{error}</p>
        )}

        {results.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">{results.length} results</p>
            {results.map((item) => (
              <ImageryResultCard
                key={item.id}
                item={item}
                isAdded={activeLayers.some((l) => l.id === item.id)}
                onAdd={handleAdd}
              />
            ))}
          </div>
        )}
      </div>

      <div className="border-t p-3">
        <button
          type="button"
          onClick={handleSearch}
          disabled={loading}
          className="flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
          Search Current View
        </button>
      </div>
    </div>
  );
}

function ActiveLayersList({
  layers,
  onRemove,
  onToggleVisibility,
  onSetOpacity,
}: {
  layers: ImageryLayer[];
  onRemove: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onSetOpacity: (id: string, opacity: number) => void;
}) {
  return (
    <div className="space-y-1.5 border-b pb-3">
      <p className="text-xs font-medium text-muted-foreground">
        Active Imagery ({layers.length})
      </p>
      {layers.map((layer) => (
        <div key={layer.id} className="rounded border p-2">
          <div className="flex items-center justify-between gap-1">
            <p className="min-w-0 flex-1 truncate text-xs font-medium">{layer.name}</p>
            <button
              type="button"
              onClick={() => onToggleVisibility(layer.id)}
              className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
            >
              {layer.isVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => onRemove(layer.id)}
              className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={layer.opacity}
            onChange={(e) => onSetOpacity(layer.id, Number(e.target.value))}
            className="mt-1 w-full"
          />
          <p className="text-right text-[10px] text-muted-foreground">{layer.opacity}%</p>
        </div>
      ))}
    </div>
  );
}

function ImageryResultCard({
  item,
  isAdded,
  onAdd,
}: {
  item: ImageryResult;
  isAdded: boolean;
  onAdd: (item: ImageryResult) => void;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="rounded border p-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium">{item.id.slice(0, 30)}...</p>
          <p className="text-xs text-muted-foreground">
            {item.date} &middot; {item.cloudCover.toFixed(0)}% cloud
          </p>
        </div>
        {item.thumbnail && !imgError ? (
          <img
            src={item.thumbnail}
            alt=""
            crossOrigin="anonymous"
            onError={() => setImgError(true)}
            className="h-10 w-10 rounded object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
            <Satellite className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => onAdd(item)}
            disabled={isAdded || !item.cogUrl}
            className="mt-1.5 w-full rounded bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 active:scale-[0.98] disabled:opacity-50"
          >
            {isAdded ? "Added" : "Add to Map"}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          {isAdded ? "Already added to map" : "Add this imagery as a raster layer"}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
