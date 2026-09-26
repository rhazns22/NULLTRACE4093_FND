import type { AssistLevel, Trace02State, Trace02Stage } from "../argTypes";
import { getTrace02ExpectedCommand, OMITTED_TRACE_02_RECORDS } from "./trace02Records";

export const TRACE_02_REJECTION = "COMMAND REJECTED. DOCUMENT ORDER DOES NOT MATCH.";

const OMITTED_IDS = new Set(OMITTED_TRACE_02_RECORDS.map((record) => record.id));

export type EvidenceValidationResult =
  | { ok: true; orderedIds: string[] }
  | { ok: false; message: string };

export function createInitialTrace02State(now = new Date()): Trace02State {
  const startedAt = now.toISOString();

  return {
    currentStage: "ENTRY",
    startedAt,
    completedAt: null,
    attempts: 0,
    assistLevel: 0,
    discoveredRecordIds: [],
    submittedCommand: null,
    solvePath: [
      {
        at: startedAt,
        stage: "ENTRY",
        action: "trace 02 opened",
      },
    ],
    lastError: null,
    restoredAt: null,
  };
}

export function appendTrace02Path(
  state: Trace02State,
  action: string,
  detail?: string,
  at = new Date(),
) {
  return {
    at: at.toISOString(),
    stage: state.currentStage,
    action,
    detail,
  };
}

export function updateTrace02State(
  state: Trace02State,
  patch: Partial<Trace02State>,
  action: string,
  detail?: string,
): Trace02State {
  return {
    ...state,
    ...patch,
    solvePath: [...state.solvePath, appendTrace02Path(state, action, detail)],
  };
}

export function validateTrace02Evidence(input: string): EvidenceValidationResult {
  const ids = input
    .split(/[\s,]+/)
    .map((id) => id.trim().toUpperCase())
    .filter(Boolean);

  if (ids.length !== OMITTED_TRACE_02_RECORDS.length) {
    return { ok: false, message: "RECORD EVIDENCE REQUIRES FOUR OMITTED IDS." };
  }

  if (new Set(ids).size !== ids.length) {
    return { ok: false, message: "RECORD EVIDENCE CONTAINS A DUPLICATE." };
  }

  if (!ids.every((id) => OMITTED_IDS.has(id))) {
    return { ok: false, message: "RECORD EVIDENCE DOES NOT MATCH OMITTED DOCUMENT RECORDS." };
  }

  const orderedIds = OMITTED_TRACE_02_RECORDS
    .slice()
    .sort((left, right) => left.sequence - right.sequence)
    .map((record) => record.id);

  return { ok: true, orderedIds };
}

export function normalizeTrace02Command(value: string): string {
  return value.trim().replace(/\s+/g, " ").toUpperCase();
}

export function isTrace02CommandAccepted(value: string): boolean {
  return /^[A-Z ]+$/.test(value) && normalizeTrace02Command(value) === getTrace02ExpectedCommand();
}

export function getNextAssistLevel(current: AssistLevel): AssistLevel {
  return Math.min(current + 1, 3) as AssistLevel;
}

export function getTrace02StageAfterEvidence(): Trace02Stage {
  return "OMITTED_RECORDS_FOUND";
}
