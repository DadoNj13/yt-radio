# YT Radio

Spotify-style web radio that plays **your curated YouTube videos**. Use it in the browser from anywhere once hosted online.

## What “100% online” means

| Part | Online? |
|------|--------|
| **Website** | Yes — host on Netlify / GitHub Pages (steps below). You open a normal `https://…` link on any device. |
| **Music** | Yes — streams from YouTube when you have internet. |
| **Your playlists (DJ)** | Saved in **this browser** (localStorage). Same phone/computer keeps them; another device needs **Export / Import** on the DJ page. (Cloud accounts would need a server — not in v1.) |

You do **not** need to run `npm run dev` on your Mac unless you want to test before publishing.

---

## Put it online (Mac, no Terminal required)

### Option A — Netlify (recommended, ~5 minutes)

1. Create a free account at [netlify.com](https://www.netlify.com).
2. Create a free account at [github.com](https://github.com) if you don’t have one.
3. On GitHub: **New repository** → name it `yt-radio` → create.
4. Upload the **contents** of this `yt-radio` folder to that repo:
   - GitHub website: **Add file** → **Upload files** → drag everything from the `yt-radio` folder (including `package.json`, `src`, `public`, `netlify.toml`).
   - Or install [GitHub Desktop](https://desktop.github.com), add the `yt-radio` folder as a repository, publish to GitHub.
5. On Netlify: **Add new site** → **Import an existing project** → **GitHub** → choose `yt-radio`.
6. Netlify should auto-detect:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   (These are also in `netlify.toml`.)
7. Click **Deploy**. Wait ~1–2 minutes.
8. Netlify gives you a URL like `https://something-random.netlify.app`. Open it on your phone or Mac — that’s your live site.

You can rename the site under **Domain settings** on Netlify.

### Option B — GitHub Pages (build in the cloud)

1. Push this folder to a GitHub repo (repo root = this project, not the parent folder).
2. On GitHub: **Settings** → **Pages** → **Source:** GitHub Actions.
3. Push to `main`. The workflow in `.github/workflows/deploy-pages.yml` builds and deploys.
4. Your site: `https://YOUR_USERNAME.github.io/yt-radio/` (replace `yt-radio` with your repo name).

---

## Run on your Mac (optional, for testing only)

Only if you want to preview before deploying:

1. Install Node LTS from [nodejs.org](https://nodejs.org) (includes `npm`).
2. In Terminal:

```bash
cd "/Users/dezi/Documents/1_Biz/5_CursorAI/1_ActiveProjects_USED BY AI/yt-radio"
npm install
npm run dev
```

3. Open `http://localhost:5173`.

---

## Curate your radio (on the live site)

1. Open your `https://…` URL → **DJ**.
2. Paste a YouTube link → pick station → **Add to station**.
3. **Export backup** to save playlists; **Import** on another browser/device.

Videos must allow **embedding** (some official tracks block this).

## Share a station

On a station page, use the share icon. Open the link, then click once to start (browser autoplay rules).

## Tech

- Vite + TypeScript
- YouTube IFrame Player API
- localStorage (`ytradio:v1`)
