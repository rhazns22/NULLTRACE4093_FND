import { useMemo, useState } from "react";
import { Check, Copy, Download, FileJson } from "lucide-react";
import type { StageReceipt, Trace02Receipt as Trace02ReceiptType } from "../../domain/argTypes";

type Trace02ReceiptProps = {
  receipt: Trace02ReceiptType;
  trace01Receipt?: StageReceipt;
};

export function Trace02Receipt({ receipt, trace01Receipt }: Trace02ReceiptProps) {
  const [jsonVisible, setJsonVisible] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
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

  return (
    <section className="trace02-receipt" aria-labelledby="trace02-receipt-title">
      <p className="eyebrow">LOCAL PROOF</p>
      <h2 id="trace02-receipt-title">DOCUMENT // RESTORED</h2>
      <div className="trace02-restored-copy">
        <p>RECORD // PRESERVED</p>
        <p>STATUS // VERIFIED</p>
        <p>THE VIEW FORGOT.</p>
        <p>THE DOCUMENT DID NOT.</p>
        <p>TRACE // 03</p>
        <p>STATUS // NOT YET OBSERVED</p>
      </div>
      <p className="receipt-identifier">{receipt.receiptId}</p>
      <p className="receipt-note">
        Local prototype record. This is not a server signature or cryptographic identity proof.
      </p>

      <dl className="receipt-grid trace02-receipt-grid">
        <div className="hv-tilt-card">
          <dt>Trace</dt>
          <dd>{receipt.trace}</dd>
        </div>
        <div className="hv-tilt-card">
          <dt>Status</dt>
          <dd>{receipt.status}</dd>
        </div>
        <div className="hv-tilt-card">
          <dt>Attempts</dt>
          <dd>{receipt.inputAttempts}</dd>
        </div>
        <div className="hv-tilt-card">
          <dt>Assist Level</dt>
          <dd>{receipt.evidenceSummary.assistLevel}</dd>
        </div>
        <div className="receipt-grid__wide hv-tilt-card">
          <dt>Evidence IDs</dt>
          <dd>{receipt.evidenceSummary.evidenceIds.join(" / ")}</dd>
        </div>
        <div className="receipt-grid__wide hv-tilt-card">
          <dt>Checksum</dt>
          <dd>{receipt.checksum}</dd>
        </div>
      </dl>

      <div className="receipt-actions">
        <button
          aria-controls="trace02-json"
          aria-expanded={jsonVisible}
          onClick={() => setJsonVisible((visible) => !visible)}
          type="button"
        >
          <FileJson size={17} aria-hidden="true" /> {jsonVisible ? "Hide JSON" : "View JSON"}
        </button>
        <button onClick={downloadReceiptJson} type="button">
          <Download size={17} aria-hidden="true" /> Download JSON
        </button>
        <button onClick={copyReceiptJson} type="button">
          {copyStatus === "copied" ? <Check size={17} aria-hidden="true" /> : <Copy size={17} aria-hidden="true" />}
          Copy JSON
        </button>
      </div>

      {copyStatus !== "idle" && (
        <p className="receipt-copy-status" aria-live="polite">
          {copyStatus === "copied" ? "Copied to clipboard." : "Clipboard copy was not available."}
        </p>
      )}

      {jsonVisible && (
        <pre className="receipt-json" id="trace02-json">
          {receiptJson}
        </pre>
      )}

      {trace01Receipt && (
        <details className="trace02-previous-receipt">
          <summary>TRACE 01 RECEIPT // PRESERVED</summary>
          <pre>{JSON.stringify(trace01Receipt, null, 2)}</pre>
        </details>
      )}
    </section>
  );
}
