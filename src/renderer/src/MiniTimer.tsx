import { useAppState, useElapsedSeconds } from "./useAppState";
import { formatDuration } from "../../shared/format";

export default function MiniTimer(): React.JSX.Element {
  const state = useAppState();
  const running = state.running;
  const elapsed = useElapsedSeconds(running?.startTime, state.serverTimeOffsetMs);

  if (!running) {
    return <div className="mini mini-empty">Synertrack</div>;
  }

  return (
    <div className="mini">
      <span className="pdot" style={{ background: running.project.color ?? "#22c55e" }} />
      <div className="mini-text">
        <div className="mini-project">{running.project.name}</div>
        <div className="mini-elapsed">{formatDuration(elapsed)}</div>
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
