import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { CONSOLE_SIGNAL } from "./domain/argSignals";
import "./styles.css";
import "./motion.css";

const CONSOLE_SIGNAL_KEY = "nulltrace-4093.console-signal.v1";

if (localStorage.getItem(CONSOLE_SIGNAL_KEY) !== "seen") {
  console.info(CONSOLE_SIGNAL);
  localStorage.setItem(CONSOLE_SIGNAL_KEY, "seen");
}

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
