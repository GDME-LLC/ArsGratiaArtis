import { FOUNDING_CREATOR_LIMIT } from "@/lib/constants/founding-creators";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  AdminBadgeCreatorRow,
  AdminBadgeOverview,
  AdminBadgeRecord,
  AdminCreatorBadgeAssignment,
  CreatorBadge,
  FoundingCreatorInfo,
} from "@/types";

function mapFoundingCreatorInfo(row: Record<string, unknown> | null | undefined): FoundingCreatorInfo {
  return {
    isFoundingCreator: Boolean(row?.is_founding_creator),
    founderNumber: typeof row?.founding_creator_number === "number" ? row.founding_creator_number : null,
    awardedAt: typeof row?.founding_creator_awarded_at === "string" ? row.founding_creator_awarded_at : null,
    featured: row?.founding_creator_featured !== false,
    notes: typeof row?.founding_creator_notes === "string" ? row.founding_creator_notes : null,
    invitedAt: typeof row?.founding_creator_invited_at === "string" ? row.founding_creator_invited_at : null,
    acceptedAt: typeof row?.founding_creator_accepted_at === "string" ? row.founding_creator_accepted_at : null,
  };
}

function mapCreatorBadge(row: Record<string, unknown>, foundingCreator: FoundingCreatorInfo | null = null): CreatorBadge {
  return {
    id: String(row.badge_id ?? row.id),
    slug: String(row.slug),
    name: String(row.name),
    description: typeof row.description === "string" ? row.description : null,
    iconName: typeof row.icon_name === "string" ? row.icon_name : null,
    theme: typeof row.theme === "string" ? row.theme : "gold",
    isSystem: Boolean(row.is_system),
    isActive: row.is_active !== false,
    sortOrder: typeof row.sort_order === "number" ? row.sort_order : 0,
    displayOrder: typeof row.display_order === "number" ? row.display_order : 0,
    assignedAt:
      typeof row.assigned_at === "string"
        ? row.assigned_at
        : typeof row.created_at === "string"
          ? row.created_at
          : new Date(0).toISOString(),
    foundingCreator,
  };
}

function sortCreatorBadges(badges: CreatorBadge[]) {
  return [...badges].sort((a, b) => {
    if (a.displayOrder !== b.displayOrder) {
      return a.displayOrder - b.displayOrder;
    }

    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder;
    }

    if (a.assignedAt !== b.assignedAt) {
      return a.assignedAt.localeCompare(b.assignedAt);
    }

    return a.slug.localeCompare(b.slug);
  });
}

export async function getCreatorBadgesByProfileIds(profileIds: string[]) {
  const supabase = await createServerSupabaseClient();

  if (!supabase || profileIds.length === 0) {
    return new Map<string, CreatorBadge[]>();
  }

  const { data, error } = await supabase
    .from("creator_badges")
    .select(`
      profile_id,
      assigned_at,
      display_order,
      badges!inner(
        id,
        slug,
        name,
        description,
        icon_name,
        theme,
        is_active,
        is_system,
        sort_order
      )
    `)
    .in("profile_id", profileIds);

  if (error) {
    throw new Error(error.message);
  }

  const badgeMap = new Map<string, CreatorBadge[]>();

  for (const row of data ?? []) {
    const badge = Array.isArray(row.badges) ? row.badges[0] : row.badges;

    if (!badge) {
      continue;
    }

    const profileId = String(row.profile_id);
    const current = badgeMap.get(profileId) ?? [];
    current.push(
      mapCreatorBadge({
        badge_id: badge.id,
        slug: badge.slug,
        name: badge.name,
        description: badge.description,
        icon_name: badge.icon_name,
        theme: badge.theme,
        is_active: badge.is_active,
        is_system: badge.is_system,
        sort_order: badge.sort_order,
        display_order: row.display_order,
        assigned_at: row.assigned_at,
      }),
    );
    badgeMap.set(profileId, current);
  }

  for (const [profileId, badges] of badgeMap) {
    badgeMap.set(profileId, sortCreatorBadges(badges));
  }

  return badgeMap;
}

