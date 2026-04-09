import { auth } from "@clerk/nextjs/server";
import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { layers } from "@/lib/db/schema";
import { authorizeProject } from "@/lib/auth/authorize-project";
import { getUserPlan } from "@/lib/auth/get-user-plan";
import { checkQuota } from "@/lib/auth/check-quota";
import { parseBody } from "@/lib/validation/parse";
import { createLayerSchema } from "@/lib/validation/schemas";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 },
      );
    }

    const project = await authorizeProject(userId, projectId, "read");
    if (!project)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const result = await db
      .select()
      .from(layers)
      .where(eq(layers.projectId, projectId))
      .orderBy(asc(layers.order));

    return NextResponse.json(result);
  } catch (err) {
    console.error("GET /api/layers failed:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = await parseBody(request, createLayerSchema);
    if (parsed.error) return parsed.error;
    const body = parsed.data;

    const project = await authorizeProject(userId, body.projectId, "write");
    if (!project)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { plan } = await getUserPlan();
    const quotaError = await checkQuota(plan, "layers", { projectId: body.projectId });
    if (quotaError) return quotaError;

    const [created] = await db
      .insert(layers)
      .values({
        name: body.name,
        description: body.description ?? null,
        sourceType: body.sourceType,
        style: body.style ?? null,
        order: body.order,
        isVisible: body.isVisible,
        opacity: body.opacity,
        projectId: body.projectId,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("POST /api/layers failed:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
