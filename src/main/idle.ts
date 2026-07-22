import { powerMonitor } from "electron";
import { getState, setIdle } from "./app-state";

// Any continuous stretch without keyboard/mouse input this long (or longer) is
// treated as idle and subtracted from worked time. Configurable — larger values
// are more forgiving of reading/thinking pauses.
const IDLE_THRESHOLD_SECONDS = 10;
const POLL_MS = 2000;

let currentTimerId: string | null = null;
let accumulated = 0; // total idle seconds counted for the current timer
let countedInEpisode = 0; // idle already counted within the ongoing idle stretch

export function initIdleWatch(): void {
  setInterval(tick, POLL_MS);
}

function tick(): void {
  const running = getState().running;

  // No timer → nothing to accumulate; reset for the next one.
  if (!running) {
    currentTimerId = null;
    accumulated = 0;
    countedInEpisode = 0;
    return;
  }

  // A new timer started → start its idle tally fresh.
  if (running.id !== currentTimerId) {
    currentTimerId = running.id;
    accumulated = 0;
    countedInEpisode = 0;
  }

  const idle = powerMonitor.getSystemIdleTime(); // seconds since last input

  if (idle >= IDLE_THRESHOLD_SECONDS) {
    // Within an idle stretch: count the newly-elapsed idle seconds. The first
    // reading past the threshold pulls in the whole stretch so far.
    if (idle > countedInEpisode) {
      accumulated += idle - countedInEpisode;
      countedInEpisode = idle;
    }
    setIdle(accumulated, true);
  } else {
    // Active again → the stretch (if any) ended.
    countedInEpisode = 0;
    setIdle(accumulated, false);
  }
}
