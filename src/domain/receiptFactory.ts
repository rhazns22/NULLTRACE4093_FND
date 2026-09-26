import type { ArgSessionState, EvidenceSummary, StageReceipt } from "./argTypes";

type ReceiptPayload = Omit<StageReceipt, "checksum">;

export async function createStageReceipt(state: ArgSessionState, now = new Date()): Promise<StageReceipt> {
  const payload: ReceiptPayload = {
    receiptId: createReceiptId(),
    sessionId: state.sessionId,
    stage: 1,
    status: "VERIFIED",
    issuedAt: now.toISOString(),
    elapsedSeconds: getElapsedSeconds(state.startedAt, now),
    inputAttempts: state.inputAttempts,
    solvePath: state.solvePath,
    assistUsed: getAssistLevel(state) > 0,
    evidence: {
      glyphInvestigated: state.investigationFlags.glyphInvestigated,
      inputDiscoveryMethod: state.entryInteraction.inputDiscoveryMethod,
      unverifiedDialogViewed: state.entryInteraction.unverifiedDialogViewed,
      cssClueSolved: state.investigationFlags.cssComputedClueFound,
    },
    evidenceSummary: createEvidenceSummary(state),
  };
  const checksum = await createLocalChecksum(payload);

  return {
    ...payload,
    checksum,
  };
}

function createEvidenceSummary(state: ArgSessionState): EvidenceSummary {
  const evidenceIds: string[] = [];

  if (state.investigationFlags.glyphInvestigated) {
    evidenceIds.push("OBSERVATION_GLYPH");
  }

  if (state.entryInteraction.inputDiscoveryMethod) {
    evidenceIds.push("INPUT_CHANNEL_DISCOVERED");
  }

  if (state.entryInteraction.unverifiedDialogViewed) {
    evidenceIds.push("UNVERIFIED_DIALOG");
  }

  if (state.investigationFlags.cssComputedClueFound) {
    evidenceIds.push("COMPUTED_STYLE_SIGNAL");
  }

  const assistLevel = getAssistLevel(state);

  if (assistLevel > 0) {
    evidenceIds.push(`SMALL_SIGNAL_LEVEL_${assistLevel}`);
  }

  return {
    observationCount: evidenceIds.length,
    validationsCompleted: [
      state.entryInteraction.attempts.some((attempt) => attempt.accepted),
      state.investigationFlags.cssComputedClueFound,
    ].filter(Boolean).length,
    assistLevel,
    blindAttemptCount: getBlindAttemptCount(state),
    evidenceIds,
  };
}

function getAssistLevel(state: ArgSessionState): EvidenceSummary["assistLevel"] {
  return state.entryInteraction.assistLevel ?? (state.entryInteraction.assistUsed ? 1 : 0);
}

function getBlindAttemptCount(state: ArgSessionState): number {
  const unresolvedAttempts = state.entryInteraction.attempts.filter((attempt) => !attempt.accepted).length;
  const incompleteEvidenceEntry = state.entryInteraction.routeProfile === "FAST_PATH" ? 1 : 0;

  return unresolvedAttempts + incompleteEvidenceEntry;
}

export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  const record = value as Record<string, unknown>;
  const entries = Object.keys(record)
    // Match JSON persistence, which omits optional fields with undefined values.
    .filter((key) => record[key] !== undefined)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`);

  return `{${entries.join(",")}}`;
}

export async function createLocalChecksum(payload: unknown): Promise<string> {
  return sha256(stableStringify(payload));
}

export async function verifyStageReceipt(receipt: StageReceipt): Promise<boolean> {
  const { checksum, ...payload } = receipt;
  return checksum === (await createLocalChecksum(payload));
}

function createReceiptId(): string {
  return `NT-01-${crypto.randomUUID().toUpperCase()}`;
}

function getElapsedSeconds(startedAt: string, now: Date): number {
  const elapsedMs = Math.max(0, now.getTime() - new Date(startedAt).getTime());
  return Number((elapsedMs / 1000).toFixed(3));
}

async function sha256(value: string): Promise<string> {
  const encoded = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  const bytes = Array.from(new Uint8Array(digest));

  return bytes.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
