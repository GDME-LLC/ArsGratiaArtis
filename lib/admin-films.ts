import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";
import type { AdminFilmAction, AdminModerationOverview, AdminReportedFilmRow, AdminReportedProfileRow } from "@/types";

function getAdminFilmStorageClient() {
  const supabase = createServiceRoleSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  return supabase;
}

type ReportRecord = {
  target_id: string;
  target_type: "film" | "profile" | "comment" | "resource";
  reason: string;
  status: "open" | "reviewing" | "resolved" | "dismissed";
  created_at: string;
};

type ReportAggregate = {
  reportCount: number;
  openReportCount: number;
  latestReportAt: string;
  reasons: string[];
};

function aggregateReports(reports: ReportRecord[]) {
  const filmReportMap = new Map<string, ReportAggregate>();
  const profileReportMap = new Map<string, ReportAggregate>();

  for (const report of reports) {
    if (report.target_type !== "film" && report.target_type !== "profile") {
      continue;
    }

    const targetMap = report.target_type === "film" ? filmReportMap : profileReportMap;
    const existing = targetMap.get(report.target_id);

    if (existing) {
      existing.reportCount += 1;
      if (report.status === "open" || report.status === "reviewing") {
        existing.openReportCount += 1;
      }
      if (new Date(report.created_at).getTime() > new Date(existing.latestReportAt).getTime()) {
        existing.latestReportAt = report.created_at;
      }
      if (!existing.reasons.includes(report.reason)) {
        existing.reasons.push(report.reason);
      }
      continue;
    }

    targetMap.set(report.target_id, {
      reportCount: 1,
      openReportCount: report.status === "open" || report.status === "reviewing" ? 1 : 0,
      latestReportAt: report.created_at,
      reasons: [report.reason],
    });
  }

  return { filmReportMap, profileReportMap };
}

function matchesSearch(value: string, query: string) {
  return value.toLowerCase().includes(query);
}

function compareByPriority<T extends { openReportCount: number; latestReportAt: string; updatedAt?: string; createdAt?: string }>(a: T, b: T) {
  if (a.openReportCount !== b.openReportCount) {
    return b.openReportCount - a.openReportCount;
  }

  const aLatest = new Date(a.latestReportAt || a.updatedAt || a.createdAt || 0).getTime();
  const bLatest = new Date(b.latestReportAt || b.updatedAt || b.createdAt || 0).getTime();
  return bLatest - aLatest;
}

