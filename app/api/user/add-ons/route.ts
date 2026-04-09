import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getUserPlan } from "@/lib/auth/get-user-plan";
import { resolveOrg } from "@/lib/auth/resolve-org";
import {
  type AddOn,
  ADD_ON_REQUIREMENTS,
  hasAccess,
  normalizeAddOns,
} from "@/lib/auth/plans";
import { parseBody } from "@/lib/validation/parse";
import { toggleAddOnSchema } from "@/lib/validation/schemas";
import { writeAuditLog } from "@/lib/audit/log";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = await parseBody(request, toggleAddOnSchema);
  if (parsed.error) return parsed.error;
  const { addOn, enabled, target } = parsed.data;

  const { plan } = await getUserPlan();
  const requiredPlan = ADD_ON_REQUIREMENTS[addOn];
  if (!hasAccess(plan, requiredPlan)) {
    return NextResponse.json(
      { error: `Your plan must be ${requiredPlan} or above to enable this add-on` },
      { status: 403 },
    );
  }

  const client = await clerkClient();

  if (target === "org") {
    const { orgId, orgRole } = await resolveOrg();
    if (!orgId) {
      return NextResponse.json(
        { error: "No active organization" },
        { status: 400 },
      );
    }
    if (orgRole !== "org:admin") {
      return NextResponse.json(
        { error: "Only organization admins can manage add-ons" },
        { status: 403 },
      );
    }

    const org = await client.organizations.getOrganization({ organizationId: orgId });
    const existingMeta = (org.publicMetadata ?? {}) as Record<string, unknown>;
    const currentAddOns = normalizeAddOns(existingMeta.addOns);
    const updatedAddOns = computeUpdatedAddOns(currentAddOns, addOn, enabled);

    await client.organizations.updateOrganization(orgId, {
      publicMetadata: { ...existingMeta, addOns: updatedAddOns },
    });

    writeAuditLog({
      actorId: userId,
      action: enabled ? "addon.enabled" : "addon.disabled",
      resourceType: "organization",
      resourceId: orgId,
      metadata: { addOn, target },
    });

    return NextResponse.json({ success: true, addOns: updatedAddOns });
  }

  const user = await client.users.getUser(userId);
  const existingMeta = (user.publicMetadata ?? {}) as Record<string, unknown>;
  const currentAddOns = normalizeAddOns(existingMeta.addOns);
  const updatedAddOns = computeUpdatedAddOns(currentAddOns, addOn, enabled);

  await client.users.updateUserMetadata(userId, {
    publicMetadata: { ...existingMeta, addOns: updatedAddOns },
  });

  writeAuditLog({
    actorId: userId,
    action: enabled ? "addon.enabled" : "addon.disabled",
    resourceType: "user",
    resourceId: userId,
    metadata: { addOn, target },
  });

  return NextResponse.json({ success: true, addOns: updatedAddOns });
}

function computeUpdatedAddOns(
  current: AddOn[],
  addOn: AddOn,
  enabled: boolean,
): AddOn[] {
  const set = new Set(current);
  if (enabled) set.add(addOn);
  else set.delete(addOn);
  return Array.from(set);
}
