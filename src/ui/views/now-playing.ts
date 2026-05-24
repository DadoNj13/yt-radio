import { getState, playTrack, subscribe } from '../../player/queue';
import { getStation } from '../../store';
import { thumbnailUrl } from '../../player/url';
import { escapeHtml } from '../shell';
import { navigate } from '../../app/router';

let unsub: (() => void) | null = null;

export function renderNowPlaying(el: HTMLElement): void {
  if (unsub) unsub();

  const render = () => {
    const s = getState();
    if (!s.videoId || !s.stationId) {
      el.innerHTML = `
        <div class="now-playing">
          <h1 class="page-title">Now Playing</h1>
          <p style="color: var(--text-muted)">Nothing playing yet. Choose a station on Home.</p>
          <button type="button" class="btn-primary" style="margin-top: 24px" id="go-home">Browse stations</button>
        </div>
      `;
      el.querySelector('#go-home')?.addEventListener('click', () => navigate({ name: 'home' }));
      return;
    }

    const station = getStation(s.stationId);
    const playing = s.status === 'playing' || s.status === 'buffering';

    el.innerHTML = `
      <div class="now-playing">
        <img class="now-playing-art ${playing ? 'playing' : ''}" src="${thumbnailUrl(s.videoId, 'max')}" alt="" onerror="this.src='${thumbnailUrl(s.videoId)}'" />
        <h1>${escapeHtml(s.title)}</h1>
        <p>${escapeHtml(s.channel)}</p>
        <p class="from">Playing from <strong>${escapeHtml(s.stationName ?? station?.name ?? '')}</strong></p>
        <div class="queue-section glass" style="padding: 20px; border-radius: var(--radius-lg)">
          <h3>Up next</h3>
          <div class="track-list" id="np-queue"></div>
        </div>
      </div>
    `;

    const queue = el.querySelector('#np-queue')!;
    const tracks = station?.tracks ?? [];
    queue.innerHTML = tracks
      .map((t, i) => {
        const active = i === s.trackIndex;
        return `
        <div class="track-row ${active ? 'playing' : ''}" data-index="${i}">
          <span class="index">${active ? '▶' : i + 1}</span>
          <img src="${thumbnailUrl(t.videoId)}" alt="" loading="lazy" />
          <div class="meta">
            <h4>${escapeHtml(t.title ?? 'Unknown')}</h4>
            <p>${escapeHtml(t.channel ?? '')}</p>
          </div>
        </div>
      `;
      })
      .join('');

    queue.querySelectorAll('.track-row').forEach((row) => {
      row.addEventListener('click', () => {
        const idx = parseInt((row as HTMLElement).dataset.index!, 10);
        if (s.stationId) void playTrack(s.stationId, idx);
      });
    });
  };

  render();
  unsub = subscribe(render);
}
