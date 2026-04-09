import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getUserPlan } from "@/lib/auth/get-user-plan";
import type { UserPlan } from "@/lib/auth/plans";
import { parseBody } from "@/lib/validation/parse";
import { adminPlanUpdateSchema } from "@/lib/validation/schemas";
import { writeAuditLog } from "@/lib/audit/log";

export async function GET() {
  const { plan: callerPlan } = await getUserPlan();
  if (callerPlan !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const client = await clerkClient();
    const { data: users } = await client.users.getUserList({ limit: 100 });
    const mapped = users.map((u) => ({
      id: u.id,
      email: u.emailAddresses[0]?.emailAddress ?? null,
      firstName: u.firstName,
      lastName: u.lastName,
      plan:
        (u.publicMetadata as Record<string, unknown>)?.plan ?? "free",
      createdAt: u.createdAt,
    }));
    return NextResponse.json(mapped);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const { plan: callerPlan } = await getUserPlan();
  if (callerPlan !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = await parseBody(request, adminPlanUpdateSchema);
  if (parsed.error) return parsed.error;
  const { userId, plan } = parsed.data;

  try {
    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, {
      publicMetadata: { plan: plan as UserPlan },
    });
    writeAuditLog({
      actorId: "admin",
      action: "admin.plan_change",
      resourceType: "user",
      resourceId: userId,
      metadata: { newPlan: plan },
    });

    return NextResponse.json({ success: true, userId, plan });
  } catch {
    return NextResponse.json(
      { error: "Failed to update user plan" },
      { status: 500 },
    );
  }
}
