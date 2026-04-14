"use client";

import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";
import { cn } from "@/lib/utils";

interface HelpTooltipProps {
  title: string;
  description: string;
  learnMoreHref?: string;
  arcgisEquivalent?: string;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
}

export function HelpTooltip({
  title,
  description,
  learnMoreHref,
  arcgisEquivalent,
  side = "bottom",
  className,
}: HelpTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center justify-center text-muted-foreground transition-colors hover:text-foreground",
            className,
          )}
        >
          <HelpCircle className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side={side}
        className="max-w-72 space-y-1.5 bg-popover px-3 py-2.5 text-popover-foreground shadow-lg"
      >
        <p className="text-xs font-semibold">{title}</p>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          {description}
        </p>
        {arcgisEquivalent && (
          <p className="text-[10px] italic text-muted-foreground/80">
            In ArcGIS: {arcgisEquivalent}
          </p>
        )}
        {learnMoreHref && (
          <a
            href={learnMoreHref}
            className="block text-[11px] font-medium text-primary hover:underline"
          >
            Learn more
          </a>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
