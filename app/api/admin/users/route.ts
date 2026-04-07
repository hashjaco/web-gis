import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getUserPlan } from "@/lib/auth/get-user-plan";
import type { UserPlan } from "@/lib/auth/plans";

const VALID_PLANS = new Set<string>(["standard", "pro", "admin"]);

export async function GET() {
  const callerPlan = await getUserPlan();
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
        (u.publicMetadata as Record<string, unknown>)?.plan ?? "standard",
      createdAt: u.createdAt,
    }));
    return NextResponse.json(mapped);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const callerPlan = await getUserPlan();
  if (callerPlan !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { userId, plan } = body as { userId?: string; plan?: string };

  if (!userId || !plan || !VALID_PLANS.has(plan)) {
    return NextResponse.json(
      { error: "Invalid request. Provide userId and plan (standard|pro|admin)." },
      { status: 400 },
    );
  }

  try {
    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, {
      publicMetadata: { plan: plan as UserPlan },
    });
    return NextResponse.json({ success: true, userId, plan });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to update user plan" },
      { status: 500 },
    );
  }
}
