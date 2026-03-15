import { FOUNDING_CREATOR_LIMIT } from "@/lib/constants/founding-creators";
import { getFollowerCount } from "@/lib/services/engagement";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  AdminFoundingCreatorOverview,
  AdminFoundingCreatorRow,
  FoundingCreatorInfo,
  PublicFoundingCreatorListItem,
} from "@/types";

function mapFoundingCreatorInfo(row: Record<string, unknown>): FoundingCreatorInfo {
  return {
    isFoundingCreator: Boolean(row.is_founding_creator),
    founderNumber:
      typeof row.founding_creator_number === "number" ? row.founding_creator_number : null,
    awardedAt:
      typeof row.founding_creator_awarded_at === "string" ? row.founding_creator_awarded_at : null,
    featured: row.founding_creator_featured !== false,
    notes: typeof row.founding_creator_notes === "string" ? row.founding_creator_notes : null,
    invitedAt:
      typeof row.founding_creator_invited_at === "string" ? row.founding_creator_invited_at : null,
    acceptedAt:
      typeof row.founding_creator_accepted_at === "string" ? row.founding_creator_accepted_at : null,
  };
}

export function getNextAvailableFounderNumber(founderNumbers: Array<number | null | undefined>) {
  const used = new Set(
    founderNumbers
      .filter((value): value is number => typeof value === "number" && value >= 1 && value <= FOUNDING_CREATOR_LIMIT),
  );

  for (let number = 1; number <= FOUNDING_CREATOR_LIMIT; number += 1) {
    if (!used.has(number)) {
      return number;
    }
  }

  return null;
}

export async function listFeaturedFoundingCreators(limit = FOUNDING_CREATOR_LIMIT): Promise<PublicFoundingCreatorListItem[]> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return [];
  }

  const { data: creators, error } = await supabase
    .from("profiles")
    .select("id, handle, display_name, bio, avatar_url, banner_url, founding_creator_number, founding_creator_awarded_at, founding_creator_featured, founding_creator_notes, founding_creator_invited_at, founding_creator_accepted_at")
    .eq("is_public", true)
    .eq("is_creator", true)
    .eq("is_founding_creator", true)
    .eq("founding_creator_featured", true)
    .order("founding_creator_number", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  const profileIds = (creators ?? []).map((creator) => String(creator.id));
  const latestReleaseMap = new Map<string, string | null>();
  const releaseCountMap = new Map<string, number>();

  if (profileIds.length > 0) {
    const { data: films, error: filmsError } = await supabase
      .from("films")
      .select("creator_id, title, published_at")
      .in("creator_id", profileIds)
      .eq("publish_status", "published")
      .eq("visibility", "public")
      .eq("moderation_status", "active")
      .order("published_at", { ascending: false })
      .order("created_at", { ascending: false });

    if (filmsError) {
      throw new Error(filmsError.message);
    }

    for (const film of films ?? []) {
      const creatorId = String(film.creator_id);
      releaseCountMap.set(creatorId, (releaseCountMap.get(creatorId) ?? 0) + 1);

      if (!latestReleaseMap.has(creatorId)) {
        latestReleaseMap.set(creatorId, typeof film.title === "string" ? film.title : null);
      }
    }
  }

  const followerCounts = new Map<string, number>();
  await Promise.all(
    profileIds.map(async (profileId) => {
      followerCounts.set(profileId, await getFollowerCount(profileId));
    }),
  );

  return (creators ?? []).map((creator) => ({
    id: String(creator.id),
    handle: String(creator.handle),
    displayName: String(creator.display_name ?? ""),
    bio: typeof creator.bio === "string" ? creator.bio : null,
    avatarUrl: typeof creator.avatar_url === "string" ? creator.avatar_url : null,
    bannerUrl: typeof creator.banner_url === "string" ? creator.banner_url : null,
    publicFilmCount: releaseCountMap.get(String(creator.id)) ?? 0,
    followerCount: followerCounts.get(String(creator.id)) ?? 0,
    latestReleaseTitle: latestReleaseMap.get(String(creator.id)) ?? null,
    foundingCreator: mapFoundingCreatorInfo(creator),
  }));
}

function mapAdminFoundingCreatorRow(
  row: Record<string, unknown>,
  followerCount: number,
  publicFilmCount: number,
): AdminFoundingCreatorRow {
  return {
    id: String(row.id),
    handle: String(row.handle),
    displayName: String(row.display_name ?? ""),
    bio: typeof row.bio === "string" ? row.bio : null,
    avatarUrl: typeof row.avatar_url === "string" ? row.avatar_url : null,
    bannerUrl: typeof row.banner_url === "string" ? row.banner_url : null,
    isPublic: Boolean(row.is_public),
    isCreator: Boolean(row.is_creator),
    publicFilmCount,
    followerCount,
    foundingCreator: mapFoundingCreatorInfo(row),
  };
}

