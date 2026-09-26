import { useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { navigateTo } from "../../router/useHashRoute";
import { useTrace02Session } from "../../hooks/useTrace02Session";
import { ObservationArchive } from "./ObservationArchive";
import { Trace02Assist } from "./Trace02Assist";
import { Trace02Receipt } from "./Trace02Receipt";
import { Trace02Verification } from "./Trace02Verification";

export function Trace02Screen() {
  const { actions, isLoading, previousEvidenceValid, state } = useTrace02Session();
  const trace02 = state?.traces.TRACE_02;
  const trace02Receipt = state?.receipts.TRACE_02;
  const trace01Receipt = state?.receipts.TRACE_01 ?? state?.traces.TRACE_01.receipt ?? undefined;

  useEffect(() => {
    if (state && previousEvidenceValid && state.traces.TRACE_02.currentStage === "LOCKED") {
      actions.startTrace();
    }
  }, [actions, previousEvidenceValid, state]);

  if (isLoading || !state || !trace02) {
    return (
      <main className="app-shell app-shell--loading">
        <p>TRACE 02 loading...</p>
      </main>
    );
  }

  if (!previousEvidenceValid) {
    return (
      <main className="app-shell trace02-shell trace02-shell--locked">
        <section className="trace02-locked" aria-labelledby="trace02-locked-title">
          <p className="eyebrow">TRACE // 02</p>
          <h1 id="trace02-locked-title">STATUS // PREVIOUS EVIDENCE REQUIRED</h1>
          <p>
            NO RECORD CAN BE RESTORED
            <br />
            WITHOUT ITS PREVIOUS RECEIPT.
          </p>
          <button onClick={() => navigateTo("console")} type="button">
            Return to Trace 01 <ArrowRight size={16} aria-hidden="true" />
          </button>
        </section>
      </main>
    );
  }

  if (trace02Receipt) {
    return (
      <main className="app-shell trace02-shell">
        <Trace02Receipt receipt={trace02Receipt} trace01Receipt={trace01Receipt} />
      </main>
    );
  }

  return (
    <main className="app-shell trace02-shell" data-stage={trace02.currentStage}>
      <header className="apparatus-header">
        <p className="project-mark">NULLTRACE <span>DOCUMENT ARCHIVE</span></p>
        <p className="session-mark">
          <span className="status-dot" /> LOCAL SESSION <span>{state.sessionId.slice(0, 8)}</span>
        </p>
      </header>

      <section className="trace02-hero" aria-labelledby="trace02-title">
        <p className="eyebrow">TRACE // 02</p>
        <h1 id="trace02-title">RECORD // PARTIAL</h1>
        <p>
          THE VIEW REPORTS
          <br />
          ONLY WHAT IT WAS TOLD TO PAINT.
        </p>
      </section>

      <ObservationArchive />

      {trace02.restoredAt && (
        <aside className="trace02-restore-echo" aria-label="Restored omitted record positions">
          <span>02</span>
          <span>03</span>
          <span>05</span>
          <span>07</span>
        </aside>
      )}

      {trace02.currentStage !== "VERIFIED" ? (
        <>
          <Trace02Verification
            onSubmitCommand={actions.submitCommand}
            onSubmitEvidence={actions.submitEvidence}
            trace02={trace02}
          />
          <Trace02Assist assistLevel={trace02.assistLevel} onAssist={actions.requestAssist} />
        </>
      ) : (
        <section className="apparatus-action apparatus-action--verified">
          <p>DOCUMENT ORDER RESTORED</p>
          <button onClick={actions.issueReceipt} type="button">
            Issue Trace 02 Receipt <ArrowRight size={16} aria-hidden="true" />
          </button>
        </section>
      )}
    </main>
  );
}
