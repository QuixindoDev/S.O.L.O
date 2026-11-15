import { NextResponse } from "next/server";
import { api } from "@/lib/api/endpoints";

/**
 * Proxy da NASA POWER.
 *
 * O browser nunca fala directamente com a NASA: passa pelo back-end,
 * que normaliza, cacheia (24 h) e protege de quedas e de CORS.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat") || "-12.776";
  const lon = searchParams.get("lon") || "15.739";
  const start = searchParams.get("start") || undefined;
  const end = searchParams.get("end") || undefined;

  try {
    const data = await api.nasa.power(
      { lat: Number(lat), lon: Number(lon), start, end },
      { revalidate: 86400, timeoutMs: 25_000 },
    );

    return NextResponse.json(data);
  } catch (error) {
    const status = (error as { status?: number }).status ?? 500;
    const message =
      status === 502
        ? "A NASA POWER está indisponível neste momento."
        : "Falha ao pedir os dados do satélite ao back-end.";

    return NextResponse.json({ error: message }, { status: status || 500 });
  }
}
