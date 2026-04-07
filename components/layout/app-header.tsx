"use client";

import { Show, UserButton } from "@clerk/nextjs";
import { Link2, Map } from "lucide-react";
import { useEffect, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { GeocodeSearch } from "@/features/search/components/geocode-search";
import { useUrlState } from "@/features/sharing/hooks/use-url-state";
import { OnlineIndicator } from "./online-indicator";
import { ThemeToggle } from "./theme-toggle";

export function AppHeader() {
  const { copyShareLink } = useUrlState();
  const [copied, setCopied] = useState(false);

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

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-2">
        <Map className="h-5 w-5 text-primary" />
        <span className="text-sm font-semibold tracking-tight">ShimGIS</span>
      </div>

      <GeocodeSearch />

      <div className="flex items-center gap-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
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
          <UserButton />
        </Show>
        <Show when="signed-out">
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
