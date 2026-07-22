import { globalShortcut } from "electron";
import { toggleTimer } from "./app-state";
import { showMainWindow } from "./windows";

export const TOGGLE_ACCELERATOR = "CommandOrControl+Shift+T";

export function registerShortcuts(): void {
  const ok = globalShortcut.register(TOGGLE_ACCELERATOR, async () => {
    const res = await toggleTimer();
    // If we can't decide what to start, surface the window so the user picks.
    if (!res.ok && res.needsPick) showMainWindow();
  });
  if (!ok) {
    // Another app already owns the shortcut; not fatal.
    console.warn(`Could not register global shortcut ${TOGGLE_ACCELERATOR}`);
  }
}

export function unregisterShortcuts(): void {
  globalShortcut.unregisterAll();
}
