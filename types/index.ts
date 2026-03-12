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
