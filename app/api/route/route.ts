import { NextResponse } from "next/server";

const OSRM_URL = process.env.OSRM_URL || "http://localhost:5050";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const profile = searchParams.get("profile") || "car";

  if (!start || !end) {
    return NextResponse.json(
      { error: "start and end coordinates are required (lon,lat)" },
      { status: 400 },
    );
  }

  const profileMap: Record<string, string> = {
    car: "car",
    bike: "bicycle",
    foot: "foot",
    truck: "car",
    wheelchair: "foot",
  };
  const osrmProfile = profileMap[profile] ?? "car";

  try {
    const url = `${OSRM_URL}/route/v1/${osrmProfile}/${start};${end}?overview=full&geometries=geojson&steps=true`;
    const res = await fetch(url);

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      const detail =
        res.status === 403
          ? "Routing engine denied the request — verify OSRM_URL is reachable and allows server-side access"
          : `Routing engine returned ${res.status}`;
      console.error(`OSRM ${res.status}: ${body.slice(0, 200)}`);
      return NextResponse.json({ error: detail }, { status: 502 });
    }

    const data = await res.json();

    if (!data.routes || data.routes.length === 0) {
      return NextResponse.json({ error: "No route found" }, { status: 404 });
    }

    const route = data.routes[0];
    const steps =
      route.legs?.flatMap(
        (leg: {
          steps: {
            maneuver: { instruction: string };
            distance: number;
            duration: number;
            name: string;
          }[];
        }) =>
          leg.steps.map(
            (step: {
              maneuver: { instruction: string };
              distance: number;
              duration: number;
              name: string;
            }) => ({
              instruction: step.maneuver?.instruction ?? "",
              distance: step.distance,
              duration: step.duration,
              name: step.name ?? "",
            }),
          ),
      ) ?? [];

    return NextResponse.json({
      geometry: route.geometry,
      distance: route.distance,
      duration: route.duration,
      steps,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to connect to routing engine" },
      { status: 502 },
    );
  }
}
