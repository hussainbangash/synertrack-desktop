import { useAppState } from "./useAppState";
import SignIn from "./SignIn";
import TimerPanel from "./TimerPanel";

export default function App(): React.JSX.Element {
  const state = useAppState();
  const signedIn = Boolean(state.user);

  return (
    <div className="app">
      <header className="brand">
        <span className="brand-dot" />
        <span className="brand-name">Synertrack</span>
        {signedIn ? (
          <span
            className={`conn ${state.connected ? "ok" : "off"}`}
            title={state.connected ? "Connected" : "Offline"}
          />
        ) : null}
      </header>
      {signedIn ? <TimerPanel state={state} /> : <SignIn state={state} />}
    </div>
  );
}
