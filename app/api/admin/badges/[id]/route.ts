import { NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/admin";
import { deleteBadge, updateBadge } from "@/lib/services/badges";

type BadgeRouteProps = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, { params }: BadgeRouteProps) {
  try {
    await requireAdminUser();
    const { id } = await params;
    const payload = (await request.json()) as {
      slug?: string;
      name?: string;
      description?: string | null;
      iconName?: string | null;
      theme?: string;
      isActive?: boolean;
      sortOrder?: number;
    };

    if (!payload.slug || !payload.name) {
      return NextResponse.json({ error: "Badge name and slug are required." }, { status: 400 });
    }

    await updateBadge({
      badgeId: id,
      slug: payload.slug.trim().toLowerCase(),
      name: payload.name.trim(),
      description: typeof payload.description === "string" ? payload.description.trim() || null : null,
      iconName: typeof payload.iconName === "string" ? payload.iconName : null,
      theme: typeof payload.theme === "string" ? payload.theme : "gold",
      isActive: payload.isActive !== false,
      sortOrder: typeof payload.sortOrder === "number" ? Math.max(0, Math.trunc(payload.sortOrder)) : 0,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Badge could not be updated.";
    const status = message === "Admin access required." ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_: Request, { params }: BadgeRouteProps) {
  try {
    await requireAdminUser();
    const { id } = await params;
    await deleteBadge(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Badge could not be deleted.";
    const status = message === "Admin access required." ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