export function applyFoundingBadgeMetadata(
  badges: CreatorBadge[],
  foundingCreator: FoundingCreatorInfo,
) {
  return badges.map((badge) =>
    badge.slug === "founding-creator"
      ? {
          ...badge,
          foundingCreator,
        }
      : badge,
  );
}

export async function getAdminBadgeOverview(): Promise<AdminBadgeOverview> {
  const supabase = createServiceRoleSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const [{ data: badges, error: badgesError }, { data: creators, error: creatorsError }, { data: assignments, error: assignmentsError }] = await Promise.all([
    supabase
      .from("badges")
      .select("id, slug, name, description, icon_name, theme, is_active, is_system, sort_order, created_at, updated_at")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("profiles")
      .select("id, handle, display_name, avatar_url, is_creator, is_public, is_founding_creator, founding_creator_number, founding_creator_awarded_at, founding_creator_featured, founding_creator_notes, founding_creator_invited_at, founding_creator_accepted_at")
      .eq("is_creator", true)
      .order("display_name", { ascending: true }),
    supabase
      .from("creator_badges")
      .select(`
        id,
        profile_id,
        badge_id,
        display_order,
        assigned_at,
        badges!inner(
          id,
          slug,
          name,
          description,
          icon_name,
          theme,
          is_active,
          is_system,
          sort_order,
          created_at,
          updated_at
        )
      `),
  ]);

  if (badgesError) {
    throw new Error(badgesError.message);
  }

  if (creatorsError) {
    throw new Error(creatorsError.message);
  }

  if (assignmentsError) {
    throw new Error(assignmentsError.message);
  }

  const assignmentCounts = new Map<string, number>();
  for (const assignment of assignments ?? []) {
    assignmentCounts.set(String(assignment.badge_id), (assignmentCounts.get(String(assignment.badge_id)) ?? 0) + 1);
  }

  const mappedBadges: AdminBadgeRecord[] = (badges ?? []).map((badge) => ({
    id: badge.id,
    slug: badge.slug,
    name: badge.name,
    description: badge.description ?? null,
    iconName: badge.icon_name ?? null,
    theme: badge.theme,
    isActive: badge.is_active,
    isSystem: badge.is_system,
    sortOrder: badge.sort_order ?? 0,
    assignedCount: assignmentCounts.get(String(badge.id)) ?? 0,
    createdAt: badge.created_at,
    updatedAt: badge.updated_at,
  }));

  const badgeRecordMap = new Map(mappedBadges.map((badge) => [badge.id, badge]));
  const creatorAssignments = new Map<string, AdminCreatorBadgeAssignment[]>();

  for (const assignment of assignments ?? []) {
    const badge = badgeRecordMap.get(String(assignment.badge_id));
    if (!badge) {
      continue;
    }

    const profileId = String(assignment.profile_id);
    const creatorRow = (creators ?? []).find((creator) => creator.id === profileId);
    const foundingCreator = creatorRow ? mapFoundingCreatorInfo(creatorRow) : null;

    const current = creatorAssignments.get(profileId) ?? [];
    current.push({
      id: assignment.id,
      profileId,
      badgeId: String(assignment.badge_id),
      displayOrder: assignment.display_order ?? 0,
      assignedAt: assignment.assigned_at,
      badge,
      foundingCreator: badge.slug === "founding-creator" ? foundingCreator : null,
    });
    creatorAssignments.set(profileId, current);
  }

  const mappedCreators: AdminBadgeCreatorRow[] = (creators ?? []).map((creator) => ({
    id: String(creator.id),
    handle: String(creator.handle),
    displayName: String(creator.display_name ?? ""),
    avatarUrl: typeof creator.avatar_url === "string" ? creator.avatar_url : null,
    isCreator: Boolean(creator.is_creator),
    isPublic: Boolean(creator.is_public),
    badges: (creatorAssignments.get(String(creator.id)) ?? []).sort((a, b) => {
      if (a.displayOrder !== b.displayOrder) {
        return a.displayOrder - b.displayOrder;
      }

      if (a.badge.sortOrder !== b.badge.sortOrder) {
        return a.badge.sortOrder - b.badge.sortOrder;
      }

      return a.badge.name.localeCompare(b.badge.name);
    }),
  }));

  return {
    badges: mappedBadges,
    creators: mappedCreators,
  };
}

