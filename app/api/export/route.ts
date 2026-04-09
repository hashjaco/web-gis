import { auth } from "@clerk/nextjs/server";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorizeProject } from "@/lib/auth/authorize-project";
import { getUserPlan } from "@/lib/auth/get-user-plan";
import { hasAccess } from "@/lib/auth/plans";
import { checkRateLimit } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/audit/log";

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rateLimited = await checkRateLimit(userId, "expensive");
  if (rateLimited) return rateLimited;

  const { plan } = await getUserPlan();
  if (!hasAccess(plan, "free")) {
    return NextResponse.json(
      { error: "Export requires a free account or above" },
      { status: 403 },
    );
  }

  const { searchParams } = new URL(request.url);
  const layer = searchParams.get("layer");
  const format = searchParams.get("format") || "geojson";
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

  let query = sql`
    SELECT
      id,
      ST_AsGeoJSON(geom)::json AS geometry,
      properties,
      layer
    FROM features
    WHERE project_id = ${projectId}
  `;

  if (layer) {
    query = sql`${query} AND layer = ${layer}`;
  }

  const rows = (await db.execute(query)) as unknown as Record<
    string,
    unknown
  >[];

  writeAuditLog({
    actorId: userId,
    action: "data.export",
    resourceType: "project",
    resourceId: projectId,
    metadata: { format, layer: layer ?? "all" },
  });

  if (format === "csv") {
    const allKeys = new Set<string>();
    for (const row of rows) {
      const props = row.properties as Record<string, unknown> | null;
      if (props) {
        for (const key of Object.keys(props)) {
          allKeys.add(key);
        }
      }
    }

    const cols = ["id", "layer", ...Array.from(allKeys)];
    const header = cols.join(",");
    const csvRows = rows.map((row) => {
      const props = (row.properties as Record<string, unknown>) ?? {};
      return [
        row.id,
        row.layer,
        ...Array.from(allKeys).map((k) => JSON.stringify(props[k] ?? "")),
      ].join(",");
    });

    return new NextResponse([header, ...csvRows].join("\n"), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="features.csv"`,
      },
    });
  }

  const geojson = {
    type: "FeatureCollection",
    features: rows.map((row) => ({
      type: "Feature",
      id: row.id,
      geometry: row.geometry,
      properties: row.properties,
    })),
  };

  return NextResponse.json(geojson, {
    headers: {
      "Content-Disposition": `attachment; filename="features.geojson"`,
    },
  });
}
