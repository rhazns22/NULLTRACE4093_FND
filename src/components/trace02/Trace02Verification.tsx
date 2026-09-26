import { FormEvent, useState } from "react";
import { CornerDownLeft } from "lucide-react";
import type { Trace02State } from "../../domain/argTypes";

type Trace02VerificationProps = {
  onSubmitCommand: (value: string) => void;
  onSubmitEvidence: (value: string) => void;
  trace02: Trace02State;
};

export function Trace02Verification({
  onSubmitCommand,
  onSubmitEvidence,
  trace02,
}: Trace02VerificationProps) {
  const [evidenceValue, setEvidenceValue] = useState(trace02.discoveredRecordIds.join(" "));
  const [commandValue, setCommandValue] = useState("");
  const evidenceAccepted = trace02.discoveredRecordIds.length === 4;

  function handleEvidenceSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmitEvidence(evidenceValue);
  }

  function handleCommandSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmitCommand(commandValue);
  }

  return (
    <section className="trace02-verification" aria-labelledby="trace02-verify-title">
      <div className="trace02-verification__heading">
        <p className="eyebrow">RECORD EVIDENCE // 4 REQUIRED</p>
        <h2 id="trace02-verify-title">Restore document order</h2>
        <p>
          COMMAND FORMAT // 4 WORDS
          <br />
          CASE // INSENSITIVE
          <br />
          SEPARATOR // SPACE
        </p>
      </div>

      <form onSubmit={handleEvidenceSubmit}>
        <label htmlFor="trace02-evidence">Omitted record IDs</label>
        <div className="trace02-input-row">
          <input
            autoComplete="off"
            id="trace02-evidence"
            onChange={(event) => setEvidenceValue(event.target.value)}
            placeholder="NT-02-R02 NT-02-R03 NT-02-R05 NT-02-R07"
            spellCheck={false}
            value={evidenceValue}
          />
          <button aria-label="Submit record evidence" type="submit">
            <CornerDownLeft size={19} aria-hidden="true" />
          </button>
        </div>
      </form>

      <form onSubmit={handleCommandSubmit}>
        <label htmlFor="trace02-command">Restored command</label>
        <div className="trace02-input-row">
          <input
            autoComplete="off"
            disabled={!evidenceAccepted}
            id="trace02-command"
            onChange={(event) => setCommandValue(event.target.value)}
            placeholder={evidenceAccepted ? "4 words" : "record evidence required"}
            spellCheck={false}
            value={commandValue}
          />
          <button
            aria-label="Submit restored command"
            disabled={!evidenceAccepted || !commandValue.trim()}
            type="submit"
          >
            <CornerDownLeft size={19} aria-hidden="true" />
          </button>
        </div>
      </form>

      <p className="trace02-feedback" aria-live="polite" aria-atomic="true">
        {trace02.lastError ??
          (evidenceAccepted
            ? "RECORD EVIDENCE ACCEPTED. DOCUMENT ORDER AVAILABLE."
            : "DISPLAYED ORDER IS NOT DOCUMENT ORDER.")}
      </p>
    </section>
  );
}
