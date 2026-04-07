"use client";

import { Loader2, MapPin, Search } from "lucide-react";
import { useState } from "react";
import { useMapStore } from "@/features/map/store";
import { useGeocode } from "../hooks/use-geocode";

export function GeocodeSearch() {
  const [open, setOpen] = useState(false);
  const { query, setQuery, results, loading } = useGeocode();
  const setViewState = useMapStore((s) => s.setViewState);
  const viewState = useMapStore((s) => s.viewState);

  const handleSelect = (lat: number, lon: number) => {
    setViewState({
      ...viewState,
      latitude: lat,
      longitude: lon,
      zoom: 14,
    });
    setOpen(false);
    setQuery("");
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-md border bg-background px-2 py-1.5">
        <Search className="h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search places..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="w-48 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {loading && (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 z-50 mt-1 w-80 rounded-md border bg-background shadow-lg">
          {results.map((result) => (
            <button
              key={result.placeId}
              type="button"
              onClick={() => handleSelect(result.lat, result.lon)}
              className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
            >
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="line-clamp-2">{result.displayName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
