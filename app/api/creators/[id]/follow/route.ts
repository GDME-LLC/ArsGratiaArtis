import { NextResponse } from "next/server";

import {
  getFollowerCount,
  getViewerFollowingCreator,
} from "@/lib/services/engagement";
import { createServerSupabaseClient, hasSupabaseServerEnv } from "@/lib/supabase/server";

type CreatorFollowRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

async function validateCreatorFollowTarget(creatorId: string) {
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

  if (user.id === creatorId) {
    return { error: NextResponse.json({ error: "You cannot follow yourself." }, { status: 400 }) };
  }

  const { data: creator, error: creatorError } = await supabase
    .from("profiles")
    .select("id, is_public")
    .eq("id", creatorId)
    .maybeSingle();

  if (creatorError) {
    return { error: NextResponse.json({ error: creatorError.message }, { status: 400 }) };
  }

  if (!creator) {
    return { error: NextResponse.json({ error: "Creator not found." }, { status: 404 }) };
  }

  return { supabase, userId: user.id };
}

async function getFollowPayload(creatorId: string, viewerId: string) {
  const followerCount = await getFollowerCount(creatorId);
  const following = await getViewerFollowingCreator(creatorId, viewerId);

  return {
    followerCount,
    following,
  };
}

export async function POST(_: Request, { params }: CreatorFollowRouteProps) {
  const { id } = await params;
  const access = await validateCreatorFollowTarget(id);

  if ("error" in access) {
    return access.error;
  }

  const { error } = await access.supabase.from("creator_follows").upsert({
    follower_id: access.userId,
    creator_id: id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(await getFollowPayload(id, access.userId));
}

export async function DELETE(_: Request, { params }: CreatorFollowRouteProps) {
  const { id } = await params;
  const access = await validateCreatorFollowTarget(id);

  if ("error" in access) {
    return access.error;
  }

  const { error } = await access.supabase
    .from("creator_follows")
    .delete()
    .eq("follower_id", access.userId)
    .eq("creator_id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(await getFollowPayload(id, access.userId));
}
