# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start the Vite dev server
- `npm run build` — production build
- `npm run preview` — preview the production build
- `npm run lint` — run ESLint (`eslint .`)

There is no test suite or test runner configured in this repo.

## Architecture

This is a static React + Vite single-page app (no backend, no env vars) that showcases 4H club members' yearly computer projects (3D-printed/CAD models, Scratch games, animations, posters).

**Entry chain**: `index.html` → `src/main.jsx` (mounts `<App>` in `StrictMode`/`BrowserRouter`, and registers a `/sw.js` service worker — note there is no `sw.js` file anywhere in `public/`, so this registration currently 404s silently) → `src/App.jsx`.

**Routing** (`src/App.jsx`) is the source of truth for which yearly page is "live":
- `/` and `/2025` → `Project25Pro` (`src/2025Pro.jsx`) — the current showcase page
- `/2025basic` → `Project25` (`src/2025.jsx`) — an older/fuller 2025 page kept around but not linked from nav
- `/2024` → `Project24` (`src/2024.jsx`)

**Year-page pattern**: each of `2024.jsx`, `2025.jsx`, `2025Pro.jsx` is a self-contained page component with hardcoded local arrays (`models`, `scratchGames`, `animations`, `posters`), each mapped into a gallery `<div>` using the shared viewer components below. To add a new project, add an entry to the relevant array in the page file and drop the asset under `public/<year>/...`.

**Shared viewer components** (flat in `src/`, no `components/` subdirectory):
- `STLModelViewer.jsx` — renders a `.stl` CAD file via `react-stl-viewer`'s `StlViewer`
- `ScratchGameViewer.jsx` — iframes a Scratch project embed URL
- `PosterViewer.jsx` — renders an image or video poster based on a `type` prop (`png`/`gif` vs `mp4`/`video`)
- `Navigation.jsx` — nav bar of `Link`s; takes a `currentPage` prop to hide the link back to the current page (used on the home and 2024 pages, but omitted from `2025.jsx`/`2025Pro.jsx`)

**Asset convention**: `public/<year>/models/<AuthorName>/*.stl` and `public/<year>/images/<file>` — assets are organized per year, per author. Site-wide assets (`public/qr.png`, `public/images/favicon.ico`) sit outside the year folders.

Styling is plain CSS per file (`App.css`, `index.css`, `Navigation.css`) — no CSS framework or preprocessor.

## Workflow

All work must be done on a **feature branch**. Create a branch from `main` for your task, make your changes, then open a pull request (PR) for review and merge. Do not commit directly to `main`.

## Deployment

This project is deployed via **Netlify**. Merges to `main` automatically trigger a Netlify deployment to production.
