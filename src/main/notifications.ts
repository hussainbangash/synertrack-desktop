import { Notification } from "electron";
import { getState, onStateChange } from "./app-state";

const BREAK_AFTER_SECONDS = 90 * 60; // nudge to take a break after 90 min straight
const NUDGE_HOUR = 15; // afternoon "you haven't tracked today" nudge

let breakNotifiedTimerId: string | null = null;
let lastTrackedDay: string | null = null;
let lastNudgeDay: string | null = null;

function notify(title: string, body: string): void {
  if (Notification.isSupported()) new Notification({ title, body }).show();
}

function elapsedSeconds(): number {
  const s = getState();
  if (!s.running) return 0;
  return (Date.now() + s.serverTimeOffsetMs - new Date(s.running.startTime).getTime()) / 1000;
}

export function initReminders(): void {
  // Remember the last day the user tracked anything (for the daily nudge).
  onStateChange((s) => {
    if (s.running) lastTrackedDay = new Date().toDateString();
  });

  setInterval(() => {
    const s = getState();

    // Break reminder: one nudge per long-running timer.
    if (s.running) {
      if (elapsedSeconds() >= BREAK_AFTER_SECONDS && breakNotifiedTimerId !== s.running.id) {
        breakNotifiedTimerId = s.running.id;
        notify("Time for a break?", `You've been tracking ${s.running.project.name} for over 90 minutes.`);
      }
    }

    // Daily nudge: signed in, nothing running, afternoon, and nothing tracked today.
    const now = new Date();
    const today = now.toDateString();
    const trackedToday = lastTrackedDay === today;
    if (s.user && !s.running && now.getHours() >= NUDGE_HOUR && !trackedToday && lastNudgeDay !== today) {
      lastNudgeDay = today;
      notify("Track your time", "You haven't started a timer today — log your work in Synertrack.");
    }
  }, 60_000);
}
