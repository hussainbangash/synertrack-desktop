import { contextBridge, ipcRenderer } from "electron";
import { IPC, type ActionResult, type AppState, type StartTimerInput } from "../shared/types";

const api = {
  getState: (): Promise<AppState> => ipcRenderer.invoke(IPC.stateGet),
  signIn: (serverUrl: string, token: string): Promise<ActionResult> =>
    ipcRenderer.invoke(IPC.signIn, serverUrl, token),
  signOut: (): Promise<void> => ipcRenderer.invoke(IPC.signOut),
  startTimer: (input: StartTimerInput): Promise<ActionResult> =>
    ipcRenderer.invoke(IPC.timerStart, input),
  stopTimer: (idleSeconds?: number): Promise<ActionResult> =>
    ipcRenderer.invoke(IPC.timerStop, idleSeconds),
  refresh: (): Promise<void> => ipcRenderer.invoke(IPC.timerRefresh),
  /** Subscribe to state pushes from the main process. Returns an unsubscribe fn. */
  onStateChanged: (cb: (state: AppState) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, state: AppState): void => cb(state);
    ipcRenderer.on(IPC.stateChanged, listener);
    return () => ipcRenderer.removeListener(IPC.stateChanged, listener);
  },
};

contextBridge.exposeInMainWorld("synertrack", api);

export type SynertrackApi = typeof api;
