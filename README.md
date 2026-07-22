# Synertrack Desktop

A lightweight **Electron** tray companion for [Synertrack](https://github.com/hussainbangash/synertrack) —
start and stop your work timer from the system tray, keep it visible in an
always-on-top mini widget, and stay in sync with the web app and your team.

> Companion to the [Synertrack](https://synertrack.vercel.app) web app. It talks to
> the same account over a token-authenticated API, so a timer you start here shows
> up on the web dashboard (and vice-versa).

## Features

- **Tray timer** — start/stop against any of your projects straight from the system tray.
- **Always-on-top mini timer** — a small widget that appears (bottom-right) whenever a
  timer is running and the main window is minimized or closed to the tray, so the elapsed
  time is always in view. Windows taskbar shows a "running" overlay dot too.
- **Global hotkey** — `Ctrl/Cmd + Shift + T` toggles the timer from any app; it resumes
  your last project.
- **Idle detection** — if you're away from the keyboard for 5+ minutes while tracking,
  it asks whether to keep or discard the idle time when you return.
- **Reminders** — a break nudge after 90 minutes of continuous tracking, and an afternoon
  nudge if you haven't tracked anything that day.
- **Synced clock** — elapsed time is computed from the server's clock, so desktop and web
  always show the same value.
- **Secure token storage** — your access token is encrypted at rest with the OS keychain
  (Electron `safeStorage`).

## How it connects

1. In the Synertrack web app, open **Profile → Desktop app access** and create a token.
2. Launch this app, enter your server URL (e.g. `https://synertrack.vercel.app`) and paste
   the token. It's validated against `/api/desktop/me` and stored encrypted.
3. All timer actions call the Synertrack desktop API; nothing is stored locally except the
   encrypted token and your server URL.

## Develop / run

Requires Node 20+.

```powershell
npm install
npm run dev          # launches the app with hot reload
```

Other scripts:

```powershell
npm run build        # bundle main + preload + renderer into out/
npm run typecheck    # tsc for the main and renderer projects
npm run start        # preview the production build
node scripts/gen-icons.mjs   # regenerate the tray/app icons
```

## Package a Windows app

```powershell
npm run dist:win     # -> dist/Synertrack Setup <version>.exe  (installer)
                     #    dist/Synertrack-portable-<version>.exe (no install)
npm run pack:dir     # -> dist/win-unpacked/Synertrack.exe (unpacked, for testing)
```

- **Installer** — double-click once to install with a Start-menu + desktop shortcut.
- **Portable** — a single `.exe` you double-click to run directly.
- The build is **unsigned**, so Windows SmartScreen shows "Windows protected your PC" on
  first launch — choose **More info → Run anyway** (code signing needs a paid certificate).
- Packaging uses `electron-builder`. On Windows it needs to extract a signing toolchain that
  contains symlinks; if you hit *"a required privilege is not held"*, turn on **Settings →
  Privacy & security → For developers → Developer Mode** (or run the terminal as admin) once,
  then re-run.

## Architecture

- **Main process** owns all state: it holds the session, polls the running timer every few
  seconds, and pushes updates to every window. Modules: `app-state` (state + API
  orchestration), `api` (HTTP client), `config` (encrypted credential store), `tray`,
  `mini` (always-on-top widget + taskbar overlay), `shortcuts`, `idle`, `notifications`.
- **Preload** exposes a small typed bridge (`window.synertrack`) over `contextBridge` —
  the renderer never touches Node or Electron directly.
- **Renderer** (React) is a thin view: it mirrors the main-process state and calls the
  bridge to sign in / start / stop.

## Roadmap (v2)

- Periodic screenshots while tracking, with a blur toggle in the web viewer.
- Offline queue (track offline, sync on reconnect).
- Packaged installers (electron-builder) and auto-update.

## License

MIT
