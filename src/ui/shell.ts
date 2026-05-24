import { getRoute, initRouter, navigate, subscribe as routeSubscribe } from '../app/router';
import { getStations, subscribe as storeSubscribe } from '../store';
import type { Route } from '../types';
import { renderDj } from './views/dj';
import { renderHome } from './views/home';
import { renderNowPlaying } from './views/now-playing';
import { renderStation } from './views/station';
import { mountPlayerBar, updatePlayerBar } from './player-bar';
let mainEl: HTMLElement;
let sidebarStationsEl: HTMLElement;

export function mountShell(root: HTMLElement): void {
  initRouter();

  root.innerHTML = `
    <aside class="sidebar glass-strong" id="sidebar">
      <div class="sidebar-logo">
        <span>YT Radio</span>
      </div>
      <div class="nav-section">Menu</div>
      <button type="button" class="nav-item" data-nav="home">Home</button>
      <button type="button" class="nav-item" data-nav="now-playing">Now Playing</button>
      <button type="button" class="nav-item" data-nav="dj">DJ</button>
      <div class="nav-section">Stations</div>
      <div id="sidebar-stations"></div>
    </aside>
    <div class="main-wrap">
      <main class="main-scroll view-enter" id="main"></main>
    </div>
    <nav class="mobile-nav glass-strong" id="mobile-nav" aria-label="Mobile navigation"></nav>
  `;

  mainEl = root.querySelector('#main')!;
  sidebarStationsEl = root.querySelector('#sidebar-stations')!;

  mountPlayerBar(document.body);
  bindNav(root);
  renderSidebarStations();

  storeSubscribe(() => {
    renderSidebarStations();
    renderMain();
  });

  routeSubscribe(() => {
    updateNavActive();
    renderMain();
  });

  updateNavActive();
  renderMain();
}

function bindNav(root: HTMLElement): void {
  const go = (route: Route) => () => navigate(route);

  root.querySelector('[data-nav="home"]')?.addEventListener('click', go({ name: 'home' }));
  root.querySelector('[data-nav="now-playing"]')?.addEventListener('click', go({ name: 'now-playing' }));
  root.querySelector('[data-nav="dj"]')?.addEventListener('click', go({ name: 'dj' }));

  const mobile = root.querySelector('#mobile-nav')!;
  mobile.innerHTML = `
    <button type="button" class="nav-item" data-mnav="home">Home</button>
    <button type="button" class="nav-item" data-mnav="now-playing">Now</button>
    <button type="button" class="nav-item" data-mnav="dj">DJ</button>
  `;
  mobile.querySelector('[data-mnav="home"]')?.addEventListener('click', go({ name: 'home' }));
  mobile.querySelector('[data-mnav="now-playing"]')?.addEventListener('click', go({ name: 'now-playing' }));
  mobile.querySelector('[data-mnav="dj"]')?.addEventListener('click', go({ name: 'dj' }));

  document.body.classList.add('has-mobile-nav');
}

function renderSidebarStations(): void {
  const stations = getStations();
  const route = getRoute();
  sidebarStationsEl.innerHTML = stations
    .map(
      (s) => `
    <button type="button" class="nav-item ${route.name === 'station' && route.stationId === s.id ? 'active' : ''}" data-station="${s.id}">
      <span class="emoji">${s.emoji ?? '📻'}</span>
      ${escapeHtml(s.name)}
    </button>
  `,
    )
    .join('');

  sidebarStationsEl.querySelectorAll('[data-station]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = (btn as HTMLElement).dataset.station!;
      navigate({ name: 'station', stationId: id });
    });
  });
}

function updateNavActive(): void {
  const route = getRoute();
  document.querySelectorAll('.sidebar .nav-item[data-nav]').forEach((el) => {
    const nav = (el as HTMLElement).dataset.nav;
    let active = false;
    if (nav === 'home' && route.name === 'home') active = true;
    if (nav === 'now-playing' && route.name === 'now-playing') active = true;
    if (nav === 'dj' && route.name === 'dj') active = true;
    el.classList.toggle('active', active);
  });

  document.querySelectorAll('#mobile-nav .nav-item').forEach((el) => {
    const nav = (el as HTMLElement).dataset.mnav;
    let active = false;
    if (nav === 'home' && route.name === 'home') active = true;
    if (nav === 'now-playing' && route.name === 'now-playing') active = true;
    if (nav === 'dj' && route.name === 'dj') active = true;
    el.classList.toggle('active', active);
  });
}

function renderMain(): void {
  const route = getRoute();
  mainEl.className = 'main-scroll view-enter has-player';

  if (route.name === 'home') {
    renderHome(mainEl);
  } else if (route.name === 'station') {
    renderStation(mainEl, route.stationId);
  } else if (route.name === 'now-playing') {
    renderNowPlaying(mainEl);
  } else if (route.name === 'dj') {
    renderDj(mainEl);
  }

  updatePlayerBar();
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
