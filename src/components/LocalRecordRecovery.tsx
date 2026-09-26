import { useState } from "react";
import type { LocalRecordRecovery as LocalRecordRecoveryData } from "../storage/localStorageArgRepository";

type LocalRecordRecoveryProps = {
  onStartNewSession: () => Promise<void>;
  recovery: LocalRecordRecoveryData;
};

export function LocalRecordRecovery({ onStartNewSession, recovery }: LocalRecordRecoveryProps) {
  const [confirming, setConfirming] = useState(false);

  function downloadUnreadableRecord() {
    const blob = new Blob([recovery.raw], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${recovery.key}.unreadable.json`;
    link.style.display = "none";
    document.body.append(link);
    link.click();
    window.setTimeout(() => {
      link.remove();
      URL.revokeObjectURL(url);
    }, 0);
  }

  return (
    <main className="app-shell local-record-recovery">
      <section aria-labelledby="local-record-recovery-title">
        <p className="eyebrow">LOCAL RECORD // UNREADABLE</p>
        <h1 id="local-record-recovery-title">AUTOMATIC RECOVERY // UNAVAILABLE</h1>
        <p>
          THE RECORD STILL EXISTS.
          <br />
          THE SYSTEM WILL NOT OVERWRITE IT
          <br />
          WITHOUT CONFIRMATION.
        </p>
        <dl>
          <div>
            <dt>Storage key</dt>
            <dd>{recovery.key}</dd>
          </div>
          <div>
            <dt>Reason</dt>
            <dd>{recovery.reason}</dd>
          </div>
        </dl>
        <div className="local-record-recovery__actions">
          <button onClick={downloadUnreadableRecord} type="button">
            Download Unreadable JSON
          </button>
          <button onClick={() => setConfirming(true)} type="button">
            Start New Session
          </button>
        </div>
        {confirming && (
          <section
            aria-label="Confirm new session after unreadable local record"
            className="receipt-confirm"
          >
            <p>
              Start a new local session? The unreadable source will not be used
              again, but the original v1 record is not deleted automatically.
            </p>
            <div>
              <button onClick={onStartNewSession} type="button">
                Confirm New Session
              </button>
              <button onClick={() => setConfirming(false)} type="button">
                Cancel
              </button>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