export async function createBadge(input: {
  slug: string;
  name: string;
  description: string | null;
  iconName: string | null;
  theme: string;
  isActive: boolean;
  sortOrder: number;
}) {
  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const { data, error } = await supabase
    .from("badges")
    .insert({
      slug: input.slug,
      name: input.name,
      description: input.description,
      icon_name: input.iconName,
      theme: input.theme,
      is_active: input.isActive,
      sort_order: input.sortOrder,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("A badge with that slug already exists.");
    }

    throw new Error(error.message);
  }

  return data.id;
}

export async function updateBadge(input: {
  badgeId: string;
  slug: string;
  name: string;
  description: string | null;
  iconName: string | null;
  theme: string;
  isActive: boolean;
  sortOrder: number;
}) {
  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const { data: badge, error: badgeError } = await supabase
    .from("badges")
    .select("id, is_system")
    .eq("id", input.badgeId)
    .single();

  if (badgeError || !badge) {
    throw new Error(badgeError?.message ?? "Badge not found.");
  }

  const { error } = await supabase
    .from("badges")
    .update({
      slug: input.slug,
      name: input.name,
      description: input.description,
      icon_name: input.iconName,
      theme: input.theme,
      is_active: input.isActive,
      sort_order: input.sortOrder,
    })
    .eq("id", input.badgeId);

  if (error) {
    if (error.code === "23505") {
      throw new Error("A badge with that slug already exists.");
    }

    throw new Error(error.message);
  }
}

export async function deleteBadge(badgeId: string) {
  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const { data: badge, error: badgeError } = await supabase
    .from("badges")
    .select("id, is_system")
    .eq("id", badgeId)
    .single();

  if (badgeError || !badge) {
    throw new Error(badgeError?.message ?? "Badge not found.");
  }

  if (badge.is_system) {
    throw new Error("System badges cannot be deleted.");
  }

  const { error } = await supabase.from("badges").delete().eq("id", badgeId);

  if (error) {
    throw new Error(error.message);
  }
}

async function updateFoundingCreatorProfileState(
  supabase: NonNullable<ReturnType<typeof createServiceRoleSupabaseClient>>,
  input: {
    profileId: string;
    founderNumber: number | null;
    featured: boolean;
    notes: string | null;
    markInvited: boolean;
    markAccepted: boolean;
    assign: boolean;
  },
) {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, is_creator, founding_creator_awarded_at, founding_creator_invited_at, founding_creator_accepted_at")
    .eq("id", input.profileId)
    .single();

  if (profileError || !profile) {
    throw new Error(profileError?.message ?? "Creator not found.");
  }

  if (!profile.is_creator) {
    throw new Error("Only approved creator accounts can receive Founding Creator status.");
  }

  if (input.assign) {
    if (typeof input.founderNumber !== "number" || input.founderNumber < 1 || input.founderNumber > FOUNDING_CREATOR_LIMIT) {
      throw new Error(`Founder numbers must be between 1 and ${FOUNDING_CREATOR_LIMIT}.`);
    }

    const { count, error: countError } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("is_founding_creator", true)
      .neq("id", input.profileId);

    if (countError) {
      throw new Error(countError.message);
    }

    if ((count ?? 0) >= FOUNDING_CREATOR_LIMIT) {
      throw new Error("All 20 Founding Creator slots are already filled.");
    }
  }

  const now = new Date().toISOString();
  const invitedAt = input.markInvited ? profile.founding_creator_invited_at ?? now : null;
  const acceptedAt = input.markAccepted || input.assign ? profile.founding_creator_accepted_at ?? now : null;

  const { error } = await supabase
    .from("profiles")
    .update({
      is_founding_creator: input.assign,
      founding_creator_number: input.assign ? input.founderNumber : null,
      founding_creator_featured: input.assign ? input.featured : false,
      founding_creator_notes: input.notes,
      founding_creator_invited_at: invitedAt,
      founding_creator_accepted_at: acceptedAt,
      founding_creator_awarded_at: input.assign ? profile.founding_creator_awarded_at ?? now : null,
    })
    .eq("id", input.profileId);

  if (error) {
    if (error.message.toLowerCase().includes("profiles_founding_creator_number_key")) {
      throw new Error("That Founding Creator number is already assigned.");
    }

    throw new Error(error.message);
  }
}

