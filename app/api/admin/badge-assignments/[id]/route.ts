import { NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/admin";
import { unassignBadgeFromCreator, updateCreatorBadgeAssignment } from "@/lib/services/badges";

type AssignmentRouteProps = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, { params }: AssignmentRouteProps) {
  try {
    await requireAdminUser();
    const { id } = await params;
    const payload = (await request.json()) as {
      displayOrder?: number;
      foundingCreator?: {
        founderNumber?: number | null;
        featured?: boolean;
        notes?: string | null;
        markInvited?: boolean;
        markAccepted?: boolean;
      } | null;
    };

    await updateCreatorBadgeAssignment({
      assignmentId: id,
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

export async function DELETE(_: Request, { params }: AssignmentRouteProps) {
  try {
    await requireAdminUser();
    const { id } = await params;
    await unassignBadgeFromCreator({ assignmentId: id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Badge assignment could not be removed.";
    const status = message === "Admin access required." ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
