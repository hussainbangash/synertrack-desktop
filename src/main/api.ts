import type { Project, RunningTimer, UserInfo } from "../shared/types";

// Thin HTTP client for the Synertrack desktop API. All calls run in the main
// process (Node fetch), so there are no CORS constraints. Each returns parsed
// data or throws an Error with a user-friendly message.

export interface MeResponse {
  user: UserInfo;
  projects: Project[];
  serverTime: string;
}

export interface TimerResponse {
  running: RunningTimer | null;
  serverTime: string;
}

async function request<T>(
  serverUrl: string,
  token: string,
  path: string,
  init?: { method?: string; body?: unknown }
): Promise<T> {
  const url = `${serverUrl.replace(/\/+$/, "")}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: init?.method ?? "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
      },
      body: init?.body ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    throw new Error("Can't reach the server. Check the URL and your connection.");
  }

  if (res.status === 401) throw new Error("Invalid or expired token.");
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? `Request failed (${res.status}).`);
  }
  return (await res.json()) as T;
}

export function getMe(serverUrl: string, token: string): Promise<MeResponse> {
  return request<MeResponse>(serverUrl, token, "/api/desktop/me");
}

export function getTimer(serverUrl: string, token: string): Promise<TimerResponse> {
  return request<TimerResponse>(serverUrl, token, "/api/desktop/timer");
}

export function startTimer(
  serverUrl: string,
  token: string,
  body: { projectId: string; taskId?: string | null; notes?: string | null }
): Promise<TimerResponse> {
  return request<TimerResponse>(serverUrl, token, "/api/desktop/timer/start", {
    method: "POST",
    body,
  });
}

export function stopTimer(
  serverUrl: string,
  token: string,
  idleSeconds?: number
): Promise<{ stopped: boolean; durationSeconds: number | null; serverTime: string }> {
  return request(serverUrl, token, "/api/desktop/timer/stop", {
    method: "POST",
    body: { idleSeconds: idleSeconds ?? 0 },
  });
}
