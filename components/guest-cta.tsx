"use client";

import { LogIn, Sparkles } from "lucide-react";
import { useUserPlan } from "@/lib/auth/use-user-plan";

interface GuestCtaProps {
  action: "save" | "export" | "upgrade";
  className?: string;
}

const MESSAGES: Record<string, { title: string; description: string; href: string; label: string }> = {
  save: {
    title: "Sign up to save",
    description: "Create a free account to save your projects to the cloud and access them from anywhere.",
    href: "/sign-up",
    label: "Sign up free",
  },
  export: {
    title: "Sign up to export",
    description: "Create a free account to export your data as GeoJSON, CSV, or PNG.",
    href: "/sign-up",
    label: "Sign up free",
  },
  upgrade: {
    title: "Upgrade for more",
    description: "Get unlimited projects, advanced analysis, and team collaboration.",
    href: "/pricing",
    label: "View plans",
  },
};

export function GuestCta({ action, className = "" }: GuestCtaProps) {
  const { isGuest } = useUserPlan();

  if (!isGuest && action !== "upgrade") return null;

  const msg = MESSAGES[action];
  const Icon = action === "upgrade" ? Sparkles : LogIn;

  return (
    <div
      className={`flex flex-col items-center gap-3 rounded-lg border border-dashed bg-muted/30 p-5 text-center ${className}`}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">{msg.title}</h3>
        <p className="text-xs text-muted-foreground">{msg.description}</p>
      </div>
      <a
        href={msg.href}
        className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <Icon className="h-3.5 w-3.5" />
        {msg.label}
      </a>
    </div>
  );
}
