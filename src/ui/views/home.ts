import { navigate } from '../../app/router';
import { playStation } from '../../player/queue';
import { getStations } from '../../store';
import { escapeHtml } from '../shell';
import { iconPlay } from '../icons';

export function renderHome(el: HTMLElement): void {
  const stations = getStations();

  el.innerHTML = `
    <h1 class="page-title">Good evening</h1>
    <p style="color: var(--text-secondary); margin: -16px 0 24px;">Pick a station and start your radio.</p>
    <div class="station-grid" id="home-grid"></div>
  `;

  const grid = el.querySelector('#home-grid')!;
  grid.innerHTML = stations
    .map((s, i) => {
      const grad = `linear-gradient(135deg, ${s.accent}44, ${s.accent}11)`;
      return `
      <button type="button" class="station-card glass" data-id="${s.id}" style="animation-delay: ${i * 0.05}s">
        <div class="station-card-bg" style="background: ${grad}"></div>
        <div class="station-card-content">
          <h3>${escapeHtml(s.emoji ?? '')} ${escapeHtml(s.name)}</h3>
          <p>${s.tracks.length} tracks</p>
        </div>
        <span class="station-card-play" data-play="${s.id}" aria-label="Play">${iconPlay}</span>
      </button>
    `;
    })
    .join('');

  grid.querySelectorAll('.station-card').forEach((card) => {
    const id = (card as HTMLElement).dataset.id!;
    card.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('[data-play]')) return;
      navigate({ name: 'station', stationId: id });
    });
    card.querySelector('[data-play]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      void playStation(id);
    });
  });
}
