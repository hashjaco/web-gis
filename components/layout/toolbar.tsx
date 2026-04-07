"use client";

import { cn } from "@/lib/utils";

interface ToolbarProps {
  children?: React.ReactNode;
  className?: string;
}

export function Toolbar({ children, className }: ToolbarProps) {
  return (
    <div
      className={cn(
        "absolute top-4 right-4 z-10 flex flex-col gap-1 rounded-lg border bg-background/90 p-1 shadow-sm backdrop-blur-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}
