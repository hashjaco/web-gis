import { eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { db } from "@/lib/db";
import { userProfiles } from "@/lib/db/schema";
import { normalizeAddOns, normalizePlan } from "@/lib/auth/plans";
import { writeAuditLog } from "@/lib/audit/log";

interface ClerkWebhookEvent {
  type: string;
  data: {
    id: string;
    public_metadata?: Record<string, unknown>;
    [key: string]: unknown;
  };
}

async function verifyWebhook(request: Request): Promise<ClerkWebhookEvent> {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("CLERK_WEBHOOK_SECRET is not set");
  }

  const wh = new Webhook(secret);
  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    throw new Error("Missing svix headers");
  }

  const body = await request.text();
  return wh.verify(body, {
    "svix-id": svixId,
    "svix-timestamp": svixTimestamp,
    "svix-signature": svixSignature,
  }) as ClerkWebhookEvent;
}

export async function POST(request: Request) {
  let event: ClerkWebhookEvent;

  try {
    event = await verifyWebhook(request);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const { type, data } = event;

  if (type === "user.created" || type === "user.updated") {
    const clerkId = data.id;
    const rawPlan = normalizePlan(data.public_metadata?.plan);
    const plan = rawPlan === "guest" ? ("free" as const) : rawPlan;
    const addOns = normalizeAddOns(data.public_metadata?.addOns);

    await db
      .insert(userProfiles)
      .values({ clerkId, plan, addOns, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: userProfiles.clerkId,
        set: { plan, addOns, updatedAt: new Date() },
      });
  }

  if (type === "user.deleted") {
    const clerkId = data.id;

    await db.execute(sql`
      DELETE FROM feature_history
      WHERE feature_id IN (
        SELECT f.id FROM features f
        JOIN projects p ON f.project_id = p.id
        WHERE p.owner_id = ${clerkId}
      )
    `);
    await db.execute(sql`
      DELETE FROM features WHERE project_id IN (
        SELECT id FROM projects WHERE owner_id = ${clerkId}
      )
    `);
    await db.execute(sql`
      DELETE FROM layers WHERE project_id IN (
        SELECT id FROM projects WHERE owner_id = ${clerkId}
      )
    `);
    await db.execute(sql`DELETE FROM projects WHERE owner_id = ${clerkId}`);

    await db.delete(userProfiles).where(eq(userProfiles.clerkId, clerkId));
  }

  if (type === "organization.created" || type === "organization.updated") {
    writeAuditLog({
      actorId: (data.created_by as string) ?? "system",
      action: `webhook.${type}`,
      resourceType: "organization",
      resourceId: data.id,
      metadata: { name: data.name as string },
    });
    return NextResponse.json({ received: true });
  }

  if (
    type === "organizationMembership.created" ||
    type === "organizationMembership.updated" ||
    type === "organizationMembership.deleted"
  ) {
    const orgData = data.organization as Record<string, unknown> | undefined;
    const userData = data.public_user_data as Record<string, unknown> | undefined;
    writeAuditLog({
      actorId: (userData?.user_id as string) ?? "system",
      action: `webhook.${type}`,
      resourceType: "organizationMembership",
      resourceId: data.id,
      metadata: {
        orgId: orgData?.id,
        role: data.role,
      },
    });
    return NextResponse.json({ received: true });
  }

  writeAuditLog({
    actorId: data.id,
    action: `webhook.${type}`,
    resourceType: "user",
    resourceId: data.id,
  });

  return NextResponse.json({ received: true });
}
