export function getMuxHlsPlaybackUrl(playbackId: string) {
  return `https://stream.mux.com/${playbackId}.m3u8`;
}

export function getMuxMp4PlaybackUrl(playbackId: string) {
  return `https://stream.mux.com/${playbackId}/medium.mp4`;
}

export function getMuxPlaybackSources(playbackId: string) {
  return {
    hls: getMuxHlsPlaybackUrl(playbackId),
    mp4: getMuxMp4PlaybackUrl(playbackId),
  };
}

export function getMuxPlaybackUrl(playbackId: string) {
  return getMuxMp4PlaybackUrl(playbackId);
}
