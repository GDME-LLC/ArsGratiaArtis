import type { FilmCategory } from "@/lib/films/categories";

export type ModerationStatus = "active" | "pending_review" | "flagged" | "removed";

export type FoundingCreatorInfo = {
  isFoundingCreator: boolean;
  founderNumber: number | null;
  awardedAt: string | null;
  featured: boolean;
  notes: string | null;
  invitedAt: string | null;
  acceptedAt: string | null;
};

export type Film = {
  id: string;
  title: string;
  slug: string;
  synopsis: string | null;
  category: FilmCategory;
  creatorId: string;
  posterUrl: string | null;
  muxPlaybackId: string | null;
  seriesId?: string | null;
  seasonNumber?: number | null;
  episodeNumber?: number | null;
  featured: boolean;
  createdAt: string;
};

export type CreatorFilmListItem = {
  id: string;
  title: string;
  slug: string;
  synopsis: string | null;
  category: FilmCategory;
  posterUrl: string | null;
  muxPlaybackId: string | null;
  visibility: "public" | "unlisted" | "private";
  publishStatus: "draft" | "published" | "archived";
  moderationStatus: ModerationStatus;
  moderationReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreatorProfile = {
  id: string;
  handle: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
};

export type Profile = {
  id: string;
  handle: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  websiteUrl: string | null;
  isCreator: boolean;
  foundingCreator: FoundingCreatorInfo;
};

export type PublicFilmCard = {
  id: string;
  title: string;
  slug: string;
  synopsis: string | null;
  category: FilmCategory;
  posterUrl: string | null;
  muxPlaybackId: string | null;
  likeCount: number;
  commentCount: number;
  viewerHasLiked: boolean;
  staffPick: boolean;
  createdAt: string;
  creator: {
    handle: string;
    displayName: string;
    avatarUrl: string | null;
    foundingCreator: FoundingCreatorInfo;
  };
  publishedAt: string | null;
};

export type FilmEditorValues = {
  id: string;
  title: string;
  slug: string;
  synopsis: string;
  description: string;
  category: FilmCategory;
  posterUrl: string;
  muxAssetId: string | null;
  muxPlaybackId: string | null;
  promptText: string;
  workflowNotes: string;
  promptVisibility: "public" | "followers" | "private";
  visibility: "public" | "unlisted" | "private";
  publishStatus: "draft" | "published" | "archived";
  moderationStatus: ModerationStatus;
  moderationReason: string;
  reviewedAt: string | null;
};

export type PublicFilmPageData = {
  id: string;
  title: string;
  slug: string;
  synopsis: string | null;
  description: string | null;
  category: FilmCategory;
  posterUrl: string | null;
  muxPlaybackId: string | null;
  creation: {
    promptText: string | null;
    workflowNotes: string | null;
    promptVisibility: "public" | "followers" | "private";
    tools: Array<{
      id: string;
      name: string;
      slug: string;
    }>;
  };
  engagement: {
    likeCount: number;
    viewerHasLiked: boolean;
    commentCount: number;
  };
  series: null | {
    id: string;
    title: string;
    slug: string;
    seasonNumber: number | null;
    episodeNumber: number | null;
    nextEpisode: null | {
      title: string;
      slug: string;
      seasonNumber: number | null;
      episodeNumber: number | null;
    };
  };
  publishedAt: string | null;
  creator: {
    id: string;
    handle: string;
    displayName: string;
    avatarUrl: string | null;
    foundingCreator: FoundingCreatorInfo;
  };
  isOwner: boolean;
  moderationStatus: ModerationStatus;
  moderationReason: string | null;
  reviewedAt: string | null;
};

export type PublicSeriesPageData = {
  series: {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    posterUrl: string | null;
    creator: {
      handle: string;
      displayName: string;
      avatarUrl: string | null;
    };
  };
  episodes: Array<{
    id: string;
    title: string;
    slug: string;
    synopsis: string | null;
    category: FilmCategory;
    posterUrl: string | null;
    seasonNumber: number | null;
    episodeNumber: number | null;
    publishedAt: string | null;
  }>;
};

export type PublicCreatorProfileData = {
  profile: {
    id: string;
    handle: string;
    displayName: string;
    bio: string | null;
    avatarUrl: string | null;
    bannerUrl: string | null;
    websiteUrl: string | null;
    isCreator: boolean;
    followerCount: number;
    viewerIsFollowing: boolean;
    isCurrentUser: boolean;
    foundingCreator: FoundingCreatorInfo;
  };
  films: PublicFilmCard[];
};

export type PublicCreatorListItem = {
  id: string;
  handle: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  isCreator: boolean;
  followerCount: number;
  publicFilmCount: number;
  seriesCount: number;
  latestPublishedAt?: string;
  foundingCreator: FoundingCreatorInfo;
  featuredReleases: Array<{
    id: string;
    title: string;
    slug: string;
    synopsis: string | null;
    publishedAt: string | null;
  }>;
};

export type PublicFoundingCreatorListItem = {
  id: string;
  handle: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  publicFilmCount: number;
  followerCount: number;
  latestReleaseTitle: string | null;
  foundingCreator: FoundingCreatorInfo;
};

export type AdminFoundingCreatorRow = {
  id: string;
  handle: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  isPublic: boolean;
  isCreator: boolean;
  publicFilmCount: number;
  followerCount: number;
  foundingCreator: FoundingCreatorInfo;
};

export type AdminFoundingCreatorOverview = {
  founders: AdminFoundingCreatorRow[];
  invited: AdminFoundingCreatorRow[];
  eligibleCreators: AdminFoundingCreatorRow[];
  founderCount: number;
  remainingSlots: number;
  nextAvailableFounderNumber: number | null;
};

export type FilmComment = {
  id: string;
  authorId: string;
  authorDisplayName: string;
  authorHandle: string;
  authorAvatarUrl: string | null;
  body: string;
  isDeleted: boolean;
  createdAt: string;
};
