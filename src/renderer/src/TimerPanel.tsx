import { useState } from "react";
import type { AppState } from "../../shared/types";
import { formatDuration } from "../../shared/format";
import { useElapsedSeconds } from "./useAppState";

export default function TimerPanel({ state }: { state: AppState }): React.JSX.Element {
  return state.running ? <Running state={state} /> : <StartForm state={state} />;
}

function Footer({ state }: { state: AppState }): React.JSX.Element {
  return (
    <footer className="foot">
      <span className="foot-email">{state.user?.email}</span>
      <button type="button" className="link" onClick={() => void window.synertrack.signOut()}>
        Sign out
      </button>
    </footer>
  );
}

function Running({ state }: { state: AppState }): React.JSX.Element {
  const running = state.running!;
  const gross = useElapsedSeconds(running.startTime, state.serverTimeOffsetMs);
  const net = Math.max(0, gross - state.runningIdleSeconds);
  const [busy, setBusy] = useState(false);

  async function stop(): Promise<void> {
    setBusy(true);
    await window.synertrack.stopTimer();
    setBusy(false);
  }

  return (
    <main className="timer running">
      <div className="running-project">
        <span className="pdot" style={{ background: running.project.color ?? "#22c55e" }} />
        {running.project.name}
      </div>
      {running.task ? <div className="running-task">{running.task.title}</div> : null}
      <div className={`elapsed ${state.currentlyIdle ? "is-idle" : ""}`}>{formatDuration(net)}</div>
      {state.currentlyIdle ? (
        <div className="idle-badge">⏸ Idle - not counting time</div>
      ) : state.runningIdleSeconds > 0 ? (
        <div className="idle-note">{formatDuration(state.runningIdleSeconds)} idle removed</div>
      ) : null}
      {running.notes ? <div className="running-notes">{running.notes}</div> : null}
      <button type="button" className="stop" onClick={() => void stop()} disabled={busy}>
        {busy ? "Stopping…" : "■ Stop"}
      </button>
      <Footer state={state} />
    </main>
  );
}

function StartForm({ state }: { state: AppState }): React.JSX.Element {
  const [projectId, setProjectId] = useState(state.projects[0]?.id ?? "");
  const [taskId, setTaskId] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const project = state.projects.find((p) => p.id === projectId);

  async function start(): Promise<void> {
    if (!projectId) {
      setError("Pick a project.");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await window.synertrack.startTimer({
      projectId,
      taskId: taskId || null,
      notes: notes || null,
    });
    setBusy(false);
    if (!res.ok) setError(res.error ?? "Couldn't start the timer.");
    else setNotes("");
  }

  if (state.projects.length === 0) {
    return (
      <main className="timer">
        <p className="hint">No projects available to log against yet.</p>
        <Footer state={state} />
      </main>
    );
  }

  return (
    <main className="timer">
      <label>
        Project
        <select
          value={projectId}
          onChange={(e) => {
            setProjectId(e.target.value);
            setTaskId("");
          }}
        >
          {state.projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Task
        <select value={taskId} onChange={(e) => setTaskId(e.target.value)}>
          <option value="">No task</option>
          {project?.tasks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
      </label>
      <input
        className="notes-input"
        placeholder="What are you working on? (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      {error ? <p className="error">{error}</p> : null}
      <button type="button" className="start" onClick={() => void start()} disabled={busy}>
        {busy ? "Starting…" : "▶ Start timer"}
      </button>
      <Footer state={state} />
    </main>
  );
}
