export type RepeatMode = 'off' | 'one' | 'all';

export type Track = {
  videoId: string;
  title?: string;
  channel?: string;
  addedAt: number;
};

export type Station = {
  id: string;
  name: string;
  emoji?: string;
  accent: string;
  tracks: Track[];
};

export type AppSettings = {
  volume: number;
  shuffle: boolean;
  repeat: RepeatMode;
};

export type AppData = {
  stations: Station[];
  settings: AppSettings;
};

export type Route =
  | { name: 'home' }
  | { name: 'station'; stationId: string }
  | { name: 'now-playing' }
  | { name: 'dj' };

export type PlayerStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'buffering';

export type PlaybackState = {
  status: PlayerStatus;
  stationId: string | null;
  stationName: string | null;
  trackIndex: number;
  videoId: string | null;
  title: string;
  channel: string;
  currentTime: number;
  duration: number;
  queue: string[];
  hasInteracted: boolean;
};

export const DEFAULT_SETTINGS: AppSettings = {
  volume: 80,
  shuffle: false,
  repeat: 'off',
};