export async function getFoundingCreatorAdminOverview(limit = 40): Promise<AdminFoundingCreatorOverview> {
  const supabase = createServiceRoleSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, handle, display_name, bio, avatar_url, banner_url, is_public, is_creator, is_founding_creator, founding_creator_number, founding_creator_awarded_at, founding_creator_featured, founding_creator_notes, founding_creator_invited_at, founding_creator_accepted_at")
    .eq("is_creator", true)
    .order("display_name", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  const profileIds = (profiles ?? []).map((profile) => String(profile.id));
  const followerCounts = new Map<string, number>();
  const publicFilmCounts = new Map<string, number>();

  await Promise.all(
    profileIds.map(async (profileId) => {
      followerCounts.set(profileId, await getFollowerCount(profileId));
    }),
  );

  if (profileIds.length > 0) {
    const { data: films, error: filmsError } = await supabase
      .from("films")
      .select("creator_id")
      .in("creator_id", profileIds)
      .eq("publish_status", "published")
      .eq("visibility", "public")
      .eq("moderation_status", "active");

    if (filmsError) {
      throw new Error(filmsError.message);
    }

    for (const film of films ?? []) {
      const creatorId = String(film.creator_id);
      publicFilmCounts.set(creatorId, (publicFilmCounts.get(creatorId) ?? 0) + 1);
    }
  }

  const mapped = (profiles ?? []).map((profile) =>
    mapAdminFoundingCreatorRow(
      profile,
      followerCounts.get(String(profile.id)) ?? 0,
      publicFilmCounts.get(String(profile.id)) ?? 0,
    ),
  );

  const founders = mapped
    .filter((profile) => profile.foundingCreator.isFoundingCreator)
    .sort((a, b) => (a.foundingCreator.founderNumber ?? 999) - (b.foundingCreator.founderNumber ?? 999));

  const invited = mapped.filter(
    (profile) =>
      !profile.foundingCreator.isFoundingCreator &&
      Boolean(profile.foundingCreator.invitedAt) &&
      !profile.foundingCreator.acceptedAt,
  );

  const eligibleCreators = mapped
    .filter((profile) => !profile.foundingCreator.isFoundingCreator && !profile.foundingCreator.invitedAt)
    .sort((a, b) => {
      if (b.publicFilmCount !== a.publicFilmCount) {
        return b.publicFilmCount - a.publicFilmCount;
      }

      if (b.followerCount !== a.followerCount) {
        return b.followerCount - a.followerCount;
      }

      return a.displayName.localeCompare(b.displayName);
    });

  return {
    founders,
    invited,
    eligibleCreators,
    founderCount: founders.length,
    remainingSlots: Math.max(0, FOUNDING_CREATOR_LIMIT - founders.length),
    nextAvailableFounderNumber: getNextAvailableFounderNumber(
      founders.map((founder) => founder.foundingCreator.founderNumber),
    ),
  };
}

export async function updateFoundingCreatorStatus(input: {
  profileId: string;
  isFoundingCreator: boolean;
  founderNumber: number | null;
  featured: boolean;
  notes: string | null;
  markInvited: boolean;
  markAccepted: boolean;
}) {
  const supabase = createServiceRoleSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, is_creator, is_founding_creator, founding_creator_number, founding_creator_awarded_at, founding_creator_invited_at, founding_creator_accepted_at")
    .eq("id", input.profileId)
    .single();

  if (profileError || !profile) {
    throw new Error(profileError?.message ?? "Profile not found.");
  }

  if (!profile.is_creator) {
    throw new Error("Only approved creator accounts can receive Founding Creator status.");
  }

  if (input.isFoundingCreator) {
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
  const invitedAt = input.markInvited
    ? profile.founding_creator_invited_at ?? now
    : null;
  const acceptedAt = input.markAccepted || input.isFoundingCreator
    ? profile.founding_creator_accepted_at ?? now
    : null;

  const updatePayload = {
    is_founding_creator: input.isFoundingCreator,
    founding_creator_number: input.isFoundingCreator ? input.founderNumber : null,
    founding_creator_featured: input.isFoundingCreator ? input.featured : false,
    founding_creator_notes: input.notes,
    founding_creator_invited_at: invitedAt,
    founding_creator_accepted_at: acceptedAt,
    founding_creator_awarded_at: input.isFoundingCreator ? profile.founding_creator_awarded_at ?? now : null,
  };

  const { error: updateError } = await supabase
    .from("profiles")
    .update(updatePayload)
    .eq("id", input.profileId);

  if (updateError) {
    if (updateError.message.toLowerCase().includes("profiles_founding_creator_number_key")) {
      throw new Error("That Founding Creator number is already assigned.");
    }

    throw new Error(updateError.message);
  }
}


