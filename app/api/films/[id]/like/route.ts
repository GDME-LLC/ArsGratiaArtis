import { NextResponse } from "next/server";

import { getFilmLikeCounts, getViewerLikedFilmIds } from "@/lib/services/engagement";
import { createServerSupabaseClient, hasSupabaseServerEnv } from "@/lib/supabase/server";

type FilmLikeRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

async function validateFilmLikeTarget(filmId: string) {
  if (!hasSupabaseServerEnv()) {
    return { error: NextResponse.json({ error: "Supabase is not configured in this environment." }, { status: 503 }) };
  }

  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return { error: NextResponse.json({ error: "Supabase client unavailable." }, { status: 503 }) };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized." }, { status: 401 }) };
  }

  const { data: film, error: filmError } = await supabase
    .from("films")
    .select("id")
    .eq("id", filmId)
    .eq("publish_status", "published")
    .eq("visibility", "public")
    .maybeSingle();

  if (filmError) {
    return { error: NextResponse.json({ error: filmError.message }, { status: 400 }) };
  }

  if (!film) {
    return { error: NextResponse.json({ error: "Only published public films can be liked." }, { status: 404 }) };
  }

  return { supabase, userId: user.id };
}

async function getLikePayload(filmId: string, viewerId: string) {
  const counts = await getFilmLikeCounts([filmId]);
  const likedIds = await getViewerLikedFilmIds([filmId], viewerId);

  return {
    likeCount: counts.get(filmId) ?? 0,
    liked: likedIds.has(filmId),
  };
}

export async function POST(_: Request, { params }: FilmLikeRouteProps) {
  const { id } = await params;
  const access = await validateFilmLikeTarget(id);

  if ("error" in access) {
    return access.error;
  }

  const { error } = await access.supabase.from("film_likes").upsert({
    film_id: id,
    profile_id: access.userId,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(await getLikePayload(id, access.userId));
}

export async function DELETE(_: Request, { params }: FilmLikeRouteProps) {
  const { id } = await params;
  const access = await validateFilmLikeTarget(id);

  if ("error" in access) {
    return access.error;
  }

  const { error } = await access.supabase
    .from("film_likes")
    .delete()
    .eq("film_id", id)
    .eq("profile_id", access.userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(await getLikePayload(id, access.userId));
}
