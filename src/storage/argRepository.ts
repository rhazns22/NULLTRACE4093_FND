import type { ArgSessionState } from "../domain/argTypes";

export interface ArgRepository {
  getOrCreateSessionId(): Promise<string>;
  load(): Promise<ArgSessionState | null>;
  save(state: ArgSessionState): Promise<void>;
  clear(): Promise<void>;
}
