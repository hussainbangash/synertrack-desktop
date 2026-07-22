import { app, BrowserWindow, ipcMain } from "electron";
import { IPC, type StartTimerInput } from "../shared/types";
import * as appState from "./app-state";
import { createMainWindow, showMainWindow } from "./windows";
import { initTray } from "./tray";
import { registerShortcuts, unregisterShortcuts } from "./shortcuts";
import { initIdleWatch } from "./idle";
import { initReminders } from "./notifications";
import { initMini } from "./mini";

function registerIpc(): void {
  ipcMain.handle(IPC.stateGet, () => appState.getState());
  ipcMain.handle(IPC.signIn, (_e, serverUrl: string, token: string) =>
    appState.signIn(serverUrl, token)
  );
  ipcMain.handle(IPC.signOut, () => appState.signOut());
  ipcMain.handle(IPC.timerStart, (_e, input: StartTimerInput) => appState.startTimer(input));
  ipcMain.handle(IPC.timerStop, (_e, idleSeconds?: number) => appState.stopTimer(idleSeconds));
  ipcMain.handle(IPC.timerRefresh, () => appState.forceRefresh());
}

// Single instance: focus the existing window instead of launching a second copy.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => showMainWindow());

  app.whenReady().then(async () => {
    app.setAppUserModelId("com.synertrack.desktop"); // Windows toast identity
    registerIpc();
    await appState.init();
    createMainWindow();
    initTray();
    registerShortcuts();
    initIdleWatch();
    initReminders();
    initMini();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    });
  });

  // Tray app: closing the window keeps it running in the tray. Quit via the tray.
  app.on("window-all-closed", () => {
    // Intentionally no-op so the timer keeps running in the tray.
  });

  app.on("will-quit", () => unregisterShortcuts());
}
