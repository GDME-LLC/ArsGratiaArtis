export type Film = {
  id: string;
  title: string;
  slug: string;
  synopsis: string | null;
  creatorId: string;
  posterUrl: string | null;
  muxPlaybackId: string | null;
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
  publishedAt: string | null;
};

export type FilmEditorValues = {
  id: string;
  title: string;
  slug: string;
  synopsis: string;
  description: string;
  posterUrl: string;
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
    publishedAt: string | null;
    creator: {
      handle: string;
      displayName: string;
      avatarUrl: string | null;
    };
  };
