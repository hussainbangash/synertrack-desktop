import { BrowserWindow } from "electron";
import { IPC, type ActionResult, type AppState, type StartTimerInput } from "../shared/types";
import * as api from "./api";
import { clearCredentials, loadCredentials, saveCredentials } from "./config";

const EMPTY_STATE: AppState = {
  connected: false,
  serverUrl: null,
  user: null,
  projects: [],
  running: null,
  serverTimeOffsetMs: 0,
  runningIdleSeconds: 0,
  currentlyIdle: false,
  lastError: null,
};

let state: AppState = { ...EMPTY_STATE };
let creds: { serverUrl: string; token: string } | null = null;
let pollTimer: NodeJS.Timeout | null = null;
// Remembered so the global hotkey can resume the last project with one press.
let lastStart: StartTimerInput | null = null;

// Main-side subscribers (tray, taskbar badge, reminders) get every state change.
const listeners = new Set<(s: AppState) => void>();

export function getState(): AppState {
  return state;
}

export function onStateChange(listener: (s: AppState) => void): void {
  listeners.add(listener);
}

export function getCredentials(): { serverUrl: string; token: string } | null {
  return creds;
}

/** Fed by the idle watcher: accumulated idle seconds + whether we're idle now. */
export function setIdle(accumulatedSeconds: number, currentlyIdle: boolean): void {
  if (state.runningIdleSeconds === accumulatedSeconds && state.currentlyIdle === currentlyIdle) {
    return;
  }
  setState({ runningIdleSeconds: accumulatedSeconds, currentlyIdle });
}

function broadcast(): void {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) win.webContents.send(IPC.stateChanged, state);
  }
  for (const listener of listeners) listener(state);
}

function setState(patch: Partial<AppState>): void {
  state = { ...state, ...patch };
  broadcast();
}

function offsetFrom(serverTime: string): number {
  return new Date(serverTime).getTime() - Date.now();
}

function startPolling(): void {
  stopPolling();
  pollTimer = setInterval(() => void refresh(), 5000);
}

function stopPolling(): void {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

/** Poll the current running timer (cheap; runs on an interval). */
async function refresh(): Promise<void> {
  if (!creds) return;
  try {
    const timer = await api.getTimer(creds.serverUrl, creds.token);
    setState({
      running: timer.running,
      serverTimeOffsetMs: offsetFrom(timer.serverTime),
      connected: true,
      lastError: null,
    });
  } catch (e) {
    setState({ connected: false, lastError: (e as Error).message });
  }
}

/** Load user + projects (heavier; on sign-in and app start). */
async function loadMe(): Promise<void> {
  if (!creds) return;
  const me = await api.getMe(creds.serverUrl, creds.token);
  setState({
    user: me.user,
    projects: me.projects,
    connected: true,
    serverTimeOffsetMs: offsetFrom(me.serverTime),
    lastError: null,
  });
}

/** Restore a saved session on launch. */
export async function init(): Promise<void> {
  creds = loadCredentials();
  if (!creds) return;
  setState({ serverUrl: creds.serverUrl });
  try {
    await loadMe();
    await refresh();
    startPolling();
  } catch (e) {
    setState({ connected: false, lastError: (e as Error).message });
  }
}

export async function signIn(serverUrl: string, token: string): Promise<ActionResult> {
  const normalized = serverUrl.trim().replace(/\/+$/, "");
  if (!/^https?:\/\//.test(normalized)) {
    return { ok: false, error: "Server URL must start with http:// or https://" };
  }
  try {
    const me = await api.getMe(normalized, token.trim());
    creds = { serverUrl: normalized, token: token.trim() };
    saveCredentials(creds.serverUrl, creds.token);
    setState({
      serverUrl: creds.serverUrl,
      user: me.user,
      projects: me.projects,
      connected: true,
      serverTimeOffsetMs: offsetFrom(me.serverTime),
      lastError: null,
    });
    await refresh();
    startPolling();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export function signOut(): void {
  stopPolling();
  clearCredentials();
  creds = null;
  state = { ...EMPTY_STATE };
  broadcast();
}

export async function startTimer(input: StartTimerInput): Promise<ActionResult> {
  if (!creds) return { ok: false, error: "Not signed in." };
  try {
    const res = await api.startTimer(creds.serverUrl, creds.token, input);
    lastStart = input;
    setState({
      running: res.running,
      serverTimeOffsetMs: offsetFrom(res.serverTime),
      connected: true,
      runningIdleSeconds: 0,
      currentlyIdle: false,
      lastError: null,
    });
    if (!pollTimer) startPolling();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/**
 * Toggle for the global hotkey: stop if running; otherwise resume the last
 * project (or the first available). Signals when a manual pick is needed.
 */
export async function toggleTimer(): Promise<ActionResult & { needsPick?: boolean }> {
  if (!creds) return { ok: false, error: "Not signed in.", needsPick: true };
  if (state.running) return stopTimer();
  const resume = lastStart ?? (state.projects[0] ? { projectId: state.projects[0].id } : null);
  if (!resume) return { ok: false, error: "No project to start.", needsPick: true };
  return startTimer(resume);
}

export async function stopTimer(idleSeconds?: number): Promise<ActionResult> {
  if (!creds) return { ok: false, error: "Not signed in." };
  // Default to the idle we've accumulated for this timer if none was passed in.
  const idle = idleSeconds ?? state.runningIdleSeconds;
  try {
    await api.stopTimer(creds.serverUrl, creds.token, idle);
    setState({ running: null, runningIdleSeconds: 0, currentlyIdle: false });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export function forceRefresh(): Promise<void> {
  return refresh();
}
