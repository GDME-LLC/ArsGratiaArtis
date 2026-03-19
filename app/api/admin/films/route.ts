import { NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/admin";
import { updateAdminFilmAction } from "@/lib/admin-films";

export async function PUT(request: Request) {
  try {
    const adminUser = await requireAdminUser();
    const payload = (await request.json()) as {
      filmId?: string;
      action?: "hide" | "unpublish";
    };

    if (!payload.filmId) {
      return NextResponse.json({ error: "Film id is required." }, { status: 400 });
    }

    if (payload.action !== "hide" && payload.action !== "unpublish") {
      return NextResponse.json({ error: "Admin action is invalid." }, { status: 400 });
    }

    await updateAdminFilmAction({
      filmId: payload.filmId,
      action: payload.action,
      adminUserId: adminUser.id,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Film admin action failed.";
    const status = message === "Admin access required." ? 403 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
