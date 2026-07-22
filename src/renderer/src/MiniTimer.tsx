import { useAppState, useElapsedSeconds } from "./useAppState";
import { formatDuration } from "../../shared/format";

export default function MiniTimer(): React.JSX.Element {
  const state = useAppState();
  const running = state.running;
  const gross = useElapsedSeconds(running?.startTime, state.serverTimeOffsetMs);
  const net = Math.max(0, gross - state.runningIdleSeconds);

  if (!running) {
    return <div className="mini mini-empty">Synertrack</div>;
  }

  return (
    <div className="mini">
      <span
        className="pdot"
        style={{ background: state.currentlyIdle ? "#f59e0b" : running.project.color ?? "#22c55e" }}
      />
      <div className="mini-text">
        <div className="mini-project">
          {state.currentlyIdle ? "Idle" : running.project.name}
        </div>
        <div className={`mini-elapsed ${state.currentlyIdle ? "is-idle" : ""}`}>
          {formatDuration(net)}
        </div>
      </div>
      <button
        type="button"
        className="mini-stop"
        title="Stop timer"
        onClick={() => void window.synertrack.stopTimer()}
      >
        ■
      </button>
    </div>
  );
}
