import { useState } from "react";
import type { AppState } from "../../shared/types";

export default function SignIn({ state }: { state: AppState }): React.JSX.Element {
  const [serverUrl, setServerUrl] = useState(state.serverUrl ?? "https://synertrack.vercel.app");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!token.trim()) {
      setError("Paste your access token.");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await window.synertrack.signIn(serverUrl, token);
    setBusy(false);
    if (!res.ok) setError(res.error ?? "Sign in failed.");
  }

  return (
    <main className="signin">
      <h1>Sign in</h1>
      <p className="hint">
        Create a token on your Synertrack profile (<em>Desktop app access</em>) and paste it here.
      </p>
      <form onSubmit={onSubmit}>
        <label>
          Server URL
          <input
            type="text"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            placeholder="https://synertrack.vercel.app"
            spellCheck={false}
          />
        </label>
        <label>
          Access token
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="synk_…"
            spellCheck={false}
            autoFocus
          />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button type="submit" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
