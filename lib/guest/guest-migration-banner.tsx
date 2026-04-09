"use client";

import { Upload, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { clearGuestData, getGuestFeatures, getGuestLayers } from "./guest-db";
import { clearGuestSession, hasGuestSession, loadGuestSession } from "./local-state";

/**
 * Shows a dismissible banner after sign-in if the user had a guest session
 * (localStorage) or guest layers (IndexedDB). Offers to save the guest work
 * as a new server-side project.
 */
export function GuestMigrationBanner() {
  const { user } = useUser();
  const [dismissed, setDismissed] = useState(false);
  const [hasData, setHasData] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const hasSession = hasGuestSession();
      const guestLayers = await getGuestLayers();
      if (!cancelled) setHasData(hasSession || guestLayers.length > 0);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const migrate = useMutation({
    mutationFn: async () => {
      const session = loadGuestSession();
      const guestLayers = await getGuestLayers();
      const guestFeatures = await getGuestFeatures();

      if (!session && guestLayers.length === 0) {
        throw new Error("No guest data to migrate");
      }

      const project = await apiFetch<{ id: string }>("/api/projects", {
        method: "POST",
        body: {
          name: "My Guest Session",
          state: session
            ? {
                viewState: session.viewState,
                basemap: session.basemap,
                terrainEnabled: session.terrainEnabled,
                buildings3DEnabled: session.buildings3DEnabled,
              }
            : {},
          isPublic: false,
        },
      });
      const projectId = project.id;

      const layerIdMap = new Map<string, string>();

      for (const layer of guestLayers) {
        const created = await apiFetch<{ id: string }>("/api/layers", {
          method: "POST",
          body: {
            name: layer.name,
            sourceType: layer.sourceType,
            style: layer.style,
            projectId,
          },
        });
        layerIdMap.set(layer.id, created.id);
      }

      const batchSize = 50;
      for (let i = 0; i < guestFeatures.length; i += batchSize) {
        const batch = guestFeatures.slice(i, i + batchSize);
        await Promise.all(
          batch.map((f) =>
            apiFetch("/api/features", {
              method: "POST",
              body: {
                geometry: f.geometry,
                properties: f.properties,
                layer: layerIdMap.get(f.layer) ?? f.layer,
                projectId,
              },
            }),
          ),
        );
      }

      return project;
    },
    onSuccess: () => {
      clearGuestSession();
      clearGuestData();
      setDismissed(true);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["layers"] });
      queryClient.invalidateQueries({ queryKey: ["features"] });
    },
  });

  if (!user || dismissed || !hasData) return null;

  return (
    <div className="flex items-center gap-3 border-b bg-primary/5 px-4 py-2">
      <p className="flex-1 text-xs text-foreground">
        You have unsaved work from your guest session. Save it as a project?
      </p>
      <button
        type="button"
        onClick={() => migrate.mutate()}
        disabled={migrate.isPending}
        className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        <Upload className="h-3 w-3" />
        {migrate.isPending ? "Saving..." : "Save as Project"}
      </button>
      <button
        type="button"
        onClick={() => {
          clearGuestSession();
          clearGuestData();
          setDismissed(true);
        }}
        className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
