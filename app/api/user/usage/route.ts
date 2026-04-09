import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getUsage } from "@/lib/auth/check-quota";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId") ?? undefined;

    const usage = await getUsage(userId, projectId);
    return NextResponse.json(usage);
  } catch (err) {
    console.error("GET /api/user/usage failed:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
