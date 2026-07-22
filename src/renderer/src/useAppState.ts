import { useEffect, useState } from "react";
import type { AppState } from "../../shared/types";

const INITIAL: AppState = {
  connected: false,
  serverUrl: null,
  user: null,
  projects: [],
  running: null,
  serverTimeOffsetMs: 0,
  lastError: null,
};

/** Mirror the main-process AppState into React, updating on every push. */
export function useAppState(): AppState {
  const [state, setState] = useState<AppState>(INITIAL);
  useEffect(() => {
    let active = true;
    window.synertrack.getState().then((s) => {
      if (active) setState(s);
    });
    const unsubscribe = window.synertrack.onStateChanged(setState);
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);
  return state;
}

/** Live-ticking elapsed seconds for a running timer, using the server clock offset. */
export function useElapsedSeconds(startTimeIso: string | undefined, offsetMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!startTimeIso) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startTimeIso]);
  if (!startTimeIso) return 0;
  return Math.max(0, Math.floor((now + offsetMs - new Date(startTimeIso).getTime()) / 1000));
}
