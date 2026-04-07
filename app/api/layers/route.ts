import { auth } from "@clerk/nextjs/server";
import { asc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { layers } from "@/lib/db/schema";

export async function GET() {
  const result = await db.select().from(layers).orderBy(asc(layers.order));
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const [created] = await db
    .insert(layers)
    .values({
      name: body.name,
      description: body.description ?? null,
      sourceType: body.sourceType ?? "vector",
      style: body.style ?? null,
      order: body.order ?? 0,
      isVisible: body.isVisible ?? true,
      opacity: body.opacity ?? 100,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
