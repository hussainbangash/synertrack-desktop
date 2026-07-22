// Shared contract between the main process, preload bridge, and renderer.

export interface Task {
  id: string;
  title: string;
  status: string;
}

export interface Project {
  id: string;
  name: string;
  color: string | null;
  tasks: Task[];
}

export interface UserInfo {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
}

export interface RunningTimer {
  id: string;
  startTime: string; // ISO
  notes: string | null;
  project: { id: string; name: string; color: string | null };
  task: { id: string; title: string } | null;
}

export interface AppState {
  connected: boolean;
  serverUrl: string | null;
  user: UserInfo | null;
  projects: Project[];
  running: RunningTimer | null;
  /** server clock minus local clock (ms); add to Date.now() for synced elapsed. */
  serverTimeOffsetMs: number;
  /** Idle seconds accumulated for the running timer (subtracted from worked time). */
  runningIdleSeconds: number;
  /** True while the user is currently idle past the threshold. */
  currentlyIdle: boolean;
  lastError: string | null;
}

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export interface StartTimerInput {
  projectId: string;
  taskId?: string | null;
  notes?: string | null;
}

// Channel names for IPC, kept in one place to avoid typos.
export const IPC = {
  stateGet: "state:get",
  stateChanged: "state:changed",
  signIn: "auth:signIn",
  signOut: "auth:signOut",
  timerStart: "timer:start",
  timerStop: "timer:stop",
  timerRefresh: "timer:refresh",
} as const;
