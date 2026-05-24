import type { AppData } from '../types';

const track = (
  videoId: string,
  title: string,
  channel: string,
): AppData['stations'][0]['tracks'][0] => ({
  videoId,
  title,
  channel,
  addedAt: Date.now(),
});

export const SEED_DATA: AppData = {
  settings: {
    volume: 80,
    shuffle: false,
    repeat: 'off',
  },
  stations: [
    {
      id: 'lofi',
      name: 'Lofi',
      emoji: '🌙',
      accent: '#5eead4',
      tracks: [
        track('jfKfPfyJRdk', 'lofi hip hop radio', 'Lofi Girl'),
        track('DWcJFNfaw9c', 'Chillhop Radio', 'Chillhop Music'),
        track('7NOSDKbSFiY', 'Chill Lofi Mix', 'Settle'),
        track('lTRiuuDWJ1E', 'Peaceful Piano', 'HalidonMusic'),
      ],
    },
    {
      id: 'pop',
      name: 'Pop',
      emoji: '🎤',
      accent: '#f472b6',
      tracks: [
        track('kJQP7kiw5Fk', 'Despacito', 'Luis Fonsi'),
        track('RgKAFK5djSk', 'See You Again', 'Wiz Khalifa'),
        track('OPf0YbXqDm0', 'Uptown Funk', 'Mark Ronson'),
        track('y6120QOlsfU', 'Sandstorm', 'Darude'),
      ],
    },
    {
      id: 'chill',
      name: 'Chill',
      emoji: '🌊',
      accent: '#93c5fd',
      tracks: [
        track('5qap5aO4i9A', 'Chillout Lounge', 'Chill Music'),
        track('n_Dv4JMiwK8', 'Coffee Shop Ambience', 'Relax Cafe'),
        track('rUxyKA_-bqg', 'Nature & Piano', 'Soothing Relaxation'),
        track('M7lc1UVf-VE', 'YouTube Developers', 'YouTube'),
      ],
    },
  ],
};
