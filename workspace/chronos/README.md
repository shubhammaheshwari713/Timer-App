# Chronos — Timer • Stopwatch • Counter

Modern web app built with React, TypeScript, Vite, Tailwind CSS, and PWA support.

Features:
- Stopwatch: start/stop/reset, laps, CSV export, multiple instances
- Timer: presets, custom inputs, alerts, notifications, multiple instances
- Counter: up/down, adjustable speed and step, progress, multiple instances
- Dark mode, offline-ready, persisted settings (Zustand)

## Local development
1. Install dependencies
```bash
npm install
```
2. Start dev server
```bash
echo http://localhost:5173
npm run dev
```
3. Build
```bash
npm run build
```

## Deploying to GitHub Pages
1. Create a GitHub repository (e.g. `username/chronos`)
2. Push the project to the `main` branch
3. Enable Pages: Settings → Pages → Source: GitHub Actions
4. On push to `main`, the workflow in `.github/workflows/deploy.yml` builds and deploys `dist/`

The Vite `base` is configured dynamically from `GITHUB_REPOSITORY` for Pages compatibility.