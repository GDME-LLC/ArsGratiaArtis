export function getMuxThumbnailUrl(playbackId: string) {
  return `https://image.mux.com/${playbackId}/thumbnail.jpg`;
}

export function getMuxAnimatedPreviewUrl(playbackId: string) {
  return `https://image.mux.com/${playbackId}/animated.gif`;
}

export function getFilmArtworkUrl(input: {
  posterUrl?: string | null;
  muxPlaybackId?: string | null;
}) {
  if (input.posterUrl) {
    return input.posterUrl;
  }

  if (input.muxPlaybackId) {
    return getMuxThumbnailUrl(input.muxPlaybackId);
  }

  return null;
}
