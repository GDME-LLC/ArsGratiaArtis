import { NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/admin";
import { getPlatformSettings, updatePlatformSettings } from "@/lib/platform-settings";

export async function GET() {
  try {
    await requireAdminUser();
    const settings = await getPlatformSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Platform settings could not be loaded.";
    const status = message === "Admin access required." ? 403 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdminUser();

    const payload = (await request.json()) as {
      homepageSpotlightFilmId?: string | null;
      homepageSpotlightLabel?: string | null;
      heroMotto?: string;
      heroTitle?: string;
      heroDescription?: string;
      beyondCinemaCategories?: string[];
    };

    const settings = await updatePlatformSettings(payload);
    return NextResponse.json({ settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Platform settings could not be updated.";
    const status = message === "Admin access required." ? 403 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
