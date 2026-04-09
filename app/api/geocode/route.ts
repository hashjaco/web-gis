import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getUserPlan } from "@/lib/auth/get-user-plan";
import { checkRateLimit, planToRateTier } from "@/lib/rate-limit";

const NOMINATIM_URL =
  process.env.NOMINATIM_URL || "https://nominatim.openstreetmap.org";

export async function GET(request: Request) {
  const { userId } = await auth();
  const identifier = userId ?? request.headers.get("x-forwarded-for") ?? "anon";
  const { plan } = await getUserPlan();

  const rateLimited = await checkRateLimit(identifier, planToRateTier(plan));
  if (rateLimited) return rateLimited;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q) {
    return NextResponse.json(
      { error: "q parameter is required" },
      { status: 400 },
    );
  }

  try {
    const url = `${NOMINATIM_URL}/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "GIS-Web/1.0" },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Geocoding error: ${res.status}` },
        { status: 502 },
      );
    }

    const data = await res.json();
    const results = data.map(
      (item: {
        place_id: number;
        display_name: string;
        lat: string;
        lon: string;
        type: string;
      }) => ({
        placeId: String(item.place_id),
        displayName: item.display_name,
        lat: Number.parseFloat(item.lat),
        lon: Number.parseFloat(item.lon),
        type: item.type,
      }),
    );

    return NextResponse.json(results);
  } catch {
    return NextResponse.json(
      { error: "Failed to connect to geocoding service" },
      { status: 502 },
    );
  }
}
