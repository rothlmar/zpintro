# zpintro

An interactive introduction to properties of p-adic integers.

Live site: <https://rothlmar.github.io/zpintro/>

## Where things are

| Path | What it contains |
| --- | --- |
| `src/padic/` | **The mathematical engine.** Small, commented TypeScript modules: digits (series representation), coherent sequences, arithmetic, division/inverses, fractions, valuation. Start with `src/padic/index.ts`. |
| `src/padic/padic.test.ts` | Tests for the engine (Vitest). |
| `src/demos/` | One file per interactive demonstration on the page. |
| `src/ui/` | Shared display helpers: the per-demo prime picker, digit tables, KaTeX rendering. |
| `index.html` | The page text, with the math written in LaTeX (`$...$` and `$$...$$`), typeset by KaTeX. |
| `src/style.css` | Styles, including light/dark themes. |
| `.github/workflows/deploy.yml` | The GitHub Pages build and deploy. |

## Running locally

You need Node.js 20 or newer (CI uses Node 24).

```sh
npm install        # once, and again whenever package.json changes
npm run dev        # dev server at http://localhost:5173/zpintro/
```

The dev server reloads the page as soon as you save a file, so there's no need to push to GitHub to see a change. Other commands:

```sh
npm test           # run the engine tests once
npm run test:watch # rerun the tests on every save
npm run build      # type-check, then build the static site into dist/
npm run preview    # serve dist/ at http://localhost:4173/zpintro/ to check the production build
```

All URLs include `/zpintro/` because the site is served from that subpath on GitHub Pages, and `vite.config.ts` sets it as `base` so local and deployed URLs match.

## Publishing to GitHub Pages

Deployment is handled by GitHub Actions (`.github/workflows/deploy.yml`):

1. **One-time setup:** on GitHub, open the repository's **Settings → Pages**, and under *Build and deployment* set **Source** to **GitHub Actions**.
2. Every push to `main` triggers the workflow. It installs dependencies, runs the tests, builds the site, and publishes `dist/`. If a test fails, nothing is deployed.
3. Watch progress in the repository's **Actions** tab. When it finishes, the site is live at <https://rothlmar.github.io/zpintro/> (sometimes after a minute's delay).
4. To redeploy without a new commit, open **Actions → Deploy to GitHub Pages → Run workflow**.

`dist/` is git-ignored, and the built site is never committed.
