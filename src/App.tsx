import { FormEvent, useEffect, useRef, useState } from "react";
import { BinaryField } from "./components/BinaryField";
import { CustomCursor } from "./components/CustomCursor";
import { ObservationGlyph } from "./components/ObservationGlyph";
import { ReceiptCard } from "./components/ReceiptCard";
import { UnverifiedModal } from "./components/UnverifiedModal";
import { SMALL_SIGNAL_DELAYS_MS, SMALL_SIGNALS } from "./domain/argSignals";
import { ARG_STAGES, type ArgSessionState, type ArgStage } from "./domain/argTypes";
import { useArgSession } from "./hooks/useArgSession";
import { navigateTo, useHashRoute } from "./router/useHashRoute";

const GLYPH_CLICK_THRESHOLD = 7;
const TICK_INTERVAL_MS = 13 * 1000;

export function App() {
  const route = useHashRoute();
  const { state, isLoading, actions } = useArgSession();
  const [entryCode, setEntryCode] = useState("");
  const [signalCommand, setSignalCommand] = useState("");
  const [glyphClickCount, setGlyphClickCount] = useState(0);
  const [nowMs, setNowMs] = useState(() => getCurrentTimeMs());
  const entryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const intervalId = window.setInterval(() => setNowMs(getCurrentTimeMs()), TICK_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!state || state.currentStage !== "ENTRY") {
      return;
    }

    function handleNumericDiscovery(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey || event.key.length !== 1) {
        return;
      }

      if (!/^\d$/.test(event.key)) {
        return;
      }

      const target = event.target;

      if (target instanceof HTMLElement && target.closest("input, textarea, select")) {
        return;
      }

      event.preventDefault();
      setEntryCode((current) => (current.length < 4 ? `${current}${event.key}` : current));
      actions.inspectEntrySignal("numeric_key");
    }

    window.addEventListener("keydown", handleNumericDiscovery);
    return () => window.removeEventListener("keydown", handleNumericDiscovery);
  }, [actions, state]);

  useEffect(() => {
    if (state?.currentStage === "INPUT_DISCOVERED") {
      entryInputRef.current?.focus();
    }
  }, [state?.currentStage]);

  useEffect(() => {
    if (!state) {
      return;
    }

    updateDocumentSignal(state.currentStage);
  }, [state?.currentStage]);

  if (isLoading || !state) {
    return (
      <main className="app-shell app-shell--loading">
        <p>NULLTRACE boot sequence...</p>
      </main>
    );
  }

  const canEnterCode = state.currentStage === "INPUT_DISCOVERED";
  const canSubmitSignal = state.currentStage === "UNVERIFIED";
  const canReopenUnverifiedDialog =
    state.currentStage === "UNVERIFIED" && !state.entryInteraction.unverifiedDialogOpen;
  const canCommitPath = state.currentStage === "STYLE_CLUE_FOUND";
  const canIssueReceipt = state.currentStage === "VERIFIED";
  const inputChannelVisible = state.currentStage !== "ENTRY";
  const shouldShowReceipt = route === "receipt" || state.currentStage === "RECEIPT_ISSUED";
  const smallSignals = getSmallSignals(state, nowMs);
  const assistAvailable = isTotalAssistAvailable(state, nowMs);
  const stageOrdinal = ARG_STAGES.indexOf(state.currentStage) + 1;

  function handleSurfaceSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (canEnterCode) {
      actions.submitEntryCode(entryCode);
      setEntryCode("");
      return;
    }

    if (canSubmitSignal) {
      actions.submitStyleClue(signalCommand);
      setSignalCommand("");
    }
  }

  function handleEntryCodeChange(value: string) {
    const nextValue = value.replace(/\D/g, "").slice(0, 4);

    if (nextValue.length > 0) {
      actions.recordInputStarted();
    }

    setEntryCode(nextValue);
  }

  function handleSignalCommandChange(value: string) {
    setSignalCommand(value.slice(0, 32));
  }

  function revealInputFromGlyphClick() {
    if (!state || state.currentStage !== "ENTRY") {
      return;
    }

    actions.recordGlyphInvestigation();
    const nextCount = glyphClickCount + 1;

    if (nextCount >= GLYPH_CLICK_THRESHOLD) {
      setGlyphClickCount(0);
      actions.inspectEntrySignal("glyph_click");
      return;
    }

    setGlyphClickCount(nextCount);
  }

  function revealInputFromFocusedGlyph() {
    if (state?.currentStage === "ENTRY") {
      setGlyphClickCount(0);
      actions.inspectEntrySignal("glyph_keyboard_enter");
    }
  }

  return (
    <main className="app-shell observation-shell">
      <CustomCursor />
      <BinaryField />
      <header className="apparatus-header">
        <p className="project-mark">NULLTRACE 4093</p>
        <p className="session-mark">{state.sessionId.slice(0, 8)}</p>
      </header>

      {shouldShowReceipt ? (
        <section className="receipt-view">
          {state.receipt ? (
            <ReceiptCard onNewSession={actions.resetSession} receipt={state.receipt} />
          ) : (
            <div className="empty-receipt">
              <p className="eyebrow">NO RECEIPT</p>
              <h2>Receipt has not been issued.</h2>
              <button onClick={() => navigateTo("console")} type="button">
                Return
              </button>
            </div>
          )}
        </section>
      ) : (
        <section className="observation-stage" aria-labelledby="project-title">
          <h1 className="sr-only" id="project-title">
            NULLTRACE 4093
          </h1>

          <ObservationGlyph
            clickCount={glyphClickCount}
            clickThreshold={GLYPH_CLICK_THRESHOLD}
            currentStage={state.currentStage}
            onGlyphClick={revealInputFromGlyphClick}
            onKeyboardReveal={revealInputFromFocusedGlyph}
          />

          <div className="apparatus-readout" aria-label="Observation state">
            <span>{state.currentStage}</span>
            <span>
              S{stageOrdinal}/{toBinary(stageOrdinal, 4)}
            </span>
            <span>
              {String(state.inputAttempts).padStart(2, "0")}/{toBinary(state.inputAttempts, 5)}
            </span>
            <span>{state.entryInteraction.routeProfile}</span>
            <span>{state.startedAt.slice(11, 19)}</span>
          </div>

          {smallSignals.length > 0 && !state.entryInteraction.unverifiedDialogOpen && (
            <aside className="small-signal" aria-label="Small signal">
              {smallSignals.map((signal) => (
                <p key={signal}>{signal}</p>
              ))}
            </aside>
          )}

          {inputChannelVisible && (
            <form
              className="entry-channel"
              data-active={canEnterCode || canSubmitSignal}
              onSubmit={handleSurfaceSubmit}
            >
              <label htmlFor="entry-code">Input</label>
              <div className="entry-channel__row">
                <input
                  autoComplete="off"
                  disabled={!canEnterCode && !canSubmitSignal}
                  id="entry-code"
                  inputMode={canEnterCode ? "numeric" : "text"}
                  maxLength={canEnterCode ? 4 : 32}
                  onChange={(event) =>
                    canSubmitSignal
                      ? handleSignalCommandChange(event.target.value)
                      : handleEntryCodeChange(event.target.value)
                  }
                  pattern={canEnterCode ? "[0-9]*" : undefined}
                  placeholder={canSubmitSignal ? "signal" : "----"}
                  ref={entryInputRef}
                  spellCheck={false}
                  value={canSubmitSignal ? signalCommand : entryCode}
                />
                <button
                  aria-label="Submit recovered input"
                  disabled={
                    canEnterCode ? entryCode.length !== 4 : !canSubmitSignal || !signalCommand.trim()
                  }
                  type="submit"
                >
                  Enter
                </button>
              </div>
              {state.entryInteraction.lastInputResponse && (
                <p className="entry-feedback" aria-live="polite">
                  {state.entryInteraction.lastInputResponse}
                </p>
              )}
            </form>
          )}

          {canCommitPath && (
            <div className="apparatus-action">
              <p>computed token accepted</p>
              <button onClick={actions.commitVerificationPath} type="button">
                Commit Path
              </button>
            </div>
          )}

          {canReopenUnverifiedDialog && (
            <div className="apparatus-action apparatus-action--unverified">
              <p>UNVERIFIED surface retained</p>
              <button onClick={actions.openUnverifiedDialog} type="button">
                Reopen
              </button>
            </div>
          )}

          {canIssueReceipt && (
            <div className="apparatus-action apparatus-action--verified">
              <p>route integrity stabilized</p>
              <button onClick={actions.issueReceipt} type="button">
                Issue Receipt
              </button>
            </div>
          )}
        </section>
      )}

      {state.currentStage === "UNVERIFIED" && state.entryInteraction.unverifiedDialogOpen && (
        <UnverifiedModal
          assistAvailable={assistAvailable}
          onAssistUsed={actions.markAssistUsed}
          onClose={actions.closeUnverifiedDialog}
          onSubmitSignal={actions.submitStyleClue}
          routeProfile={state.entryInteraction.routeProfile}
          smallSignals={smallSignals}
        />
      )}
    </main>
  );
}

