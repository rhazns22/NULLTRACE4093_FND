import { useMemo, useState } from "react";
import type { StageReceipt } from "../domain/argTypes";
import { RevealItem } from "./RevealItem";

type ReceiptCardProps = {
  onNewSession: () => Promise<void>;
  receipt: StageReceipt;
};

export function ReceiptCard({ onNewSession, receipt }: ReceiptCardProps) {
  const [jsonVisible, setJsonVisible] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [confirmNewSession, setConfirmNewSession] = useState(false);
  const receiptJson = useMemo(() => JSON.stringify(receipt, null, 2), [receipt]);

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
    <article className="receipt-card">
      <header className="receipt-card__header">
        <p className="eyebrow">LOCAL PROOF</p>
        <h2>{receipt.receiptId}</h2>
        <p className="receipt-note">
          Local prototype record. This is not a server signature or cryptographic identity proof.
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
          <dt>Evidence</dt>
          <dd>{formatEvidence(receipt)}</dd>
        </div>
        <div className="receipt-grid__wide hv-tilt-card">
          <dt>Checksum</dt>
          <dd>{receipt.checksum}</dd>
        </div>
      </dl>

      <section className="receipt-path" aria-label="Solve path">
        <p className="eyebrow">SOLVE PATH</p>
        <ol>
          {receipt.solvePath.map((entry, index) => (
            <RevealItem as="li" delayMs={index * 60} key={`${entry.at}-${entry.action}`}>
              <span>{entry.stage}</span>
              <strong>{entry.action}</strong>
              {entry.detail && <small>{entry.detail}</small>}
            </RevealItem>
          ))}
        </ol>
      </section>

      <div className="receipt-actions">
        <button onClick={() => window.print()} type="button">
          Print
        </button>
        <button onClick={() => setJsonVisible((visible) => !visible)} type="button">
          {jsonVisible ? "Hide JSON" : "View JSON"}
        </button>
        <button onClick={downloadReceiptJson} type="button">
          Download JSON
        </button>
        <button onClick={copyReceiptJson} type="button">
          Copy JSON
        </button>
        <button onClick={() => setConfirmNewSession(true)} type="button">
          New Session
        </button>
      </div>

      {copyStatus !== "idle" && (
        <p className="receipt-copy-status" aria-live="polite">
          {copyStatus === "copied" ? "Copied to clipboard." : "Clipboard copy was not available."}
        </p>
      )}

      {jsonVisible && <pre className="receipt-json">{receiptJson}</pre>}

      {confirmNewSession && (
        <section className="receipt-confirm" aria-label="Confirm new session">
          <p>Start a new local session? The current receipt remains visible only if this JSON is kept elsewhere.</p>
          <div>
            <button onClick={confirmStartNewSession} type="button">
              Confirm New Session
            </button>
            <button onClick={() => setConfirmNewSession(false)} type="button">
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
  const evidence = receipt.evidence;

  return [
    `glyph:${evidence.glyphInvestigated ? "yes" : "no"}`,
    `input:${evidence.inputDiscoveryMethod ?? "none"}`,
    `dialog:${evidence.unverifiedDialogViewed ? "yes" : "no"}`,
    `css:${evidence.cssClueSolved ? "yes" : "no"}`,
  ].join(" / ");
}
