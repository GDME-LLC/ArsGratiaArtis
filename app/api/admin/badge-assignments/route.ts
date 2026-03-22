import { NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/admin";
import { assignBadgeToCreator } from "@/lib/services/badges";

export async function POST(request: Request) {
  try {
    const adminUser = await requireAdminUser();
    const payload = (await request.json()) as {
      profileId?: string;
      badgeId?: string;
      displayOrder?: number;
      foundingCreator?: {
        founderNumber?: number | null;
        featured?: boolean;
        notes?: string | null;
        markInvited?: boolean;
        markAccepted?: boolean;
      } | null;
    };

    if (!payload.profileId || !payload.badgeId) {
      return NextResponse.json({ error: "Creator and badge are required." }, { status: 400 });
    }

    await assignBadgeToCreator({
      profileId: payload.profileId,
      badgeId: payload.badgeId,
      assignedBy: adminUser.id,
      displayOrder: typeof payload.displayOrder === "number" ? Math.max(0, Math.trunc(payload.displayOrder)) : 0,
      foundingCreator: payload.foundingCreator
        ? {
            founderNumber:
              typeof payload.foundingCreator.founderNumber === "number"
                ? Math.trunc(payload.foundingCreator.founderNumber)
                : null,
            featured: payload.foundingCreator.featured !== false,
            notes:
              typeof payload.foundingCreator.notes === "string"
                ? payload.foundingCreator.notes.trim() || null
                : null,
            markInvited: Boolean(payload.foundingCreator.markInvited),
            markAccepted: Boolean(payload.foundingCreator.markAccepted),
          }
        : null,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Badge assignment failed.";
    const status = message === "Admin access required." ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