function getSmallSignals(state: ArgSessionState, nowMs: number): string[] {
  const signals: string[] = [];
  const startedMs = new Date(state.startedAt).getTime();
  const totalElapsedMs = nowMs - startedMs;

  if (state.currentStage === "ENTRY" && totalElapsedMs >= SMALL_SIGNAL_DELAYS_MS.entry) {
    signals.push(SMALL_SIGNALS.entry);
  }

  if (
    state.currentStage === "UNVERIFIED" &&
    state.entryInteraction.lastSubmittedAt &&
    !state.investigationFlags.cssComputedClueFound
  ) {
    const postCodeElapsedMs = nowMs - new Date(state.entryInteraction.lastSubmittedAt).getTime();

    if (postCodeElapsedMs >= SMALL_SIGNAL_DELAYS_MS.postCode) {
      signals.push(SMALL_SIGNALS.postCode);
    }

    if (postCodeElapsedMs >= SMALL_SIGNAL_DELAYS_MS.unverified) {
      signals.push(SMALL_SIGNALS.unverified);
    }
  }

  return signals;
}

function isTotalAssistAvailable(state: ArgSessionState, nowMs: number): boolean {
  if (state.currentStage !== "UNVERIFIED") {
    return false;
  }

  return nowMs - new Date(state.startedAt).getTime() >= SMALL_SIGNAL_DELAYS_MS.totalAssist;
}

