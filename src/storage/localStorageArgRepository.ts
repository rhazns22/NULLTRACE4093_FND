import type { ArgRepository } from "./argRepository";
import type { ArgSessionState } from "../domain/argTypes";
import { normalizeSessionState } from "../domain/argFlow";

const SESSION_STORAGE_KEY = "nulltrace-4093.session-id.v1";
const STATE_STORAGE_KEY = "nulltrace-4093.arg-state.v1";

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
    const rawState = window.localStorage.getItem(STATE_STORAGE_KEY);

    if (!rawState) {
      return null;
    }

    try {
      const parsed = JSON.parse(rawState) as unknown;

      if (isArgSessionState(parsed)) {
        return normalizeSessionState(parsed);
      }
    } catch {
      window.localStorage.removeItem(STATE_STORAGE_KEY);
    }

    return null;
  }

  async save(state: ArgSessionState): Promise<void> {
    window.localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(state));
  }

  async clear(): Promise<void> {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    window.localStorage.removeItem(STATE_STORAGE_KEY);
  }
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
