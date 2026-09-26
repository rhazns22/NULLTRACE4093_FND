import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  Check,
  Copy,
  Download,
  FileJson,
  Plus,
  Printer,
  ShieldCheck,
} from "lucide-react";
import type { StageReceipt } from "../domain/argTypes";
import { RevealItem } from "./RevealItem";

type ReceiptCardProps = {
  onNewSession: () => Promise<void>;
  receipt: StageReceipt;
};

export function ReceiptCard({ onNewSession, receipt }: ReceiptCardProps) {
  const [jsonVisible, setJsonVisible] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">(
    "idle",
  );
  const [confirmNewSession, setConfirmNewSession] = useState(false);
  const receiptRef = useRef<HTMLElement>(null);
  const newSessionRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    receiptRef.current?.focus({ preventScroll: true });
  }, [receipt.receiptId]);

  useEffect(() => {
    if (confirmNewSession) cancelRef.current?.focus();
  }, [confirmNewSession]);

  function cancelNewSession() {
    setConfirmNewSession(false);
    newSessionRef.current?.focus();
  }
  const evidenceSummary = getReceiptEvidenceSummary(receipt);
  const receiptJson = useMemo(
    () => JSON.stringify(receipt, null, 2),
    [receipt],
  );

  async function copyReceiptJson() {
    try {
      await navigator.clipboard.writeText(receiptJson);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
  }

  function downloadReceiptJson() {
    const blob = new Blob([receiptJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${receipt.receiptId}.json`;
    link.style.display = "none";
    document.body.append(link);
    link.click();
    window.setTimeout(() => {
      link.remove();
      URL.revokeObjectURL(url);
    }, 0);
  }

  async function confirmStartNewSession() {
    await onNewSession();
    setConfirmNewSession(false);
  }

  return (
    <article
      className="receipt-card"
      ref={receiptRef}
      tabIndex={-1}
      aria-labelledby="receipt-title"
    >
      <header className="receipt-card__header">
        <div className="receipt-kicker">
          <p className="eyebrow">NULLTRACE / OBSERVATION ARCHIVE</p>
          <span>01 / 00000001</span>
        </div>
        <div className="receipt-title-row">
          <div>
            <p className="eyebrow">LOCAL PROOF</p>
            <h2 id="receipt-title">
              Stage Receipt<span>Observation verified.</span>
            </h2>
          </div>
          <ShieldCheck size={54} strokeWidth={1} aria-hidden="true" />
        </div>
        <p className="receipt-identifier">{receipt.receiptId}</p>
        <p className="receipt-note">
          Local prototype record. This is not a server signature or
          cryptographic identity proof.
        </p>
      </header>

      <dl className="receipt-grid">
        <div className="hv-tilt-card">
          <dt>Session</dt>
          <dd>{receipt.sessionId}</dd>
        </div>
        <div className="hv-tilt-card">
          <dt>Stage</dt>
          <dd>
            {receipt.stage} / {toBinary(receipt.stage, 8)}
          </dd>
        </div>
        <div className="hv-tilt-card">
          <dt>Status</dt>
          <dd>{receipt.status}</dd>
        </div>
        <div className="hv-tilt-card">
          <dt>Issued</dt>
          <dd>{formatDate(receipt.issuedAt)}</dd>
        </div>
        <div className="hv-tilt-card">
          <dt>Elapsed</dt>
          <dd>{receipt.elapsedSeconds.toFixed(3)}s</dd>
        </div>
        <div className="hv-tilt-card">
          <dt>Attempts</dt>
          <dd>{receipt.inputAttempts}</dd>
        </div>
        <div className="hv-tilt-card">
          <dt>Assist Used</dt>
          <dd>{receipt.assistUsed ? "yes" : "no"}</dd>
        </div>
        <div className="hv-tilt-card">
          <dt>Assist Level</dt>
          <dd>{evidenceSummary?.assistLevel ?? (receipt.assistUsed ? 1 : 0)}</dd>
        </div>
        <div className="hv-tilt-card">
          <dt>Evidence</dt>
          <dd>{formatEvidence(receipt)}</dd>
        </div>
        {evidenceSummary && (
          <div className="receipt-grid__wide hv-tilt-card">
            <dt>Evidence Summary</dt>
            <dd>{formatEvidenceSummary(evidenceSummary)}</dd>
          </div>
        )}
        <div className="receipt-grid__wide hv-tilt-card">
          <dt>Checksum</dt>
          <dd>{receipt.checksum}</dd>
        </div>
      </dl>

      <details className="receipt-path">
        <summary>
          SOLVE PATH{" "}
          <span>
            {String(receipt.solvePath.length).padStart(2, "0")} RECORDS{" "}
            <Plus size={15} aria-hidden="true" />
          </span>
        </summary>
        <ol>
          {receipt.solvePath.map((entry, index) => (
            <RevealItem
              as="li"
              delayMs={index * 60}
              key={`${entry.at}-${entry.action}`}
            >
              <span>{entry.stage}</span>
              <strong>{entry.action}</strong>
              {entry.detail && <small>{entry.detail}</small>}
            </RevealItem>
          ))}
        </ol>
      </details>

      <div className="receipt-validation" aria-hidden="true">
        <div className="receipt-fingerprint">
          {Array.from(receipt.checksum).map((digit, index) => (
            <i
              key={index}
              style={{
                height: `${8 + parseInt(digit, 16) * 1.5}px`,
                animationDelay: `${460 + index * 7}ms`,
              }}
            />
          ))}
        </div>
        <span>SHA-256 / LOCAL RECORD</span>
        <Check size={20} />
      </div>

      <div className="receipt-actions">
        <button
          aria-label="Print"
          title="Print"
          onClick={() => window.print()}
          type="button"
        >
          <Printer size={17} aria-hidden="true" />
        </button>
        <button
          aria-label={jsonVisible ? "Hide JSON" : "View JSON"}
          title={jsonVisible ? "Hide JSON" : "View JSON"}
          aria-expanded={jsonVisible}
          aria-controls="receipt-json"
          onClick={() => setJsonVisible((visible) => !visible)}
          type="button"
        >
          <FileJson size={17} aria-hidden="true" />
        </button>
        <button onClick={downloadReceiptJson} type="button">
          <Download size={17} aria-hidden="true" /> Download JSON
        </button>
        <button
          aria-label="Copy JSON"
          title="Copy JSON"
          onClick={copyReceiptJson}
          type="button"
        >
          {copyStatus === "copied" ? (
            <Check size={17} aria-hidden="true" />
          ) : (
            <Copy size={17} aria-hidden="true" />
          )}
        </button>
        <button
          onClick={() => setConfirmNewSession(true)}
          ref={newSessionRef}
          type="button"
        >
          New Session <ArrowUpRight size={16} aria-hidden="true" />
        </button>
      </div>

      {copyStatus !== "idle" && (
        <p className="receipt-copy-status" aria-live="polite">
          {copyStatus === "copied"
            ? "Copied to clipboard."
            : "Clipboard copy was not available."}
        </p>
      )}

      {jsonVisible && (
        <pre className="receipt-json" id="receipt-json">
          {receiptJson}
        </pre>
      )}

      {confirmNewSession && (
        <section
          className="receipt-confirm"
          aria-label="Confirm new session"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              cancelNewSession();
            }
          }}
        >
          <p>
            Start a new local session? The current receipt remains visible only
            if this JSON is kept elsewhere.
          </p>
          <div>
            <button onClick={confirmStartNewSession} type="button">
              Confirm New Session
            </button>
            <button onClick={cancelNewSession} ref={cancelRef} type="button">
              Cancel
            </button>
          </div>
        </section>
      )}
    </article>
  );
}

function toBinary(value: number, width: number): string {
  return value.toString(2).padStart(width, "0");
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(value));
}

function formatEvidence(receipt: StageReceipt): string {
  const evidence = receipt.evidence ?? {
    glyphInvestigated: false,
    inputDiscoveryMethod: null,
    unverifiedDialogViewed: false,
    cssClueSolved: false,
  };

  return [
    `glyph:${evidence.glyphInvestigated ? "yes" : "no"}`,
    `input:${evidence.inputDiscoveryMethod ?? "none"}`,
    `dialog:${evidence.unverifiedDialogViewed ? "yes" : "no"}`,
    `css:${evidence.cssClueSolved ? "yes" : "no"}`,
  ].join(" / ");
}

function formatEvidenceSummary(summary: NonNullable<StageReceipt["evidenceSummary"]>): string {
  return [
    `observations:${summary.observationCount}`,
    `validations:${summary.validationsCompleted}`,
    `assist:${summary.assistLevel}`,
    `blind:${summary.blindAttemptCount}`,
    `ids:${summary.evidenceIds.join(",") || "none"}`,
  ].join(" / ");
}

function getReceiptEvidenceSummary(receipt: StageReceipt): StageReceipt["evidenceSummary"] {
  if (!receipt.evidenceSummary) {
    return undefined;
  }

  return {
    observationCount: Number.isFinite(receipt.evidenceSummary.observationCount)
      ? receipt.evidenceSummary.observationCount
      : 0,
    validationsCompleted: Number.isFinite(receipt.evidenceSummary.validationsCompleted)
      ? receipt.evidenceSummary.validationsCompleted
      : 0,
    assistLevel: receipt.evidenceSummary.assistLevel ?? (receipt.assistUsed ? 1 : 0),
    blindAttemptCount: Number.isFinite(receipt.evidenceSummary.blindAttemptCount)
      ? receipt.evidenceSummary.blindAttemptCount
      : 0,
    evidenceIds: Array.isArray(receipt.evidenceSummary.evidenceIds)
      ? receipt.evidenceSummary.evidenceIds
      : [],
  };
}