function updateDocumentSignal(stage: ArgStage) {
  const titleSuffixByStage: Record<ArgStage, string> = {
    ENTRY: "",
    INPUT_DISCOVERED: " · 0111",
    UNVERIFIED: " · 1101",
    STYLE_CLUE_FOUND: " · 10001",
    VERIFIED: " · 10111",
    RECEIPT_ISSUED: " · LOCAL PROOF",
  };
  const faviconColorByStage: Record<ArgStage, string> = {
    ENTRY: "789f9a",
    INPUT_DISCOVERED: "8fa9a5",
    UNVERIFIED: "a78376",
    STYLE_CLUE_FOUND: "d8ddd8",
    VERIFIED: "9fbfb4",
    RECEIPT_ISSUED: "d8ddd8",
  };

  document.title = `NULLTRACE 4093${titleSuffixByStage[stage]}`;

  const favicon = getOrCreateFavicon();
  const color = faviconColorByStage[stage];
  const stageIndex = ARG_STAGES.indexOf(stage) + 1;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 23 23"><rect width="23" height="23" fill="#030505"/><circle cx="11.5" cy="11.5" r="7" fill="none" stroke="#${color}" stroke-width="1.3"/><path d="M11.5 4.5v${stageIndex + 6}M4.5 11.5h${stageIndex + 6}" stroke="#${color}" stroke-width=".8" opacity=".72"/></svg>`;

  favicon.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function getOrCreateFavicon(): HTMLLinkElement {
  const existing = document.querySelector<HTMLLinkElement>('link[rel="icon"]');

  if (existing) {
    return existing;
  }

  const favicon = document.createElement("link");
  favicon.rel = "icon";
  document.head.append(favicon);
  return favicon;
}

function toBinary(value: number, width: number): string {
  return value.toString(2).padStart(width, "0");
}

function getCurrentTimeMs(): number {
  return Date.now() + getDevTimeOffsetMs();
}

function getDevTimeOffsetMs(): number {
  if (!import.meta.env.DEV) {
    return 0;
  }

  const rawOffset = new URLSearchParams(window.location.search).get("ntTimeOffsetMs");
  const offsetMs = rawOffset ? Number.parseInt(rawOffset, 10) : 0;

  if (!Number.isFinite(offsetMs)) {
    return 0;
  }

  return Math.max(0, Math.min(offsetMs, 24 * 60 * 60 * 1000));
}
