import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource-variable/manrope";
import App from "./App";
import MiniTimer from "./MiniTimer";
import "./index.css";

// The always-on-top mini widget loads the same bundle with a #mini hash.
const isMini = window.location.hash === "#mini";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>{isMini ? <MiniTimer /> : <App />}</React.StrictMode>
);
