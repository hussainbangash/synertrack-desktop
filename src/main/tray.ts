import { app, Menu, Tray, nativeImage, type MenuItemConstructorOptions } from "electron";
import trayIconPath from "../../resources/tray.png?asset";
import { getState, onStateChange, startTimer, stopTimer } from "./app-state";
import { showMainWindow } from "./windows";
import { formatDuration } from "../shared/format";

let tray: Tray | null = null;

function elapsedSeconds(): number {
  const s = getState();
  if (!s.running) return 0;
  const gross = Math.floor(
    (Date.now() + s.serverTimeOffsetMs - new Date(s.running.startTime).getTime()) / 1000
  );
  return Math.max(0, gross - s.runningIdleSeconds); // net worked time
}

function buildMenu(): Menu {
  const state = getState();
  const items: MenuItemConstructorOptions[] = [];

  if (!state.user) {
    items.push({ label: "Sign in…", click: () => showMainWindow() });
  } else if (state.running) {
    const r = state.running;
    items.push({
      label: `● ${r.project.name}${r.task ? ` · ${r.task.title}` : ""}`,
      enabled: false,
    });
    items.push({ label: "Stop timer", click: () => void stopTimer() });
  } else {
    const projectItems: MenuItemConstructorOptions[] = state.projects.slice(0, 12).map((p) => ({
      label: p.name,
      click: () => void startTimer({ projectId: p.id }),
    }));
    items.push({
      label: "Start timer",
      submenu: projectItems.length ? projectItems : [{ label: "No projects", enabled: false }],
    });
  }

  items.push({ type: "separator" });
  items.push({ label: "Open Synertrack", click: () => showMainWindow() });
  items.push({ type: "separator" });
  items.push({ label: "Quit Synertrack", click: () => app.quit() });

  return Menu.buildFromTemplate(items);
}

function updateTooltip(): void {
  if (!tray) return;
  const state = getState();
  if (state.running) {
    const idle = state.currentlyIdle ? " (idle)" : "";
    tray.setToolTip(
      `Synertrack — ${state.running.project.name} · ${formatDuration(elapsedSeconds())}${idle}`
    );
  } else {
    tray.setToolTip(state.user ? "Synertrack — idle" : "Synertrack — signed out");
  }
}

export function initTray(): void {
  const image = nativeImage.createFromPath(trayIconPath).resize({ width: 16, height: 16 });
  tray = new Tray(image);
  tray.setToolTip("Synertrack");
  tray.on("click", () => showMainWindow());
  tray.setContextMenu(buildMenu());
  updateTooltip();

  onStateChange(() => {
    tray?.setContextMenu(buildMenu());
    updateTooltip();
  });

  // Keep the tooltip's elapsed time ticking while a timer runs.
  setInterval(() => {
    if (getState().running) updateTooltip();
  }, 1000);
}
