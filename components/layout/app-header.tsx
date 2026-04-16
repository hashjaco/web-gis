"use client";

import { OrganizationSwitcher, Show, UserButton } from "@clerk/nextjs";
import { Check, Cloud, Link2, Loader2, Save } from "lucide-react";
import { LogoMark } from "@/components/logo";
import { useEffect, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useProjectStore } from "@/features/projects/store";
import { useSaveProject } from "@/features/projects/hooks/use-project-mutations";
import { GeocodeSearch } from "@/features/search/components/geocode-search";
import { useUrlState } from "@/features/sharing/hooks/use-url-state";
import { OnlineIndicator } from "./online-indicator";
import { ThemeToggle } from "./theme-toggle";

interface AppHeaderProps {
  onCreateProject?: () => void;
}

function SaveStatus() {
  const activeProject = useProjectStore((s) => s.activeProject);
  const isDirty = useProjectStore((s) => s.isDirty);
  const isSaving = useProjectStore((s) => s.isSaving);
  const lastSavedAt = useProjectStore((s) => s.lastSavedAt);

  if (!activeProject) return null;

  if (isSaving) {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Saving...
      </span>
    );
  }

  if (isDirty) {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Cloud className="h-3 w-3" />
        Unsaved changes
      </span>
    );
  }

  if (lastSavedAt) {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Check className="h-3 w-3" />
        Saved
      </span>
    );
  }

  return null;
}

export function AppHeader({ onCreateProject }: AppHeaderProps) {
  const { copyShareLink } = useUrlState();
  const [copied, setCopied] = useState(false);
  const activeProject = useProjectStore((s) => s.activeProject);
  const save = useSaveProject();

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  const handleCopy = async () => {
    await copyShareLink();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (activeProject) {
      save.mutate(activeProject.id);
    } else {
      onCreateProject?.();
    }
  };

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-3">
        <a
          href={process.env.NEXT_PUBLIC_MARKETING_URL ?? "/"}
          className="flex items-center gap-1.5 transition-opacity hover:opacity-80"
        >
          <LogoMark size={28} />
          <span className="text-sm font-semibold tracking-tight">
            <span className="text-primary">Shim</span>
            <span>GIS</span>
          </span>
        </a>
        {activeProject && (
          <>
            <span className="text-muted-foreground">/</span>
            <span className="max-w-[200px] truncate text-sm font-medium">
              {activeProject.name}
            </span>
            <SaveStatus />
          </>
        )}
      </div>

      <GeocodeSearch />

      <div className="flex items-center gap-3">
        <Show when="signed-in">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                data-tour="save"
                onClick={handleSave}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <Save className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {activeProject ? "Save project" : "Save as new project"}
            </TooltipContent>
          </Tooltip>
        </Show>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              data-tour="save"
              onClick={handleCopy}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Link2 className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>{copied ? "Copied!" : "Copy share link"}</TooltipContent>
        </Tooltip>
        <ThemeToggle />
        <OnlineIndicator />
        <Show when="signed-in">
          <OrganizationSwitcher
            hidePersonal={false}
            appearance={{
              elements: {
                rootBox: "flex items-center",
                organizationSwitcherTrigger:
                  "rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors",
              },
            }}
          />
          <UserButton />
        </Show>
        <Show when="signed-out">
          <a
            href="/pricing"
            className="rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Pricing
          </a>
          <a
            href="/sign-in"
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Sign in
          </a>
        </Show>
      </div>
    </header>
  );
}
