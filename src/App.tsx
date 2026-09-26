import { FormEvent, useEffect, useRef, useState } from "react";
import {
  Aperture,
  ArrowRight,
  CornerDownLeft,
  Fingerprint,
  ScanLine,
} from "lucide-react";
import { BinaryField } from "./components/BinaryField";
import { ObservationGlyph } from "./components/ObservationGlyph";
import { ReceiptCard } from "./components/ReceiptCard";
import { UnverifiedModal } from "./components/UnverifiedModal";
import { SMALL_SIGNAL_DELAYS_MS, SMALL_SIGNALS } from "./domain/argSignals";
import {
  ARG_STAGES,
  type ArgSessionState,
  type ArgStage,
} from "./domain/argTypes";
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
  const issueReceiptRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const intervalId = window.setInterval(
      () => setNowMs(getCurrentTimeMs()),
      TICK_INTERVAL_MS,
    );
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!state || state.currentStage !== "ENTRY") {
      return;
    }

    function handleNumericDiscovery(event: KeyboardEvent) {
      if (
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.key.length !== 1
      ) {
        return;
      }

      if (!/^\d$/.test(event.key)) {
        return;
      }

      const target = event.target;

      if (
        target instanceof HTMLElement &&
        target.closest("input, textarea, select")
      ) {
        return;
      }

      event.preventDefault();
      setEntryCode((current) =>
        current.length < 4 ? `${current}${event.key}` : current,
      );
      actions.inspectEntrySignal("numeric_key");
    }

    window.addEventListener("keydown", handleNumericDiscovery);
    return () => window.removeEventListener("keydown", handleNumericDiscovery);
  }, [actions, state]);

  useEffect(() => {
    if (state?.currentStage === "INPUT_DISCOVERED") {
      entryInputRef.current?.focus();
    } else if (state?.currentStage === "VERIFIED") {
      issueReceiptRef.current?.focus();
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
    state.currentStage === "UNVERIFIED" &&
    !state.entryInteraction.unverifiedDialogOpen;
  const canCommitPath = state.currentStage === "STYLE_CLUE_FOUND";
  const canIssueReceipt = state.currentStage === "VERIFIED";
  const inputChannelVisible = state.currentStage !== "ENTRY";
  const shouldShowReceipt =
    route === "receipt" || state.currentStage === "RECEIPT_ISSUED";
  const smallSignals = getSmallSignals(state, nowMs);
  const assistAvailable = isTotalAssistAvailable(state, nowMs);
  const stageOrdinal = ARG_STAGES.indexOf(state.currentStage) + 1;
  const lastEvent = state.solvePath[state.solvePath.length - 1];
  const signalFeedback =
    canSubmitSignal && lastEvent?.action === "computed style clue rejected"
      ? {
          id: lastEvent.at,
          message: "Signal received. Verification unchanged.",
        }
      : undefined;

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
    <main
      className="app-shell observation-shell"
      data-stage={state.currentStage}
    >
      <BinaryField />
      <header className="apparatus-header">
        <p className="project-mark">
          <Aperture size={20} strokeWidth={1.25} aria-hidden="true" /> NULLTRACE{" "}
          <span>OBSERVATION ARCHIVE</span>
        </p>
        <p className="session-mark">
          <span className="status-dot" /> LOCAL SESSION{" "}
          <span>{state.sessionId.slice(0, 8)}</span>
        </p>
      </header>

      {shouldShowReceipt ? (
        <section className="receipt-view">
          {state.receipt ? (
            <ReceiptCard
              onNewSession={actions.resetSession}
              receipt={state.receipt}
            />
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
          <div className="observation-heading">
            <div>
              <p className="eyebrow">THE UNIDENTIFIED REMAINS.</p>
              <h1 id="project-title" aria-label="NULLTRACE 4093">
                NULLTRACE<span>4093</span>
              </h1>
            </div>
            <div className="record-index">
              <span>OBSERVATION</span>
              <strong>
                01<span> / 00000001</span>
              </strong>
            </div>
          </div>

          <div className="observation-field">
            <div className="field-scan" aria-hidden="true" />
            <div className="field-registration" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </div>
            <div
              className="field-caption field-caption--left"
              aria-hidden="true"
            >
              <span className="field-cross">+</span>
              <span>
                ORIGIN
                <br />
                <strong>UNKNOWN</strong>
              </span>
            </div>
            <div
              className="field-caption field-caption--right"
              aria-hidden="true"
            >
              <span>SIGNAL / RETAINED</span>
              <span className="field-cross">+</span>
            </div>

            <ObservationGlyph
              clickCount={glyphClickCount}
              clickThreshold={GLYPH_CLICK_THRESHOLD}
              currentStage={state.currentStage}
              onGlyphClick={revealInputFromGlyphClick}
              onKeyboardReveal={revealInputFromFocusedGlyph}
            />
            <div
              className="field-coordinate field-coordinate--left"
              aria-hidden="true"
            >
              NT / FIELD RECORD
            </div>
            <div
              className="field-coordinate field-coordinate--right"
              aria-hidden="true"
            >
              {state.startedAt.slice(0, 10).replace(/-/g, ".")}
            </div>
          </div>

          <div className="apparatus-readout" aria-label="Observation state">
            <div className="readout-primary">
              <span className="readout-label">STATUS</span>
              <span className="readout-value" key={state.currentStage}>
                <span className="status-dot" />
                {state.currentStage}
              </span>
            </div>
            <div>
              <span className="readout-label">STAGE</span>
              <span className="readout-value">
                {String(stageOrdinal).padStart(2, "0")}
                <small> / {toBinary(stageOrdinal, 4)}</small>
              </span>
            </div>
            <div>
              <span className="readout-label">ATTEMPTS</span>
              <span className="readout-value">
                {String(state.inputAttempts).padStart(2, "0")}
                <small> / {toBinary(state.inputAttempts, 5)}</small>
              </span>
            </div>
            <div className="readout-route">
              <span className="readout-label">TRACE</span>
              <span className="readout-value">
                {state.entryInteraction.routeProfile}
              </span>
            </div>
          </div>

          {smallSignals.length > 0 &&
            !state.entryInteraction.unverifiedDialogOpen && (
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
              <label htmlFor="entry-code">
                <ScanLine size={14} aria-hidden="true" /> INPUT CHANNEL{" "}
                <span>
                  {canEnterCode || canSubmitSignal ? "OPEN" : "SEALED"}
                </span>
              </label>
              <p
                className="entry-feedback"
                aria-live="polite"
                aria-atomic="true"
              >
                <span key={signalFeedback?.id ?? state.inputAttempts}>
                  {canEnterCode
                    ? state.entryInteraction.lastInputResponse
                    : signalFeedback?.message}
                </span>
              </p>
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
                    canEnterCode
                      ? entryCode.length !== 4
                      : !canSubmitSignal || !signalCommand.trim()
                  }
                  type="submit"
                >
                  <CornerDownLeft
                    size={20}
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                </button>
              </div>
              {canEnterCode && (
                <div className="entry-channel__meter" aria-hidden="true">
                  {Array.from({ length: 4 }, (_, index) => (
                    <span key={index} data-filled={index < entryCode.length} />
                  ))}
                </div>
              )}
            </form>
          )}

          {canCommitPath && (
            <div className="apparatus-action">
              <p>computed token accepted</p>
              <button onClick={actions.commitVerificationPath} type="button">
                Commit Path <ArrowRight size={16} aria-hidden="true" />
              </button>
            </div>
          )}

          {canReopenUnverifiedDialog && (
            <div className="apparatus-action apparatus-action--unverified">
              <p>UNVERIFIED surface retained</p>
              <button onClick={actions.openUnverifiedDialog} type="button">
                Reopen <ArrowRight size={16} aria-hidden="true" />
              </button>
            </div>
          )}

          {canIssueReceipt && (
            <div className="apparatus-action apparatus-action--verified">
              <p>route integrity stabilized</p>
              <button
                onClick={actions.issueReceipt}
                ref={issueReceiptRef}
                type="button"
              >
                Issue Receipt <ArrowRight size={16} aria-hidden="true" />
              </button>
            </div>
          )}
        </section>
      )}

      <footer className="apparatus-footer">
        <span>
          <Fingerprint size={15} strokeWidth={1.25} aria-hidden="true" />{" "}
          ANONYMOUS OBSERVATION
        </span>
        <span className="footer-rule" aria-hidden="true" />
        <span>NOT EVERYTHING LEAVES A TRACE.</span>
        <span className="footer-edition">NT / 01</span>
      </footer>

      {state.currentStage === "UNVERIFIED" &&
        state.entryInteraction.unverifiedDialogOpen && (
          <UnverifiedModal
            assistAvailable={assistAvailable}
            onAssistUsed={actions.markAssistUsed}
            onClose={actions.closeUnverifiedDialog}
            onSubmitSignal={actions.submitStyleClue}
            routeProfile={state.entryInteraction.routeProfile}
            smallSignals={smallSignals}
            signalFeedback={signalFeedback}
          />
        )}
    </main>
  );
}

function getSmallSignals(state: ArgSessionState, nowMs: number): string[] {
  const signals: string[] = [];
  const startedMs = new Date(state.startedAt).getTime();
  const totalElapsedMs = nowMs - startedMs;

  if (
    state.currentStage === "ENTRY" &&
    totalElapsedMs >= SMALL_SIGNAL_DELAYS_MS.entry
  ) {
    signals.push(SMALL_SIGNALS.entry);
  }

  if (
    state.currentStage === "UNVERIFIED" &&
    state.entryInteraction.lastSubmittedAt &&
    !state.investigationFlags.cssComputedClueFound
  ) {
    const postCodeElapsedMs =
      nowMs - new Date(state.entryInteraction.lastSubmittedAt).getTime();

    if (postCodeElapsedMs >= SMALL_SIGNAL_DELAYS_MS.postCode) {
      signals.push(SMALL_SIGNALS.postCode);
    }

    if (postCodeElapsedMs >= SMALL_SIGNAL_DELAYS_MS.unverified) {
      signals.push(SMALL_SIGNALS.unverified);
    }
  }

  return signals;
}

function isTotalAssistAvailable(
  state: ArgSessionState,
  nowMs: number,
): boolean {
  if (state.currentStage !== "UNVERIFIED") {
    return false;
  }

  return (
    nowMs - new Date(state.startedAt).getTime() >=
    SMALL_SIGNAL_DELAYS_MS.totalAssist
  );
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

  const rawOffset = new URLSearchParams(window.location.search).get(
    "ntTimeOffsetMs",
  );
  const offsetMs = rawOffset ? Number.parseInt(rawOffset, 10) : 0;

  if (!Number.isFinite(offsetMs)) {
    return 0;
  }

  return Math.max(0, Math.min(offsetMs, 24 * 60 * 60 * 1000));
}
