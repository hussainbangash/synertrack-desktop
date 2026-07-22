import { dialog, powerMonitor } from "electron";
import { getState, stopTimer } from "./app-state";

// How long with no keyboard/mouse input counts as "away" while a timer runs.
const IDLE_THRESHOLD_SECONDS = 300; // 5 minutes
const POLL_MS = 5000;

let wasIdle = false;
let peakIdleSeconds = 0;
let prompting = false;

export function initIdleWatch(): void {
  setInterval(() => void tick(), POLL_MS);
}

async function tick(): Promise<void> {
  const state = getState();
  if (!state.running || prompting) {
    wasIdle = false;
    return;
  }

  const idle = powerMonitor.getSystemIdleTime(); // seconds since last input

  if (idle >= IDLE_THRESHOLD_SECONDS) {
    wasIdle = true;
    peakIdleSeconds = idle;
  } else if (wasIdle && idle < IDLE_THRESHOLD_SECONDS) {
    // The user just came back from an idle stretch.
    wasIdle = false;
    await promptIdle(peakIdleSeconds);
  }
}

async function promptIdle(idleSeconds: number): Promise<void> {
  prompting = true;
  try {
    const minutes = Math.max(1, Math.round(idleSeconds / 60));
    const { response } = await dialog.showMessageBox({
      type: "question",
      buttons: ["Keep it", "Discard idle time"],
      defaultId: 0,
      cancelId: 0,
      title: "You were away",
      message: `You were idle for about ${minutes} minute${minutes === 1 ? "" : "s"}.`,
      detail: "Keep this time on your timer, or discard the idle stretch (this stops the timer)?",
    });
    // Discard: stop the entry, trimming the idle tail off the end.
    if (response === 1 && getState().running) {
      await stopTimer(idleSeconds);
    }
  } finally {
    prompting = false;
  }
}
