import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowUpRight, CircleDashed, X } from "lucide-react";
import { ASSIST_SIGNALS } from "../domain/argSignals";
import type { AssistLevel, RouteProfile } from "../domain/argTypes";

type UnverifiedModalProps = {
  assistAvailable: boolean;
  assistLevel: AssistLevel;
  onAssistUsed: () => void;
  onClose: () => void;
  onSubmitSignal: (value: string) => void;
  routeProfile: RouteProfile;
  smallSignals: string[];
  signalFeedback?: { id: string; message: string };
};

const INCOMPLETE_EVIDENCE_COPY = [
  "ANSWER ACCEPTED.",
  "EVIDENCE INCOMPLETE.",
  "A CORRECT RESULT",
  "IS NOT THE SAME",
  "AS A VERIFIED RESULT.",
  "THE INTERFACE REMEMBERS",
  "WHAT IT DID NOT SHOW.",
  "STATUS // UNVERIFIED",
];

const NORMAL_PATH_COPY = [
  "VALUE ACCEPTED.",
  "OBSERVATION CONFIRMED.",
  "CONTINUE THE TRACE.",
];

export function UnverifiedModal({
  assistAvailable,
  assistLevel,
  onAssistUsed,
  onClose,
  onSubmitSignal,
  routeProfile,
  smallSignals,
  signalFeedback,
}: UnverifiedModalProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const signalInputRef = useRef("");
  const [signalInput, setSignalInput] = useState("");
  const [assistExpanded, setAssistExpanded] = useState(false);
  const copy =
    routeProfile === "NORMAL_PATH" ? NORMAL_PATH_COPY : INCOMPLETE_EVIDENCE_COPY;
  const echoLevel = Math.min(signalInput.trim().length, 13);
  const visibleAssistSignals = getVisibleAssistSignals(assistLevel);

  function updateSignalInput(value: string) {
    const nextValue = value.slice(0, 32);
    signalInputRef.current = nextValue;
    setSignalInput(nextValue);
  }

  function submitSignal(value: string) {
    onSubmitSignal(value);
  }

  function handleSignalSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitSignal(signalInput);
  }

  function handleAssistUse() {
    setAssistExpanded(true);
    onAssistUsed();
  }

  useEffect(() => {
    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    const backgroundElements = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".apparatus-header, .observation-stage, .apparatus-footer",
      ),
    );
    const previousInert = backgroundElements.map((element) => element.inert);
    backgroundElements.forEach((element) => {
      element.inert = true;
    });
    document.body.style.overflow = "hidden";

    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing)
        return;
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      const target = event.target;
      const isTextInput =
        target instanceof HTMLElement &&
        !!target.closest("input, textarea, select, [contenteditable='true']");

      if (!isTextInput) {
        if (event.key === "Enter" && signalInputRef.current.trim()) {
          event.preventDefault();
          event.stopPropagation();
          submitSignal(signalInputRef.current);
          return;
        }

        if (event.key === "Backspace" && signalInputRef.current) {
          event.preventDefault();
          updateSignalInput(signalInputRef.current.slice(0, -1));
          return;
        }

        if (/^[a-zA-Z ]$/.test(event.key)) {
          event.preventDefault();
          updateSignalInput(`${signalInputRef.current}${event.key}`);
          return;
        }
      }

      if (event.key !== "Tab") {
        return;
      }

      const dialog = dialogRef.current;

      if (!dialog) {
        return;
      }

      const focusableElements = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter(
        (element) =>
          !element.hasAttribute("disabled") &&
          !element.getAttribute("aria-hidden"),
      );

      if (focusableElements.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (!activeElement || !dialog.contains(activeElement)) {
        event.preventDefault();
        firstElement.focus();
        return;
      }

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }

      if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      backgroundElements.forEach((element, index) => {
        element.inert = previousInert[index];
      });
      previouslyFocused?.focus();
    };
  }, [onClose, onSubmitSignal]);

  return (
    <div className="modal-backdrop" role="presentation">
      <section
        aria-describedby="unverified-description"
        aria-labelledby="unverified-title"
        aria-modal="true"
        className="qz7v9"
        data-nulltrace-node="unverified"
        data-route-profile={routeProfile}
        id="unverified-dialog"
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="modal-chrome" aria-hidden="true">
          <span className="status-dot" />
          <span>VERIFICATION RECORD</span>
          <span>01 / 00000001</span>
        </div>
        <button
          aria-label="UNVERIFIED 팝업 닫기"
          className="modal-close"
          onClick={onClose}
          ref={closeButtonRef}
          title="Close"
          type="button"
        >
          <X size={18} strokeWidth={1.5} aria-hidden="true" />
        </button>
        <CircleDashed
          className="modal-seal"
          size={56}
          strokeWidth={0.8}
          aria-hidden="true"
        />
        <p className="eyebrow">CSSOM FIELD INTERRUPT</p>
        <h2 id="unverified-title">UNVERIFIED</h2>
        <div className="modal-copy" id="unverified-description">
          {copy.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
        <dl className="verification-matrix" aria-label="Verification state">
          <div>
            <dt>ANSWER</dt>
            <dd>ACCEPTED</dd>
          </div>
          <div>
            <dt>EVIDENCE</dt>
            <dd>{routeProfile === "NORMAL_PATH" ? "PARTIAL" : "INCOMPLETE"}</dd>
          </div>
          <div>
            <dt>OBSERVATION</dt>
            <dd>{routeProfile === "NORMAL_PATH" ? "CONFIRMED" : "REQUIRED"}</dd>
          </div>
          <div>
            <dt>ROUTE</dt>
            <dd>{routeProfile === "NORMAL_PATH" ? "UNVERIFIED" : "INCOMPLETE_EVIDENCE"}</dd>
          </div>
        </dl>
        <div className="modal-surface" aria-hidden="true" />
        {smallSignals.length > 0 && (
          <aside
            className="small-signal small-signal--modal"
            aria-label="Small signal"
          >
            {smallSignals.map((signal) => (
              <p key={signal}>{signal}</p>
            ))}
          </aside>
        )}
        <p className="signal-feedback" role="status" aria-atomic="true">
          {signalFeedback && (
            <span key={signalFeedback.id}>{signalFeedback.message}</span>
          )}
        </p>
        <form className="modal-signal-entry" onSubmit={handleSignalSubmit}>
          <label className="sr-only" htmlFor="modal-signal-input">
            조사한 신호 입력
          </label>
          <input
            autoComplete="off"
            id="modal-signal-input"
            onChange={(event) => updateSignalInput(event.target.value)}
            spellCheck={false}
            value={signalInput}
          />
          <button
            aria-label="Send signal"
            title="Send signal"
            disabled={!signalInput.trim()}
            type="submit"
          >
            <ArrowUpRight size={21} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </form>
        <div
          className="modal-input-echo"
          aria-hidden="true"
          data-buffered={echoLevel > 0}
        >
          {Array.from({ length: 13 }, (_, index) => (
            <span data-active={index < echoLevel} key={index} />
          ))}
        </div>
        {assistAvailable && (
          <div className="assist-trace">
            <button onClick={handleAssistUse} type="button">
              alternate trace
            </button>
          </div>
        )}
        {(assistExpanded || assistLevel > 0) && visibleAssistSignals.length > 0 && (
          <div className="assist-trace assist-trace--levels" aria-live="polite">
            {visibleAssistSignals.map(({ level, signal }) => (
              <p key={level}>
                <span>assist // {level}</span>
                <span>{signal}</span>
              </p>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function getVisibleAssistSignals(level: AssistLevel) {
  return ([1, 2, 3] as const)
    .filter((signalLevel) => signalLevel <= level)
    .map((signalLevel) => ({
      level: signalLevel,
      signal: ASSIST_SIGNALS[signalLevel],
    }));
}
