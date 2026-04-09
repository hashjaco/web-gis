"use client";

import { Check, Loader2, Mail, Sparkles, Users, X, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useUserPlan } from "@/lib/auth/use-user-plan";
import { ADD_ON_REQUIREMENTS, hasAccess } from "@/lib/auth/plans";
import { apiFetch } from "@/lib/api/client";

interface PricingModalProps {
  open: boolean;
  onClose: () => void;
}

interface PlanTier {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  cta: string;
  highlight?: boolean;
  planKey: string;
}

const COLLABORATION_FEATURES = [
  "Live cursors on the map",
  "Real-time presence & user awareness",
  "Synchronized feature editing",
  "Real-time layer changes",
  "Follow mode (sync to a collaborator's view)",
  "Spatial comments & discussion threads",
];

const TIERS: PlanTier[] = [
  {
    name: "Free",
    price: "$0",
    description: "For individuals getting started with web GIS",
    planKey: "free",
    features: [
      "3 projects, 10 layers",
      "Feature editing & drawing",
      "Data import (GeoJSON, Shapefile, KML, CSV)",
      "Geocoding & routing",
      "Export (PNG, GeoJSON, CSV)",
      "50 MB storage",
    ],
    cta: "Current Plan",
  },
  {
    name: "Pro",
    price: "$29",
    period: "/mo",
    description: "For professionals who need advanced tools",
    planKey: "pro",
    highlight: true,
    features: [
      "Everything in Free",
      "Unlimited projects & layers",
      "Spatial analysis & visualization",
      "Satellite imagery sources",
      "GeoAI / ML inference",
      "Workflow builder & scripting",
      "Dashboard builder",
      "5 GB storage",
      "Priority support",
    ],
    cta: "Upgrade to Pro",
  },
  {
    name: "Team",
    price: "$19",
    period: "/seat/mo",
    description: "For teams collaborating on geospatial data",
    planKey: "team",
    features: [
      "Everything in Pro",
      "Shared workspace & projects",
      "Role-based access (admin/editor/viewer)",
      "50 GB org storage",
      "Audit log",
      "Min 3 seats",
    ],
    cta: "Start Team Trial",
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For organizations with advanced requirements",
    planKey: "enterprise",
    features: [
      "Everything in Team",
      "SSO / SAML via Clerk",
      "Unlimited storage",
      "SLA & dedicated support",
      "Custom integrations",
      "On-prem option",
    ],
    cta: "Contact Sales",
  },
];

export function PricingModal({ open, onClose }: PricingModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { plan: currentPlan, hasCollaboration } = useUserPlan();
  const { user } = useUser();
  const [toggling, setToggling] = useState(false);

  const isEligible = hasAccess(currentPlan, ADD_ON_REQUIREMENTS.collaboration);

  async function handleToggleCollaboration(enabled: boolean) {
    setToggling(true);
    try {
      await apiFetch("/api/user/add-ons", {
        method: "POST",
        body: { addOn: "collaboration", enabled, target: "user" },
      });
      await user?.reload();
    } catch (err) {
      console.error("Failed to toggle collaboration:", err);
    } finally {
      setToggling(false);
    }
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="m-auto w-full max-w-4xl rounded-xl border bg-background p-0 shadow-2xl backdrop:bg-black/50"
    >
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold">Choose Your Plan</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
        {TIERS.map((tier) => {
          const isCurrent = tier.planKey === currentPlan;
          const IconComponent =
            tier.planKey === "enterprise"
              ? Mail
              : tier.planKey === "team"
                ? Users
                : Zap;

          return (
            <div
              key={tier.planKey}
              className={`flex flex-col rounded-lg p-5 ${
                tier.highlight
                  ? "border-2 border-primary/30 bg-primary/5"
                  : "border"
              }`}
            >
              <div className="mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">{tier.name}</h3>
                  {tier.highlight && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      Popular
                    </span>
                  )}
                </div>
                <p className="mt-1 text-2xl font-bold">
                  {tier.price}
                  {tier.period && (
                    <span className="text-sm font-normal text-muted-foreground">
                      {tier.period}
                    </span>
                  )}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {tier.description}
                </p>
              </div>

              <ul className="flex-1 space-y-2">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs">
                    <Check
                      className={`mt-0.5 h-3 w-3 shrink-0 ${
                        tier.highlight ? "text-primary" : "text-muted-foreground"
                      }`}
                    />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                disabled={isCurrent}
                className={`mt-5 flex w-full items-center justify-center gap-2 rounded-md px-4 py-2 text-xs font-medium transition-colors ${
                  isCurrent
                    ? "border text-muted-foreground"
                    : tier.highlight
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "border bg-background hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {!isCurrent && <IconComponent className="h-3.5 w-3.5" />}
                {isCurrent ? "Current Plan" : tier.cta}
              </button>
            </div>
          );
        })}
      </div>

      <div className="border-t px-6 py-4">
        <div className="mx-auto max-w-2xl rounded-lg border border-dashed border-primary/30 bg-primary/5 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">
                  Real-Time Collaboration Add-On
                </h3>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  New
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Work together in real time.{" "}
                <span className="font-semibold text-foreground">
                  $12/seat/mo
                </span>
                {!isEligible && (
                  <span className="ml-1 text-muted-foreground">
                    &middot; Requires Team plan or above
                  </span>
                )}
              </p>
            </div>
            {hasCollaboration ? (
              <div className="flex shrink-0 items-center gap-2">
                <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                  <Check className="h-3.5 w-3.5" />
                  Enabled
                </span>
                <button
                  type="button"
                  disabled={toggling}
                  onClick={() => handleToggleCollaboration(false)}
                  className="text-xs text-muted-foreground underline-offset-2 hover:underline disabled:opacity-50"
                >
                  {toggling ? "Removing…" : "Remove"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={!isEligible || toggling}
                onClick={() => handleToggleCollaboration(true)}
                className="shrink-0 rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {toggling ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  "Add Collaboration"
                )}
              </button>
            )}
          </div>
          <ul className="mt-3 grid gap-1 sm:grid-cols-2">
            {COLLABORATION_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-xs">
                <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t px-6 py-3 text-center text-[11px] text-muted-foreground">
        All plans include a 14-day free trial. Questions? Contact us at
        support@shimgis.com
      </div>
    </dialog>
  );
}
