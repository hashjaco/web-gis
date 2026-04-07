import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const layer = searchParams.get("layer");
  const format = searchParams.get("format") || "geojson";

  let query = sql`
    SELECT
      id,
      ST_AsGeoJSON(geom)::json AS geometry,
      properties,
      layer
    FROM features
    WHERE 1=1
  `;

  if (layer) {
    query = sql`${query} AND layer = ${layer}`;
  }

  const rows = (await db.execute(query)) as unknown as Record<
    string,
    unknown
  >[];

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
