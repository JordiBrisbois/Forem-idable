import { NextResponse } from "next/server";
import { isSetupRequired } from "@/lib/server/setup";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const needsSetup = await isSetupRequired();
    return NextResponse.json({ needsSetup });
  } catch {
    return NextResponse.json({ needsSetup: false });
  }
}
