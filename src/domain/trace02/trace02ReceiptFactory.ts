import type { ArgSessionStateV2, EvidenceSummary, Trace02Receipt, Trace02State } from "../argTypes";
import { createLocalChecksum } from "../receiptFactory";
import { OMITTED_TRACE_02_RECORDS } from "./trace02Records";

type Trace02ReceiptPayload = Omit<Trace02Receipt, "checksum">;

export async function createTrace02Receipt(
  state: ArgSessionStateV2,
  now = new Date(),
): Promise<Trace02Receipt> {
  const trace02 = state.traces.TRACE_02;
  const payload: Trace02ReceiptPayload = {
    receiptId: createTrace02ReceiptId(),
    sessionId: state.sessionId,
    trace: "TRACE_02",
    stage: "DOCUMENT_RESTORED",
    status: "VERIFIED",
    issuedAt: now.toISOString(),
    elapsedSeconds: getElapsedSeconds(trace02.startedAt, now),
    inputAttempts: trace02.attempts,
    assistUsed: trace02.assistLevel > 0,
    evidenceSummary: createTrace02EvidenceSummary(trace02),
    solvePath: trace02.solvePath,
  };

  return {
    ...payload,
    checksum: await createLocalChecksum(payload),
  };
}

function createTrace02EvidenceSummary(trace02: Trace02State): EvidenceSummary {
  const recordIds = OMITTED_TRACE_02_RECORDS.map((record) => record.id);

  return {
    observationCount: 7,
    validationsCompleted: [
      trace02.discoveredRecordIds.length === OMITTED_TRACE_02_RECORDS.length,
      trace02.currentStage === "VERIFIED" || trace02.currentStage === "RECEIPT_ISSUED",
    ].filter(Boolean).length,
    assistLevel: trace02.assistLevel,
    blindAttemptCount: trace02.attempts,
    evidenceIds: [
      "TRACE_02_DOCUMENT_GAP",
      ...recordIds,
      "TRACE_02_RESTORED_COMMAND",
      ...(trace02.assistLevel > 0 ? [`SMALL_SIGNAL_LEVEL_${trace02.assistLevel}`] : []),
    ],
  };
}

function createTrace02ReceiptId(): string {
  return `NT-02-${crypto.randomUUID().toUpperCase()}`;
}

function getElapsedSeconds(startedAt: string | null, now: Date): number {
  if (!startedAt) {
    return 0;
  }

  const elapsedMs = Math.max(0, now.getTime() - new Date(startedAt).getTime());
  return Number((elapsedMs / 1000).toFixed(3));
}