export async function listAdminModerationContent(search = ""): Promise<AdminModerationOverview> {
  const supabase = getAdminFilmStorageClient();
  const normalizedSearch = search.trim().toLowerCase();

  const { data: reports, error: reportsError } = await supabase
    .from("reports")
    .select("target_id, target_type, reason, status, created_at")
    .in("status", ["open", "reviewing"])
    .in("target_type", ["film", "profile"])
    .order("created_at", { ascending: false })
    .limit(500);

  if (reportsError) {
    throw new Error(reportsError.message);
  }

  const { filmReportMap, profileReportMap } = aggregateReports((reports ?? []) as ReportRecord[]);
  const reportedFilmIds = [...filmReportMap.keys()];
  const reportedProfileIds = [...profileReportMap.keys()];

  const filmQuery = supabase
    .from("films")
    .select("id, title, slug, synopsis, poster_url, publish_status, visibility, moderation_status, created_at, updated_at, published_at, creator_id")
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(normalizedSearch ? 50 : 40);

  const profileQuery = supabase
    .from("profiles")
    .select("id, handle, display_name, avatar_url, is_creator, is_public, created_at")
    .order("updated_at", { ascending: false })
    .limit(normalizedSearch ? 50 : 40);

  const [{ data: films, error: filmsError }, { data: profiles, error: profilesError }] = await Promise.all([
    normalizedSearch
      ? filmQuery.or(`title.ilike.%${normalizedSearch}%,slug.ilike.%${normalizedSearch}%`)
      : reportedFilmIds.length
        ? filmQuery.in("id", reportedFilmIds)
        : Promise.resolve({ data: [], error: null }),
    normalizedSearch
      ? profileQuery.or(`handle.ilike.%${normalizedSearch}%,display_name.ilike.%${normalizedSearch}%`)
      : reportedProfileIds.length
        ? profileQuery.in("id", reportedProfileIds)
        : Promise.resolve({ data: [], error: null }),
  ]);

  if (filmsError) {
    throw new Error(filmsError.message);
  }

  if (profilesError) {
    throw new Error(profilesError.message);
  }

  const creatorIds = [...new Set((films ?? []).map((film) => film.creator_id))];
  const { data: creatorProfiles, error: creatorProfilesError } = creatorIds.length
    ? await supabase.from("profiles").select("id, handle, display_name").in("id", creatorIds)
    : { data: [], error: null };

  if (creatorProfilesError) {
    throw new Error(creatorProfilesError.message);
  }

  const creatorMap = new Map(
    (creatorProfiles ?? []).map((profile) => [
      profile.id,
      {
        handle: String(profile.handle ?? ""),
        displayName: String(profile.display_name ?? ""),
      },
    ]),
  );

  const moderationFilms: AdminReportedFilmRow[] = (films ?? []).map((film) => {
    const aggregate = filmReportMap.get(film.id);

    return {
      id: film.id,
      title: film.title,
      slug: film.slug,
      synopsis: film.synopsis,
      posterUrl: film.poster_url ?? null,
      publishStatus: film.publish_status,
      visibility: film.visibility,
      moderationStatus: film.moderation_status ?? "active",
      createdAt: film.created_at,
      updatedAt: film.updated_at,
      publishedAt: film.published_at ?? null,
      reportCount: aggregate?.reportCount ?? 0,
      openReportCount: aggregate?.openReportCount ?? 0,
      latestReportAt: aggregate?.latestReportAt ?? film.updated_at,
      reportReasons: aggregate?.reasons ?? [],
      creator: creatorMap.get(film.creator_id) ?? {
        handle: "",
        displayName: "Unknown creator",
      },
    };
  });

  const moderationProfiles: AdminReportedProfileRow[] = (profiles ?? []).map((profile) => {
    const aggregate = profileReportMap.get(profile.id);

    return {
      id: profile.id,
      handle: String(profile.handle ?? ""),
      displayName: String(profile.display_name ?? ""),
      avatarUrl: profile.avatar_url ?? null,
      isCreator: Boolean(profile.is_creator),
      isPublic: Boolean(profile.is_public),
      reportCount: aggregate?.reportCount ?? 0,
      openReportCount: aggregate?.openReportCount ?? 0,
      latestReportAt: aggregate?.latestReportAt ?? profile.created_at ?? new Date(0).toISOString(),
      reportReasons: aggregate?.reasons ?? [],
    };
  });

  moderationFilms.sort(compareByPriority);
  moderationProfiles.sort(compareByPriority);

  return {
    search,
    films: moderationFilms,
    profiles: moderationProfiles,
    reportedFilmCount: moderationFilms.filter((film) => film.openReportCount > 0).length,
    reportedProfileCount: moderationProfiles.filter((profile) => profile.openReportCount > 0).length,
  };
}


export async function getAdminModerationAlertCount() {
  const supabase = getAdminFilmStorageClient();

  const { data, error } = await supabase
    .from("reports")
    .select("target_id, target_type")
    .in("status", ["open", "reviewing"])
    .in("target_type", ["film", "profile"]);

  if (error) {
    throw new Error(error.message);
  }

  return new Set((data ?? []).map((row) => `${row.target_type}:${row.target_id}`)).size;
}
export async function updateAdminFilmAction(input: {
  filmId: string;
  action: AdminFilmAction;
  adminUserId: string;
}) {
  const supabase = getAdminFilmStorageClient();

  const nextValues =
    input.action === "hide"
      ? {
          visibility: "private" as const,
          reviewed_at: new Date().toISOString(),
          reviewed_by: input.adminUserId,
        }
      : {
          publish_status: "draft" as const,
          published_at: null,
          reviewed_at: new Date().toISOString(),
          reviewed_by: input.adminUserId,
        };

  const { error } = await supabase.from("films").update(nextValues).eq("id", input.filmId);

  if (error) {
    throw new Error(error.message);
  }
}