export async function assignBadgeToCreator(input: {
  profileId: string;
  badgeId: string;
  assignedBy: string;
  displayOrder?: number;
  foundingCreator?: {
    founderNumber: number | null;
    featured: boolean;
    notes: string | null;
    markInvited: boolean;
    markAccepted: boolean;
  } | null;
}) {
  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const { data: badge, error: badgeError } = await supabase
    .from("badges")
    .select("id, slug")
    .eq("id", input.badgeId)
    .single();

  if (badgeError || !badge) {
    throw new Error(badgeError?.message ?? "Badge not found.");
  }

  if (badge.slug === "founding-creator") {
    await updateFoundingCreatorProfileState(supabase, {
      profileId: input.profileId,
      founderNumber: input.foundingCreator?.founderNumber ?? null,
      featured: input.foundingCreator?.featured ?? true,
      notes: input.foundingCreator?.notes ?? null,
      markInvited: Boolean(input.foundingCreator?.markInvited),
      markAccepted: Boolean(input.foundingCreator?.markAccepted),
      assign: true,
    });
  }

  const { data: existing, error: existingError } = await supabase
    .from("creator_badges")
    .select("id")
    .eq("profile_id", input.profileId)
    .eq("badge_id", input.badgeId)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing) {
    throw new Error("That badge is already assigned to this creator.");
  }

  const { error } = await supabase
    .from("creator_badges")
    .insert({
      profile_id: input.profileId,
      badge_id: input.badgeId,
      assigned_by: input.assignedBy,
      display_order: input.displayOrder ?? 0,
    });

  if (error) {
    if (error.code === "23505") {
      throw new Error("That badge is already assigned to this creator.");
    }

    throw new Error(error.message);
  }
}

export async function updateCreatorBadgeAssignment(input: {
  assignmentId: string;
  displayOrder: number;
  foundingCreator?: {
    founderNumber: number | null;
    featured: boolean;
    notes: string | null;
    markInvited: boolean;
    markAccepted: boolean;
  } | null;
}) {
  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const { data: assignment, error: assignmentError } = await supabase
    .from("creator_badges")
    .select(`id, profile_id, badge_id, badges!inner(id, slug)`)
    .eq("id", input.assignmentId)
    .single();

  if (assignmentError || !assignment) {
    throw new Error(assignmentError?.message ?? "Badge assignment not found.");
  }

  const badge = Array.isArray(assignment.badges) ? assignment.badges[0] : assignment.badges;

  if (badge?.slug === "founding-creator") {
    await updateFoundingCreatorProfileState(supabase, {
      profileId: String(assignment.profile_id),
      founderNumber: input.foundingCreator?.founderNumber ?? null,
      featured: input.foundingCreator?.featured ?? true,
      notes: input.foundingCreator?.notes ?? null,
      markInvited: Boolean(input.foundingCreator?.markInvited),
      markAccepted: Boolean(input.foundingCreator?.markAccepted),
      assign: true,
    });
  }

  const { error } = await supabase
    .from("creator_badges")
    .update({ display_order: input.displayOrder })
    .eq("id", input.assignmentId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function unassignBadgeFromCreator(input: { assignmentId: string }) {
  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const { data: assignment, error: assignmentError } = await supabase
    .from("creator_badges")
    .select(`id, profile_id, badge_id, badges!inner(id, slug)`)
    .eq("id", input.assignmentId)
    .single();

  if (assignmentError || !assignment) {
    throw new Error(assignmentError?.message ?? "Badge assignment not found.");
  }

  const badge = Array.isArray(assignment.badges) ? assignment.badges[0] : assignment.badges;

  if (badge?.slug === "founding-creator") {
    await updateFoundingCreatorProfileState(supabase, {
      profileId: String(assignment.profile_id),
      founderNumber: null,
      featured: false,
      notes: null,
      markInvited: false,
      markAccepted: false,
      assign: false,
    });
  }

  const { error } = await supabase.from("creator_badges").delete().eq("id", input.assignmentId);

  if (error) {
    throw new Error(error.message);
  }
}
