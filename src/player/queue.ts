import { getSettings, getStation, subscribe as storeSubscribe, updateSettings } from '../store';
import type { PlaybackState, PlayerStatus, Track } from '../types';
import { createPlayer, getPlayer, setPlayerHandlers } from './youtube';

type Listener = (state: PlaybackState) => void;

const listeners = new Set<Listener>();

let state: PlaybackState = {
  status: 'idle',
  stationId: null,
  stationName: null,
  trackIndex: 0,
  videoId: null,
  title: '',
  channel: '',
  currentTime: 0,
  duration: 0,
  queue: [],
  hasInteracted: false,
};

let pollId: ReturnType<typeof setInterval> | null = null;
let playerInit: Promise<void> | null = null;
let advancing = false;

function emit(): void {
  listeners.forEach((fn) => fn({ ...state }));
}

function setStatus(status: PlayerStatus): void {
  state.status = status;
  emit();
}

function trackMeta(track: Track): { title: string; channel: string } {
  return {
    title: track.title ?? 'Unknown track',
    channel: track.channel ?? 'Unknown artist',
  };
}

function pickNextIndex(): number {
  const { queue, trackIndex } = state;
  const settings = getSettings();
  if (queue.length === 0) return 0;

  if (settings.repeat === 'one') return trackIndex;

  if (settings.shuffle && queue.length > 1) {
    let next = trackIndex;
    while (next === trackIndex) {
      next = Math.floor(Math.random() * queue.length);
    }
    return next;
  }

  const next = trackIndex + 1;
  if (next < queue.length) return next;
  if (settings.repeat === 'all') return 0;
  return -1;
}

function syncFromPlayer(): void {
  const p = getPlayer();
  if (!p) return;
  try {
    state.currentTime = p.getCurrentTime() || 0;
    state.duration = p.getDuration() || 0;
    const data = p.getVideoData?.();
    if (data?.title) {
      state.title = data.title;
      state.channel = data.author ?? state.channel;
    }
  } catch {
    /* not ready */
  }
}

function startPoll(): void {
  stopPoll();
  pollId = setInterval(() => {
    if (state.status === 'playing' || state.status === 'buffering') {
      syncFromPlayer();
      emit();
    }
  }, 250);
}

function stopPoll(): void {
  if (pollId) {
    clearInterval(pollId);
    pollId = null;
  }
}

function handleStateChange(data: number): void {
  switch (data) {
    case YT.PlayerState.PLAYING:
      setStatus('playing');
      startPoll();
      syncFromPlayer();
      break;
    case YT.PlayerState.PAUSED:
      setStatus('paused');
      stopPoll();
      syncFromPlayer();
      break;
    case YT.PlayerState.BUFFERING:
      setStatus('buffering');
      break;
    case YT.PlayerState.ENDED:
      stopPoll();
      void advance();
      break;
    default:
      break;
  }
}

function handleError(): void {
  void import('../ui/toast').then(({ toast }) => {
    toast('Video unavailable or blocked. Skipping…');
  });
  void advance();
}

async function ensurePlayer(): Promise<YT.Player> {
  if (!playerInit) {
    setPlayerHandlers({
      onStateChange: handleStateChange,
      onError: handleError,
    });
    playerInit = (async () => {
      const host = document.getElementById('yt-player-host');
      if (!host) throw new Error('Player host missing');
      await createPlayer(host);
      storeSubscribe(() => {
        const p = getPlayer();
        if (p) p.setVolume(getSettings().volume);
      });
    })();
  }
  await playerInit;
  const p = getPlayer();
  if (!p) throw new Error('Player failed to init');
  return p;
}

function loadIndex(index: number): void {
  const station = state.stationId ? getStation(state.stationId) : null;
  if (!station || index < 0 || index >= state.queue.length) {
    setStatus('idle');
    state.videoId = null;
    emit();
    return;
  }

  const track = station.tracks[index];
  if (!track) return;

  state.trackIndex = index;
  state.videoId = track.videoId;
  const meta = trackMeta(track);
  state.title = meta.title;
  state.channel = meta.channel;
  state.currentTime = 0;
  state.duration = 0;
  setStatus('loading');

  const p = getPlayer();
  if (!p) return;

  p.setVolume(getSettings().volume);
  p.loadVideoById(track.videoId, 0);
  emit();
}

export async function initQueue(): Promise<void> {
  await ensurePlayer();
}

export async function playStation(stationId: string, startIndex = 0): Promise<void> {
  const station = getStation(stationId);
  if (!station || station.tracks.length === 0) {
    const { toast } = await import('../ui/toast');
    toast('This station has no tracks. Add some in DJ.');
    return;
  }

  state.hasInteracted = true;
  state.stationId = stationId;
  state.stationName = station.name;
  state.queue = station.tracks.map((t) => t.videoId);

  await ensurePlayer();
  loadIndex(Math.min(startIndex, station.tracks.length - 1));
}

export async function playTrack(stationId: string, index: number): Promise<void> {
  await playStation(stationId, index);
}

export function togglePlay(): void {
  const p = getPlayer();
  if (!p || !state.videoId) return;
  state.hasInteracted = true;

  const ps = p.getPlayerState();
  if (ps === YT.PlayerState.PLAYING) {
    p.pauseVideo();
  } else {
    p.playVideo();
  }
}

export function pause(): void {
  getPlayer()?.pauseVideo();
}

export function play(): void {
  state.hasInteracted = true;
  getPlayer()?.playVideo();
}

export async function next(): Promise<void> {
  await advance();
}

export async function previous(): Promise<void> {
  const p = getPlayer();
  if (p && state.currentTime > 3) {
    p.seekTo(0, true);
    return;
  }
  const prev = state.trackIndex - 1;
  if (prev >= 0) {
    loadIndex(prev);
    return;
  }
  const settings = getSettings();
  if (settings.repeat === 'all' && state.queue.length > 0) {
    loadIndex(state.queue.length - 1);
  }
}

async function advance(): Promise<void> {
  if (advancing) return;
  advancing = true;
  try {
    const settings = getSettings();
    if (settings.repeat === 'one' && state.videoId) {
      loadIndex(state.trackIndex);
      return;
    }

    const nextIndex = pickNextIndex();
    if (nextIndex < 0) {
      setStatus('paused');
      getPlayer()?.pauseVideo();
      return;
    }
    loadIndex(nextIndex);
  } finally {
    advancing = false;
  }
}

export function seek(seconds: number): void {
  const p = getPlayer();
  if (!p) return;
  p.seekTo(seconds, true);
  state.currentTime = seconds;
  emit();
}

export function setVolume(vol: number): void {
  updateSettings({ volume: vol });
  getPlayer()?.setVolume(vol);
}

export function toggleShuffle(): void {
  const s = getSettings();
  updateSettings({ shuffle: !s.shuffle });
}

export function cycleRepeat(): void {
  const order = ['off', 'all', 'one'] as const;
  const s = getSettings();
  const i = order.indexOf(s.repeat);
  updateSettings({ repeat: order[(i + 1) % order.length] });
}

export function getState(): PlaybackState {
  return { ...state };
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  fn({ ...state });
  return () => listeners.delete(fn);
}
