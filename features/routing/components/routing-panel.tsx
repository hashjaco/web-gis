"use client";

import { ArrowDownUp, Crosshair, Info, Lock, Loader2, Route, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { apiFetch } from "@/lib/api/client";
import { useUserPlan } from "@/lib/auth/use-user-plan";
import { useRoute } from "../hooks/use-route";
import { useRoutingStore } from "../store";
import type { RoutingProfile } from "../types";
import { DirectionsList } from "./directions-list";

interface GeoResult {
  placeId: string;
  displayName: string;
  lat: number;
  lon: number;
}

function formatDistance(meters: number): string {
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}

function formatCoords(coords: [number, number]): string {
  return `${coords[0].toFixed(6)},${coords[1].toFixed(6)}`;
}

function LocationInput({
  id,
  label,
  value,
  onChange,
  field,
  showSearch = true,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (val: string) => void;
  field: "start" | "end";
  showSearch?: boolean;
}) {
  const pendingPick = useRoutingStore((s) => s.pendingPick);
  const startPick = useRoutingStore((s) => s.startPick);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const searchGeocode = async (q: string) => {
    if (q.length < 3) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const data = await apiFetch<GeoResult[]>(`/api/geocode?q=${encodeURIComponent(q)}`);
      setResults(data ?? []);
      setShowResults(true);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchInput = (q: string) => {
    setQuery(q);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchGeocode(q), 400);
  };

  const handleSelect = (result: GeoResult) => {
    onChange(`${result.lon.toFixed(6)},${result.lat.toFixed(6)}`);
    if (field === "start") {
      useRoutingStore.getState().resolvePick([result.lon, result.lat]);
      useRoutingStore.setState({ startCoords: [result.lon, result.lat] });
    } else {
      useRoutingStore.getState().resolvePick([result.lon, result.lat]);
      useRoutingStore.setState({ endCoords: [result.lon, result.lat] });
    }
    setShowResults(false);
    setQuery("");
  };

  return (
    <div>
      <label htmlFor={id} className="mb-0.5 block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <div className="flex gap-1">
        <div className="relative flex-1">
          <input
            id={id}
            type="text"
            placeholder="-80.0,35.0"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded border bg-background px-2 py-1.5 text-sm focus:ring-1 focus:ring-ring focus:outline-none"
          />
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => startPick(field)}
              className={cn(
                "shrink-0 rounded border p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                pendingPick === field && "border-primary bg-primary/10 text-primary",
              )}
            >
              <Crosshair className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Pick location from map</TooltipContent>
        </Tooltip>
      </div>

      {showSearch ? (
        <div className="relative mt-1">
          <div className="flex gap-1">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search location..."
                value={query}
                onChange={(e) => handleSearchInput(e.target.value)}
                onFocus={() => results.length > 0 && setShowResults(true)}
                onBlur={() => setTimeout(() => setShowResults(false), 200)}
                className="w-full rounded border bg-background px-2 py-1 text-xs focus:ring-1 focus:ring-ring focus:outline-none"
              />
              {searching && (
                <Loader2 className="absolute top-1 right-2 h-3 w-3 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>

          {showResults && results.length > 0 && (
            <div className="absolute z-20 mt-0.5 max-h-32 w-full overflow-y-auto rounded border bg-background shadow-md">
              {results.map((r) => (
                <button
                  key={r.placeId}
                  type="button"
                  onMouseDown={() => handleSelect(r)}
                  className="w-full px-2 py-1.5 text-left text-xs hover:bg-accent"
                >
                  <p className="truncate font-medium">{r.displayName}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
          <Lock className="h-2.5 w-2.5" />
          Location search requires Pro
        </p>
      )}
    </div>
  );
}

const standardProfiles: { value: RoutingProfile; label: string; tip: string }[] = [
  { value: "car", label: "Car", tip: "Passenger vehicle routing" },
  { value: "bike", label: "Bicycle", tip: "Bicycle-friendly routes" },
  { value: "foot", label: "Walking", tip: "Pedestrian walking routes" },
];

const proProfiles: { value: RoutingProfile; label: string; tip: string }[] = [
  { value: "truck", label: "Truck", tip: "Heavy vehicle routing (avoids weight-limited roads)" },
  { value: "wheelchair", label: "Wheelchair", tip: "Accessible routes for wheelchair users" },
];

export function RoutingPanel() {
  const [startStr, setStartStr] = useState("");
  const [endStr, setEndStr] = useState("");
  const [profile, setProfile] = useState<RoutingProfile>("car");
  const { route, loading, error, calculateRoute, clearRoute } = useRoute();
  const { isPro } = useUserPlan();

  const profiles = isPro
    ? [...standardProfiles, ...proProfiles]
    : standardProfiles;

  const startCoords = useRoutingStore((s) => s.startCoords);
  const endCoords = useRoutingStore((s) => s.endCoords);

  useEffect(() => {
    if (startCoords) setStartStr(formatCoords(startCoords));
  }, [startCoords]);

  useEffect(() => {
    if (endCoords) setEndStr(formatCoords(endCoords));
  }, [endCoords]);

  const handleCalculate = () => {
    const start = startStr.split(",").map(Number) as [number, number];
    const end = endStr.split(",").map(Number) as [number, number];
    if (start.length === 2 && end.length === 2) {
      calculateRoute(start, end, profile);
    }
  };

  const handleSwap = () => {
    const tmpStr = startStr;
    setStartStr(endStr);
    setEndStr(tmpStr);
    const s = useRoutingStore.getState();
    const tmpCoords = s.startCoords;
    useRoutingStore.setState({
      startCoords: s.endCoords,
      endCoords: tmpCoords,
    });
  };

  return (
    <div className="flex h-full w-full flex-col bg-background">
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <Route className="h-4 w-4" />
        <h2 className="text-sm font-semibold">Directions</h2>
        <HelpTooltip
          title="Directions & Routing"
          description="Find the best route between two places. Enter coordinates, search for locations, or click directly on the map to set your start and end points."
          arcgisEquivalent="Network Analyst / Directions"
          className="ml-auto"
        />
      </div>

      <div className="space-y-3 p-3">
        <LocationInput
          id="route-start"
          label="Start (lon,lat)"
          value={startStr}
          onChange={setStartStr}
          field="start"
          showSearch={isPro}
        />

        <div className="flex justify-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleSwap}
                className="rounded-md border p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <ArrowDownUp className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Swap start and end</TooltipContent>
          </Tooltip>
        </div>

        <LocationInput
          id="route-end"
          label="End (lon,lat)"
          value={endStr}
          onChange={setEndStr}
          field="end"
          showSearch={isPro}
        />

        <div>
          <div className="flex items-center gap-1">
            <label
              htmlFor="route-profile"
              className="mb-0.5 block text-xs font-medium text-muted-foreground"
            >
              Profile
            </label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 cursor-help text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>Choose a transportation mode for route calculation</TooltipContent>
            </Tooltip>
          </div>
          <select
            id="route-profile"
            value={profile}
            onChange={(e) => setProfile(e.target.value as RoutingProfile)}
            className="w-full rounded border bg-background px-2 py-1.5 text-sm"
          >
            {profiles.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleCalculate}
                disabled={loading || !startStr || !endStr}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[0.97] disabled:opacity-50"
              >
                {loading && <Loader2 className="h-3 w-3 animate-spin" />}
                Calculate
              </button>
            </TooltipTrigger>
            <TooltipContent>Calculate the shortest route</TooltipContent>
          </Tooltip>
          {route && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={clearRoute}
                  className="rounded-md bg-secondary p-1.5 text-secondary-foreground transition-colors hover:bg-secondary/80"
                >
                  <X className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Clear route</TooltipContent>
            </Tooltip>
          )}
        </div>

        {error && (
          <p className="rounded bg-destructive/10 px-2 py-1 text-xs text-destructive">
            {error}
          </p>
        )}
      </div>

      {route && (
        <div className="flex-1 overflow-y-auto border-t">
          <div className="flex items-center justify-between bg-muted/50 px-3 py-2 text-xs">
            <span className="font-medium">
              {formatDistance(route.distance)}
            </span>
            <span className="text-muted-foreground">
              {formatDuration(route.duration)}
            </span>
          </div>
          <div className="p-2">
            <DirectionsList steps={route.steps} />
          </div>
        </div>
      )}
    </div>
  );
}
