import { FormEvent, useEffect, useRef, useState } from "react";
import { ACCESSIBLE_SIGNAL_GROUPS } from "../domain/argSignals";
import type { RouteProfile } from "../domain/argTypes";

type UnverifiedModalProps = {
  assistAvailable: boolean;
  onAssistUsed: () => void;
  onClose: () => void;
  onSubmitSignal: (value: string) => void;
  routeProfile: RouteProfile;
  smallSignals: string[];
};

const FAST_PATH_COPY = [
  "앗, 정답을 빨리 맞췄군요.",
  "하지만 우리가 원하는 문제 풀이가 아닌 것 같아요.",
  "조금 더 주의 깊게 살펴보세요.",
];

const NORMAL_PATH_COPY = [
  "숫자는 일치합니다.",
  "그러나 숫자만으로는 검증할 수 없습니다.",
  "하지만 우리가 원하는 문제 풀이가 아닌 것 같아요.",
  "조금 더 주의 깊게 살펴보세요.",
];

export function UnverifiedModal({
  assistAvailable,
  onAssistUsed,
  onClose,
  onSubmitSignal,
  routeProfile,
  smallSignals,
}: UnverifiedModalProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const signalInputRef = useRef("");
  const [signalInput, setSignalInput] = useState("");
  const [assistExpanded, setAssistExpanded] = useState(false);
  const copy = routeProfile === "NORMAL_PATH" ? NORMAL_PATH_COPY : FAST_PATH_COPY;
  const echoLevel = Math.min(signalInput.trim().length, 13);

  function updateSignalInput(value: string) {
    const nextValue = value.slice(0, 32);
    signalInputRef.current = nextValue;
    setSignalInput(nextValue);
  }

  function submitSignal(value: string) {
    onSubmitSignal(value);
    updateSignalInput("");
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
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      const target = event.target;
      const isTextInput =
        target instanceof HTMLElement && !!target.closest("input, textarea, select, [contenteditable='true']");

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
      ).filter((element) => !element.hasAttribute("disabled") && !element.getAttribute("aria-hidden"));

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
          <span />
          <span />
          <span />
        </div>
        <button
          aria-label="UNVERIFIED 팝업 닫기"
          className="modal-close"
          onClick={onClose}
          ref={closeButtonRef}
          type="button"
        >
          Close
        </button>
        <p className="eyebrow">CSSOM FIELD INTERRUPT</p>
        <h2 id="unverified-title">UNVERIFIED</h2>
        <div className="modal-copy" id="unverified-description">
          {copy.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
        <div className="modal-surface" aria-hidden="true" />
        {smallSignals.length > 0 && (
          <aside className="small-signal small-signal--modal" aria-label="Small signal">
            {smallSignals.map((signal) => (
              <p key={signal}>{signal}</p>
            ))}
          </aside>
        )}
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
          <button disabled={!signalInput.trim()} type="submit">
            Send
          </button>
        </form>
        <div className="modal-input-echo" aria-hidden="true" data-buffered={echoLevel > 0}>
          {Array.from({ length: 13 }, (_, index) => (
            <span data-active={index < echoLevel} key={index} />
          ))}
        </div>
        {assistAvailable && (
          <div className="assist-trace">
            <button onClick={handleAssistUse} type="button">
              alternate trace
            </button>
            {assistExpanded && (
              <p aria-live="polite">
                {ACCESSIBLE_SIGNAL_GROUPS.map((group) => (
                  <span key={group}>{group}</span>
                ))}
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
