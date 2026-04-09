"use client";

import {
  OrganizationProfile,
  useOrganization,
  useOrganizationList,
} from "@clerk/nextjs";
import { ArrowLeft, Building2, Check, Crown, Loader2, Shield, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useUserPlan } from "@/lib/auth/use-user-plan";
import { PLAN_QUOTAS } from "@/lib/auth/quotas";
import { ADD_ON_REQUIREMENTS, hasAccess, normalizePlan } from "@/lib/auth/plans";
import { apiFetch } from "@/lib/api/client";

export default function TeamSettingsPage() {
  const { organization, membership, memberships } = useOrganization({
    memberships: { infinite: true },
  });
  const { isTeam, plan, hasCollaboration } = useUserPlan();
  const { createOrganization } = useOrganizationList();
  const router = useRouter();
  const [toggling, setToggling] = useState(false);

  const isCollabEligible = hasAccess(plan, ADD_ON_REQUIREMENTS.collaboration);

  async function handleToggleCollaboration() {
    setToggling(true);
    try {
      await apiFetch("/api/user/add-ons", {
        method: "POST",
        body: {
          addOn: "collaboration",
          enabled: !hasCollaboration,
          target: "org",
        },
      });
      await organization?.reload();
    } catch (err) {
      console.error("Failed to toggle collaboration:", err);
    } finally {
      setToggling(false);
    }
  }

  if (!isTeam && !organization) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Building2 className="h-7 w-7 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Team Workspace</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Create an organization to collaborate with your team. Team and
            Enterprise plans include shared projects, role-based access, and
            audit logging.
          </p>
        </div>
        <button
          type="button"
          onClick={() => createOrganization?.({ name: "My Team" })}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Users className="h-4 w-4" />
          Create Organization
        </button>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading organization...</p>
      </div>
    );
  }

  const orgMeta = organization.publicMetadata as Record<string, unknown> | undefined;
  const orgPlan = normalizePlan(orgMeta?.plan);

  const quota = PLAN_QUOTAS[plan];
  const memberCount = memberships?.count ?? 0;
  const seatLabel =
    quota.seats < 0
      ? `${memberCount} members (unlimited seats)`
      : `${memberCount} / ${quota.seats} seats`;

  const isAdmin = membership?.role === "org:admin";

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl space-y-8 px-6 py-8">
        <div>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
          <h1 className="text-xl font-semibold tracking-tight">
            Team Settings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your organization, members, and billing.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Organization
            </div>
            <p className="mt-1 text-lg font-semibold">{organization.name}</p>
          </div>
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Crown className="h-4 w-4 text-muted-foreground" />
              Plan
            </div>
            <p className="mt-1 text-lg font-semibold capitalize">{orgPlan}</p>
          </div>
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4 text-muted-foreground" />
              Seats
            </div>
            <p className="mt-1 text-lg font-semibold">{seatLabel}</p>
          </div>
        </div>

        {isAdmin && (
          <div className="rounded-lg border">
            <div className="flex items-center gap-2 border-b px-5 py-3">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Members</h2>
            </div>
            <div className="divide-y">
              {memberships?.data?.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between px-5 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {m.publicUserData.firstName} {m.publicUserData.lastName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {m.publicUserData.identifier}
                    </p>
                  </div>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium capitalize text-muted-foreground">
                    {m.role.replace("org:", "")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {isAdmin && (
          <div className="rounded-lg border">
            <div className="flex items-center gap-2 border-b px-5 py-3">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Add-ons</h2>
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <div className="min-w-0">
                <p className="text-sm font-medium">Real-Time Collaboration</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Live cursors, presence awareness, synchronized editing, and
                  spatial comments for your entire organization.
                  {!isCollabEligible && (
                    <span className="ml-1 font-medium text-amber-600">
                      Requires Team plan or above.
                    </span>
                  )}
                </p>
              </div>
              <div className="ml-4 flex shrink-0 items-center gap-3">
                {hasCollaboration && (
                  <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                    <Check className="h-3.5 w-3.5" />
                    Active
                  </span>
                )}
                <button
                  type="button"
                  disabled={!isCollabEligible || toggling}
                  onClick={handleToggleCollaboration}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                    hasCollaboration
                      ? "border text-muted-foreground hover:bg-accent"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                >
                  {toggling ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : hasCollaboration ? (
                    "Disable"
                  ) : (
                    "Enable"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-lg border p-1">
          <OrganizationProfile
            routing="hash"
            appearance={{
              elements: {
                rootBox: "w-full max-w-full overflow-hidden",
                cardBox: "w-full max-w-full shadow-none border-0",
                navbar: "hidden",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
