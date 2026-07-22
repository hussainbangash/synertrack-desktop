import { BrowserWindow, nativeImage, screen } from "electron";
import { join } from "path";
import trayIconPath from "../../resources/tray.png?asset";
import { getState } from "./app-state";
import { getMainWindow } from "./windows";

const WIDTH = 214;
const HEIGHT = 68;

let mini: BrowserWindow | null = null;

function createMini(): void {
  if (mini && !mini.isDestroyed()) return;
  const { workArea } = screen.getPrimaryDisplay();
  mini = new BrowserWindow({
    width: WIDTH,
    height: HEIGHT,
    x: workArea.x + workArea.width - WIDTH - 16,
    y: workArea.y + workArea.height - HEIGHT - 16,
    frame: false,
    resizable: false,
    movable: true,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    show: false,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
    },
  });
  mini.setAlwaysOnTop(true, "screen-saver");

  const rendererUrl = process.env["ELECTRON_RENDERER_URL"];
  if (rendererUrl) {
    mini.loadURL(`${rendererUrl}#mini`);
  } else {
    mini.loadFile(join(__dirname, "../renderer/index.html"), { hash: "mini" });
  }

  mini.on("closed", () => {
    mini = null;
  });
}

function showMini(): void {
  createMini();
  if (mini && !mini.isDestroyed() && !mini.isVisible()) mini.showInactive();
}

function hideMini(): void {
  if (mini && !mini.isDestroyed() && mini.isVisible()) mini.hide();
}

function mainIsVisible(): boolean {
  const w = getMainWindow();
  return Boolean(w && !w.isDestroyed() && w.isVisible() && !w.isMinimized());
}

function updateOverlay(): void {
  const w = getMainWindow();
  if (!w || w.isDestroyed()) return;
  if (getState().running) {
    const dot = nativeImage.createFromPath(trayIconPath).resize({ width: 16, height: 16 });
    w.setOverlayIcon(dot, "Timer running");
  } else {
    w.setOverlayIcon(null, "");
  }
}

/**
 * Show the mini timer whenever a timer is running and the main window isn't the
 * thing you're looking at (minimized, hidden, or closed to the tray). Polls once
 * a second so it stays correct even if the main window is recreated.
 */
export function initMini(): void {
  setInterval(() => {
    const running = Boolean(getState().running);
    if (running && !mainIsVisible()) showMini();
    else hideMini();
    updateOverlay();
  }, 1000);
}
