export type Film = {
  id: string;
  title: string;
  slug: string;
  synopsis: string | null;
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
  visibility: "public" | "unlisted" | "private";
  publishStatus: "draft" | "published" | "archived";
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
};

export type PublicFilmCard = {
  id: string;
  title: string;
  slug: string;
  synopsis: string | null;
  posterUrl: string | null;
  likeCount: number;
  commentCount: number;
  viewerHasLiked: boolean;
  creator: {
    handle: string;
    displayName: string;
    avatarUrl: string | null;
  };
  publishedAt: string | null;
};

export type FilmEditorValues = {
  id: string;
  title: string;
  slug: string;
  synopsis: string;
  description: string;
  posterUrl: string;
  muxAssetId: string | null;
  muxPlaybackId: string | null;
  promptText: string;
  workflowNotes: string;
  promptVisibility: "public" | "followers" | "private";
  visibility: "public" | "unlisted" | "private";
  publishStatus: "draft" | "published" | "archived";
};

export type PublicFilmPageData =
  {
    id: string;
    title: string;
    slug: string;
    synopsis: string | null;
    description: string | null;
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
      handle: string;
      displayName: string;
      avatarUrl: string | null;
    };
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
  };
  films: PublicFilmCard[];
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
