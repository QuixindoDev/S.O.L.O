import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat") || "-8.83";
  const lon = searchParams.get("lon") || "13.23";
  const start = searchParams.get("start") || "20250101";
  const end = searchParams.get("end") || "20251231";

  const parameters =
    "T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,RH2M,ALLSKY_SFC_SW_DWN,WS2M";
  const nasaUrl = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=${parameters}&community=AG&longitude=${lon}&latitude=${lat}&start=${start}&end=${end}&format=JSON`;

  try {
    const res = await fetch(nasaUrl, {
      next: { revalidate: 86400 }, // 24-hour edge cache for satellite series
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch satellite metrics from NASA POWER" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal proxy connection error", details: (error as Error).message },
      { status: 500 }
    );
  }
}
