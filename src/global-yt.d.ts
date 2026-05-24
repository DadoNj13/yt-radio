/** YouTube IFrame Player API — global types (keep separate from youtube.ts) */
declare namespace YT {
  enum PlayerState {
    UNSTARTED = -1,
    ENDED = 0,
    PLAYING = 1,
    PAUSED = 2,
    BUFFERING = 3,
    CUED = 5,
  }

  interface PlayerOptions {
    height?: string | number;
    width?: string | number;
    videoId?: string;
    playerVars?: Record<string, string | number>;
    events?: {
      onReady?: (event: { target: Player }) => void;
      onStateChange?: (event: { data: number; target: Player }) => void;
      onError?: (event: { data: number; target: Player }) => void;
    };
  }

  class Player {
    constructor(elementId: string | HTMLElement, options: PlayerOptions);
    playVideo(): void;
    pauseVideo(): void;
    stopVideo(): void;
    seekTo(seconds: number, allowSeekAhead: boolean): void;
    setVolume(volume: number): void;
    getVolume(): number;
    mute(): void;
    unMute(): void;
    isMuted(): boolean;
    getCurrentTime(): number;
    getDuration(): number;
    getPlayerState(): number;
    getVideoData(): { title: string; author: string; video_id: string };
    loadVideoById(videoId: string, startSeconds?: number): void;
    cueVideoById(videoId: string, startSeconds?: number): void;
    loadPlaylist(playlist: string | string[], index?: number, startSeconds?: number): void;
    cuePlaylist(playlist: string | string[], index?: number, startSeconds?: number): void;
    nextVideo(): void;
    previousVideo(): void;
    playVideoAt(index: number): void;
    getPlaylist(): string[];
    getPlaylistIndex(): number;
    destroy(): void;
  }
}

interface Window {
  YT?: {
    Player: typeof YT.Player;
    PlayerState: typeof YT.PlayerState;
  };
  onYouTubeIframeAPIReady?: () => void;
}
