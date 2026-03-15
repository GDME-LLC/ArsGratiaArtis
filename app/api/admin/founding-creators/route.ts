import { NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/admin";
import { updateFoundingCreatorStatus } from "@/lib/founding-creators";

export async function PUT(request: Request) {
  try {
    await requireAdminUser();

    const payload = (await request.json()) as {
      profileId?: string;
      isFoundingCreator?: boolean;
      founderNumber?: number | null;
      featured?: boolean;
      notes?: string | null;
      markInvited?: boolean;
      markAccepted?: boolean;
    };

    if (!payload.profileId) {
      return NextResponse.json({ error: "Profile id is required." }, { status: 400 });
    }

    await updateFoundingCreatorStatus({
      profileId: payload.profileId,
      isFoundingCreator: Boolean(payload.isFoundingCreator),
      founderNumber:
        typeof payload.founderNumber === "number" && Number.isFinite(payload.founderNumber)
          ? Math.trunc(payload.founderNumber)
          : null,
      featured: payload.featured !== false,
      notes: typeof payload.notes === "string" ? payload.notes.trim() || null : null,
      markInvited: Boolean(payload.markInvited),
      markAccepted: Boolean(payload.markAccepted),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Founding creator update failed.";
    const status = message === "Admin access required." ? 403 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
