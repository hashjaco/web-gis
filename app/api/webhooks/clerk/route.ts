import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userProfiles } from "@/lib/db/schema";
import type { UserPlan } from "@/lib/auth/plans";

interface ClerkWebhookEvent {
  type: string;
  data: {
    id: string;
    public_metadata?: Record<string, unknown>;
    [key: string]: unknown;
  };
}

/**
 * Clerk webhook handler that syncs user plan data to the local
 * user_profiles table. Configure this endpoint in the Clerk dashboard
 * under Webhooks, subscribing to user.created and user.updated events.
 *
 * For production, add Svix signature verification using the
 * CLERK_WEBHOOK_SECRET environment variable.
 */
export async function POST(request: Request) {
  const body = (await request.json()) as ClerkWebhookEvent;
  const { type, data } = body;

  if (type === "user.created" || type === "user.updated") {
    const clerkId = data.id;
    const plan =
      (data.public_metadata?.plan as UserPlan) ?? "standard";

    await db
      .insert(userProfiles)
      .values({ clerkId, plan, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: userProfiles.clerkId,
        set: { plan, updatedAt: new Date() },
      });
  }

  if (type === "user.deleted") {
    const clerkId = data.id;
    await db.delete(userProfiles).where(eq(userProfiles.clerkId, clerkId));
  }

  return NextResponse.json({ received: true });
}
