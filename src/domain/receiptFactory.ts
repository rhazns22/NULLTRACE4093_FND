import type { ArgSessionState, StageReceipt } from "./argTypes";

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
    assistUsed: state.entryInteraction.assistUsed,
    evidence: {
      glyphInvestigated: state.investigationFlags.glyphInvestigated,
      inputDiscoveryMethod: state.entryInteraction.inputDiscoveryMethod,
      unverifiedDialogViewed: state.entryInteraction.unverifiedDialogViewed,
      cssClueSolved: state.investigationFlags.cssComputedClueFound,
    },
  };
  const checksum = await sha256(stableStringify(payload));

  return {
    ...payload,
    checksum,
  };
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
