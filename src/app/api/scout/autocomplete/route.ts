import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/server/rateLimit";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q")?.trim() ?? "";

  if (q.length < 3) {
    return NextResponse.json({ suggestions: [] });
  }

  const rateLimit = await checkRateLimit({
    scope: "scout-autocomplete",
    limit: 30,
    windowMs: 60 * 1000,
    identifier: null,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "json");
    url.searchParams.set("q", q);
    url.searchParams.set("countrycodes", "be");
    url.searchParams.set("limit", "6");
    url.searchParams.set("addressdetails", "1");

    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent": "FOREM-idable/1.0 (brisbois.dev)",
        "Accept-Language": "fr",
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return NextResponse.json({ suggestions: [] });
    }

    const data = (await res.json()) as Array<{
      display_name: string;
      lat: string;
      lon: string;
      address?: {
        city?: string;
        town?: string;
        village?: string;
        municipality?: string;
      };
    }>;

    const seen = new Set<string>();
    const suggestions = [];

    for (const item of data) {
      const name =
        item.address?.city ??
        item.address?.town ??
        item.address?.village ??
        item.address?.municipality ??
        item.display_name.split(",")[0]?.trim() ??
        item.display_name;

      if (seen.has(name)) continue;
      seen.add(name);
      suggestions.push({
        name,
        full: item.display_name,
        lat: item.lat,
        lon: item.lon,
      });
    }

    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
