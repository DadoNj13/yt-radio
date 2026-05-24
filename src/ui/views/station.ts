import { shareUrl } from '../../app/router';
import { getState, playStation, playTrack, subscribe, toggleShuffle, cycleRepeat } from '../../player/queue';
import { getSettings, getStation } from '../../store';
import { thumbnailUrl } from '../../player/url';
import { escapeHtml } from '../shell';
import { iconPlay, iconSearch, iconShuffle, iconRepeat, iconRepeatOne, iconShare } from '../icons';
import { toast } from '../toast';

let stationUnsub: (() => void) | null = null;

export function renderStation(el: HTMLElement, stationId: string): void {
  if (stationUnsub) stationUnsub();

  const station = getStation(stationId);
  if (!station) {
    el.innerHTML = `<h1 class="page-title">Station not found</h1><p style="color: var(--text-muted)">Use DJ to create stations.</p>`;
    return;
  }

  const settings = getSettings();
  const firstId = station.tracks[0]?.videoId;
  const heroImg = firstId ? thumbnailUrl(firstId) : '';
  const pb0 = getState();
  const isPlayingHere =
    pb0.stationId === stationId && (pb0.status === 'playing' || pb0.status === 'buffering');

  el.innerHTML = `
    <div class="station-hero glass" style="--station-accent: ${station.accent}">
      <div class="station-hero-bg" style="background: linear-gradient(135deg, ${station.accent}, transparent)"></div>
      <img class="station-hero-art ${isPlayingHere ? 'playing' : ''}" src="${heroImg}" alt="" />
      <div class="station-hero-info">
        <span class="label">Station</span>
        <h1>${escapeHtml(station.emoji ?? '')} ${escapeHtml(station.name)}</h1>
        <p style="color: var(--text-secondary)">${station.tracks.length} tracks · YouTube radio</p>
      </div>
    </div>
    <div class="station-actions">
      <button type="button" class="btn-primary" id="play-station">${iconPlay} Play station</button>
      <button type="button" class="btn-icon ${settings.shuffle ? 'active' : ''}" id="st-shuffle" title="Shuffle">${iconShuffle}</button>
      <button type="button" class="btn-icon ${settings.repeat !== 'off' ? 'active' : ''}" id="st-repeat" title="Repeat">${settings.repeat === 'one' ? iconRepeatOne : iconRepeat}</button>
      <button type="button" class="btn-icon" id="st-share" title="Copy share link">${iconShare}</button>
      <div class="search-wrap">
        ${iconSearch}
        <input type="search" class="search-input" id="track-search" placeholder="Filter tracks…" />
      </div>
    </div>
    <div class="track-list" id="track-list"></div>
  `;

  el.querySelector('#play-station')?.addEventListener('click', () => void playStation(stationId));
  el.querySelector('#st-shuffle')?.addEventListener('click', () => {
    toggleShuffle();
    renderStation(el, stationId);
  });
  el.querySelector('#st-repeat')?.addEventListener('click', () => {
    cycleRepeat();
    renderStation(el, stationId);
  });
  el.querySelector('#st-share')?.addEventListener('click', async () => {
    const idx = getState().stationId === stationId ? getState().trackIndex : 0;
    await navigator.clipboard.writeText(shareUrl(stationId, idx));
    toast('Link copied to clipboard');
  });

  const list = el.querySelector('#track-list')!;
  const search = el.querySelector('#track-search') as HTMLInputElement;

  const renderTracks = (filter: string) => {
    const playback = getState();
    const q = filter.trim().toLowerCase();
    const tracks = station.tracks
      .map((t, i) => ({ t, i }))
      .filter(({ t }) => {
        if (!q) return true;
        const title = (t.title ?? '').toLowerCase();
        const ch = (t.channel ?? '').toLowerCase();
        return title.includes(q) || ch.includes(q);
      });

    list.innerHTML = tracks
      .map(({ t, i }) => {
        const active =
          playback.stationId === stationId &&
          playback.trackIndex === i &&
          playback.videoId === t.videoId;
        return `
        <div class="track-row ${active ? 'playing' : ''}" data-index="${i}">
          <span class="index">${active ? '<div class="equalizer"><span></span><span></span><span></span></div>' : i + 1}</span>
          <img src="${thumbnailUrl(t.videoId)}" alt="" loading="lazy" />
          <div class="meta">
            <h4>${escapeHtml(t.title ?? 'Unknown')}</h4>
            <p>${escapeHtml(t.channel ?? '')}</p>
          </div>
        </div>
      `;
      })
      .join('');

    list.querySelectorAll('.track-row').forEach((row) => {
      row.addEventListener('click', () => {
        const idx = parseInt((row as HTMLElement).dataset.index!, 10);
        void playTrack(stationId, idx);
      });
    });
  };

  renderTracks('');
  search.addEventListener('input', () => renderTracks(search.value));

  stationUnsub = subscribe(() => {
    const art = el.querySelector('.station-hero-art');
    const pb = getState();
    const playing =
      pb.stationId === stationId && (pb.status === 'playing' || pb.status === 'buffering');
    art?.classList.toggle('playing', playing);
    renderTracks(search.value);
  });
}
