import { NextRequest, NextResponse } from "next/server";
import { runtimeConfig } from "@/config/runtime";
import { buildCalendarSubscriptionIcs } from "@/lib/server/calendarSubscriptions";
import { checkRateLimit } from "@/lib/server/rateLimit";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const rateLimit = await checkRateLimit({
      scope: "calendar-subscriptions",
      limit: 120,
      windowMs: 60 * 1000,
    });
    if (!rateLimit.allowed) {
      return new NextResponse("Too many requests", { status: 429 });
    }

    const { token } = await context.params;
    if (!token) {
      return new NextResponse("Not found", { status: 404 });
    }

    const feed = await buildCalendarSubscriptionIcs(token);
    if (!feed) {
      return new NextResponse("Not found", { status: 404 });
    }

    return new NextResponse(feed.content, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `inline; filename="${runtimeConfig.app.exportFilenamePrefix}-calendar.ics"`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
      },
    });
  } catch {
    return new NextResponse("Calendar unavailable", { status: 500 });
  }
}
