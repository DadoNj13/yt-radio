import type { Route } from '../types';

type Handler = (route: Route) => void;

let current: Route = { name: 'home' };
const handlers = new Set<Handler>();

function parseRoute(): Route {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  const params = new URLSearchParams(window.location.search);

  if (path === '/now-playing' || path.endsWith('/now-playing')) {
    return { name: 'now-playing' };
  }
  if (path === '/dj' || path.endsWith('/dj')) {
    return { name: 'dj' };
  }

  const stationMatch = path.match(/\/station\/([^/]+)/);
  if (stationMatch) {
    return { name: 'station', stationId: decodeURIComponent(stationMatch[1]) };
  }

  const stationParam = params.get('station');
  if (stationParam) {
    return { name: 'station', stationId: stationParam };
  }

  return { name: 'home' };
}

function pathFor(route: Route): string {
  switch (route.name) {
    case 'home':
      return '/';
    case 'station':
      return `/station/${encodeURIComponent(route.stationId)}`;
    case 'now-playing':
      return '/now-playing';
    case 'dj':
      return '/dj';
  }
}

export function getRoute(): Route {
  return current;
}

export function navigate(route: Route, replace = false): void {
  current = route;
  const path = pathFor(route);
  if (replace) {
    window.history.replaceState({ route }, '', path);
  } else {
    window.history.pushState({ route }, '', path);
  }
  handlers.forEach((h) => h(current));
}

export function subscribe(fn: Handler): () => void {
  handlers.add(fn);
  fn(current);
  return () => handlers.delete(fn);
}

export function initRouter(): void {
  current = parseRoute();
  window.addEventListener('popstate', () => {
    current = parseRoute();
    handlers.forEach((h) => h(current));
  });
}

export function parseDeepLink(): { stationId: string; trackIndex: number } | null {
  const params = new URLSearchParams(window.location.search);
  const station = params.get('station');
  const track = params.get('track');
  if (!station) return null;
  const trackIndex = track ? parseInt(track, 10) : 0;
  return { stationId: station, trackIndex: Number.isFinite(trackIndex) ? trackIndex : 0 };
}

export function shareUrl(stationId: string, trackIndex: number): string {
  const base = window.location.href.split('?')[0].split('#')[0];
  const root = base.replace(/\/station\/[^/]*$/, '').replace(/\/(now-playing|dj)\/?$/, '') || base;
  const url = new URL(root.endsWith('/') ? root : `${root}/`);
  url.searchParams.set('station', stationId);
  url.searchParams.set('track', String(trackIndex));
  return url.toString();
}
