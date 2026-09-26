import type { ArgRepository } from "./argRepository";
import {
  INITIAL_TRACE_02_STATE,
  type ArgSessionState,
  type ArgSessionStateV2,
  type Trace02State,
} from "../domain/argTypes";
import { createInitialSession, normalizeSessionState } from "../domain/argFlow";

const SESSION_STORAGE_KEY = "nulltrace-4093.session-id.v1";
export const STATE_STORAGE_KEY = "nulltrace-4093.arg-state.v1";
export const STATE_STORAGE_KEY_V2 = "nulltrace-4093.arg-state.v2";

export type LocalRecordRecovery = {
  key: string;
  raw: string;
  reason: string;
};

export class LocalRecordUnreadableError extends Error {
  recovery: LocalRecordRecovery;

  constructor(recovery: LocalRecordRecovery) {
    super("Local NULLTRACE record is unreadable.");
    this.name = "LocalRecordUnreadableError";
    this.recovery = recovery;
  }
}

export class LocalStorageArgRepository implements ArgRepository {
  async getOrCreateSessionId(): Promise<string> {
    const existing = window.localStorage.getItem(SESSION_STORAGE_KEY);

    if (existing) {
      return existing;
    }

    const nextSessionId = window.crypto.randomUUID();
    window.localStorage.setItem(SESSION_STORAGE_KEY, nextSessionId);
    return nextSessionId;
  }

  async load(): Promise<ArgSessionState | null> {
    const sessionId = await this.getOrCreateSessionId();
    const state = await this.loadV2(sessionId);
    return state.traces.TRACE_01;
  }

  async save(state: ArgSessionState): Promise<void> {
    const current = await this.loadV2(state.sessionId);
    const next: ArgSessionStateV2 = {
      ...current,
      sessionId: state.sessionId,
      traces: {
        ...current.traces,
        TRACE_01: normalizeSessionState(state),
      },
      receipts: {
        ...current.receipts,
        TRACE_01: state.receipt ?? current.receipts.TRACE_01,
      },
    };

    await this.saveV2(next);
  }

  async clear(): Promise<void> {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    const nextSessionId = window.crypto.randomUUID();
    window.localStorage.setItem(SESSION_STORAGE_KEY, nextSessionId);
    await this.saveV2(createSessionStateV2(nextSessionId));
  }

  async startNewSession(): Promise<ArgSessionState> {
    const nextSessionId = window.crypto.randomUUID();
    const next = createSessionStateV2(nextSessionId);
    window.localStorage.setItem(SESSION_STORAGE_KEY, nextSessionId);
    await this.saveV2(next);
    return next.traces.TRACE_01;
  }

  async loadV2(sessionId = window.localStorage.getItem(SESSION_STORAGE_KEY) ?? ""): Promise<ArgSessionStateV2> {
    const rawV2 = window.localStorage.getItem(STATE_STORAGE_KEY_V2);

    if (rawV2) {
      try {
        const parsed = JSON.parse(rawV2) as unknown;
        if (isArgSessionStateV2(parsed)) {
          return normalizeSessionStateV2(parsed, sessionId || parsed.sessionId);
        }
        throw new LocalRecordUnreadableError({
          key: STATE_STORAGE_KEY_V2,
          raw: rawV2,
          reason: "v2 state shape was incomplete",
        });
      } catch (error) {
        if (error instanceof LocalRecordUnreadableError) {
          throw error;
        }
        throw new LocalRecordUnreadableError({
          key: STATE_STORAGE_KEY_V2,
          raw: rawV2,
          reason: getErrorMessage(error),
        });
      }
    }

    const migrated = await this.migrateV1ToV2(sessionId || (await this.getOrCreateSessionId()));
    await this.saveV2(migrated);
    return migrated;
  }

  async saveV2(state: ArgSessionStateV2): Promise<void> {
    window.localStorage.setItem(STATE_STORAGE_KEY_V2, JSON.stringify(normalizeSessionStateV2(state, state.sessionId)));
  }

