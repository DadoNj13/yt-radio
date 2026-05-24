import { SEED_DATA } from './data/seed';
import type { AppData, AppSettings, Station, Track } from './types';
import { DEFAULT_SETTINGS } from './types';

const STORAGE_KEY = 'ytradio:v1';

type Listener = () => void;

let cache: AppData | null = null;
const listeners = new Set<Listener>();

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

function load(): AppData {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppData;
      cache = {
        stations: parsed.stations ?? clone(SEED_DATA.stations),
        settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
      };
      return cache;
    }
  } catch {
    /* use seed */
  }
  cache = clone(SEED_DATA);
  save();
  return cache;
}

function save(): void {
  if (!cache) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  listeners.forEach((fn) => fn());
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getData(): AppData {
  return load();
}

export function getStations(): Station[] {
  return load().stations;
}

export function getStation(id: string): Station | undefined {
  return load().stations.find((s) => s.id === id);
}

export function getSettings(): AppSettings {
  return load().settings;
}

export function updateSettings(partial: Partial<AppSettings>): void {
  const data = load();
  data.settings = { ...data.settings, ...partial };
  save();
}

export function addStation(station: Station): void {
  const data = load();
  if (data.stations.some((s) => s.id === station.id)) {
    throw new Error('Station id already exists');
  }
  data.stations.push(station);
  save();
}

export function updateStation(id: string, patch: Partial<Pick<Station, 'name' | 'emoji' | 'accent'>>): void {
  const s = getStation(id);
  if (!s) return;
  Object.assign(s, patch);
  save();
}

export function removeStation(id: string): void {
  const data = load();
  data.stations = data.stations.filter((s) => s.id !== id);
  save();
}

export function addTrack(stationId: string, track: Track): void {
  const s = getStation(stationId);
  if (!s) return;
  s.tracks.push(track);
  save();
}

export function removeTrack(stationId: string, index: number): void {
  const s = getStation(stationId);
  if (!s) return;
  s.tracks.splice(index, 1);
  save();
}

export function reorderTrack(stationId: string, from: number, to: number): void {
  const s = getStation(stationId);
  if (!s || from < 0 || to < 0 || from >= s.tracks.length || to >= s.tracks.length) return;
  const [item] = s.tracks.splice(from, 1);
  s.tracks.splice(to, 0, item);
  save();
}

export function reorderStation(from: number, to: number): void {
  const data = load();
  const [item] = data.stations.splice(from, 1);
  data.stations.splice(to, 0, item);
  save();
}

export function setStations(stations: Station[]): void {
  load().stations = stations;
  save();
}

export function resetToSeed(): void {
  cache = clone(SEED_DATA);
  save();
}

export function exportJson(): string {
  return JSON.stringify(load(), null, 2);
}

export function importJson(json: string): void {
  const parsed = JSON.parse(json) as AppData;
  if (!Array.isArray(parsed.stations)) throw new Error('Invalid backup file');
  cache = {
    stations: parsed.stations,
    settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
  };
  save();
}

export function slugId(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  let id = base || 'station';
  const stations = getStations();
  let n = 1;
  while (stations.some((s) => s.id === id)) {
    id = `${base}-${n++}`;
  }
  return id;
}