  private async migrateV1ToV2(sessionId: string): Promise<ArgSessionStateV2> {
    const rawV1 = window.localStorage.getItem(STATE_STORAGE_KEY);
    let trace01 = createInitialSession(sessionId);

    if (rawV1) {
      try {
        const parsed = JSON.parse(rawV1) as unknown;
        if (isArgSessionState(parsed)) {
          trace01 = normalizeSessionState(parsed);
        } else {
          throw new LocalRecordUnreadableError({
            key: STATE_STORAGE_KEY,
            raw: rawV1,
            reason: "v1 state shape was incomplete",
          });
        }
      } catch (error) {
        if (error instanceof LocalRecordUnreadableError) {
          throw error;
        }
        throw new LocalRecordUnreadableError({
          key: STATE_STORAGE_KEY,
          raw: rawV1,
          reason: getErrorMessage(error),
        });
      }
    }

    return createSessionStateV2(trace01.sessionId || sessionId, trace01);
  }
}

export function createSessionStateV2(sessionId: string, trace01 = createInitialSession(sessionId)): ArgSessionStateV2 {
  const normalizedTrace01 = normalizeSessionState(trace01);

  return {
    schemaVersion: 2,
    sessionId,
    currentTrace: "TRACE_01",
    traces: {
      TRACE_01: normalizedTrace01,
      TRACE_02: { ...INITIAL_TRACE_02_STATE, discoveredRecordIds: [], solvePath: [] },
    },
    receipts: normalizedTrace01.receipt ? { TRACE_01: normalizedTrace01.receipt } : {},
  };
}

export function normalizeSessionStateV2(state: ArgSessionStateV2, fallbackSessionId: string): ArgSessionStateV2 {
  const trace01 = isArgSessionState(state.traces?.TRACE_01)
    ? normalizeSessionState(state.traces.TRACE_01)
    : createInitialSession(fallbackSessionId);
  const trace02 = normalizeTrace02State(state.traces?.TRACE_02);
  const receipts = {
    ...state.receipts,
    TRACE_01: state.receipts?.TRACE_01 ?? trace01.receipt ?? undefined,
  };

  return {
    schemaVersion: 2,
    sessionId: typeof state.sessionId === "string" ? state.sessionId : fallbackSessionId,
    currentTrace: state.currentTrace === "TRACE_02" ? "TRACE_02" : "TRACE_01",
    traces: {
      TRACE_01: trace01,
      TRACE_02: trace02,
    },
    receipts,
  };
}

function normalizeTrace02State(value: unknown): Trace02State {
  const candidate = value && typeof value === "object" ? (value as Partial<Trace02State>) : {};

  return {
    ...INITIAL_TRACE_02_STATE,
    ...candidate,
    currentStage:
      candidate.currentStage === "ENTRY" ||
      candidate.currentStage === "DOCUMENT_LOCATED" ||
      candidate.currentStage === "OMITTED_RECORDS_FOUND" ||
      candidate.currentStage === "ORDER_RESTORED" ||
      candidate.currentStage === "VERIFIED" ||
      candidate.currentStage === "RECEIPT_ISSUED"
        ? candidate.currentStage
        : "LOCKED",
    attempts: typeof candidate.attempts === "number" ? candidate.attempts : 0,
    assistLevel:
      candidate.assistLevel === 1 ||
      candidate.assistLevel === 2 ||
      candidate.assistLevel === 3
        ? candidate.assistLevel
        : 0,
    discoveredRecordIds: Array.isArray(candidate.discoveredRecordIds)
      ? candidate.discoveredRecordIds.filter((id): id is string => typeof id === "string")
      : [],
    solvePath: Array.isArray(candidate.solvePath) ? candidate.solvePath : [],
  };
}

function isArgSessionState(value: unknown): value is ArgSessionState {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<ArgSessionState>;

  return (
    typeof candidate.currentStage === "string" &&
    typeof candidate.sessionId === "string" &&
    typeof candidate.startedAt === "string" &&
    typeof candidate.inputAttempts === "number" &&
    typeof candidate.investigationFlags === "object" &&
    Array.isArray(candidate.solvePath) &&
    ("receipt" in candidate ? candidate.receipt === null || typeof candidate.receipt === "object" : true)
  );
}

function isArgSessionStateV2(value: unknown): value is ArgSessionStateV2 {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<ArgSessionStateV2>;

  return (
    candidate.schemaVersion === 2 &&
    typeof candidate.sessionId === "string" &&
    typeof candidate.traces === "object" &&
    !!candidate.traces &&
    typeof candidate.traces.TRACE_01 === "object" &&
    typeof candidate.traces.TRACE_02 === "object"
  );
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "unknown parse error";
}
