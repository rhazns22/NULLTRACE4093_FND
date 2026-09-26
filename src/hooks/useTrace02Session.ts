import { useEffect, useMemo, useState } from "react";
import type { ArgSessionStateV2 } from "../domain/argTypes";
import { verifyStageReceipt } from "../domain/receiptFactory";
import {
  createInitialTrace02State,
  getNextAssistLevel,
  getTrace02StageAfterEvidence,
  isTrace02CommandAccepted,
  normalizeTrace02Command,
  TRACE_02_REJECTION,
  updateTrace02State,
  validateTrace02Evidence,
} from "../domain/trace02/trace02Flow";
import { createTrace02Receipt } from "../domain/trace02/trace02ReceiptFactory";
import { LocalStorageArgRepository } from "../storage/localStorageArgRepository";

type Trace02Actions = {
  startTrace: () => void;
  submitEvidence: (value: string) => void;
  submitCommand: (value: string) => void;
  requestAssist: () => void;
  issueReceipt: () => Promise<void>;
  reload: () => Promise<void>;
};

export type Trace02Model = {
  actions: Trace02Actions;
  isLoading: boolean;
  previousEvidenceValid: boolean;
  state: ArgSessionStateV2 | null;
};

export function useTrace02Session(): Trace02Model {
  const repository = useMemo(() => new LocalStorageArgRepository(), []);
  const [state, setState] = useState<ArgSessionStateV2 | null>(null);
  const [previousEvidenceValid, setPreviousEvidenceValid] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  async function refresh() {
    const sessionId = await repository.getOrCreateSessionId();
    const next = await repository.loadV2(sessionId);
    setState(next);
    setPreviousEvidenceValid(await hasValidTrace01Receipt(next));
    setIsLoading(false);
  }

  useEffect(() => {
    let isMounted = true;

    async function load() {
      const sessionId = await repository.getOrCreateSessionId();
      const next = await repository.loadV2(sessionId);

      if (!isMounted) {
        return;
      }

      setState(next);
      setPreviousEvidenceValid(await hasValidTrace01Receipt(next));
      setIsLoading(false);
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, [repository]);

  async function persist(next: ArgSessionStateV2) {
    setState(next);
    setPreviousEvidenceValid(await hasValidTrace01Receipt(next));
    await repository.saveV2(next);
  }

  const actions = useMemo<Trace02Actions>(
    () => ({
      startTrace() {
        if (!state || !previousEvidenceValid) {
          return;
        }

        const trace02 =
          state.traces.TRACE_02.currentStage === "LOCKED"
            ? createInitialTrace02State()
            : state.traces.TRACE_02;
        void persist({
          ...state,
          currentTrace: "TRACE_02",
          traces: {
            ...state.traces,
            TRACE_02: trace02,
          },
        });
      },

      submitEvidence(value: string) {
        if (!state || !previousEvidenceValid) {
          return;
        }

        const result = validateTrace02Evidence(value);
        const current = state.traces.TRACE_02.currentStage === "LOCKED"
          ? createInitialTrace02State()
          : state.traces.TRACE_02;

        if (!result.ok) {
          void persist({
            ...state,
            traces: {
              ...state.traces,
              TRACE_02: updateTrace02State(
                current,
                {
                  currentStage: current.currentStage === "ENTRY" ? "DOCUMENT_LOCATED" : current.currentStage,
                  lastError: result.message,
                },
                "omitted record evidence rejected",
              ),
            },
          });
          return;
        }

        void persist({
          ...state,
          traces: {
            ...state.traces,
            TRACE_02: updateTrace02State(
              current,
              {
                currentStage: getTrace02StageAfterEvidence(),
                discoveredRecordIds: result.orderedIds,
                lastError: null,
              },
              "omitted record evidence accepted",
              result.orderedIds.join(" "),
            ),
          },
        });
      },

      submitCommand(value: string) {
        if (!state || !previousEvidenceValid) {
          return;
        }

        const current = state.traces.TRACE_02.currentStage === "LOCKED"
          ? createInitialTrace02State()
          : state.traces.TRACE_02;
        const attempts = current.attempts + 1;
        const normalized = normalizeTrace02Command(value);

        if (current.discoveredRecordIds.length !== 4 || !isTrace02CommandAccepted(normalized)) {
          void persist({
            ...state,
            traces: {
              ...state.traces,
              TRACE_02: updateTrace02State(
                current,
                {
                  attempts,
                  submittedCommand: normalized,
                  lastError: TRACE_02_REJECTION,
                },
                "document restore command rejected",
              ),
            },
          });
          return;
        }

        const now = new Date();
        void persist({
          ...state,
          traces: {
            ...state.traces,
            TRACE_02: updateTrace02State(
              current,
              {
                currentStage: "VERIFIED",
                completedAt: now.toISOString(),
                attempts,
                submittedCommand: normalized,
                lastError: null,
                restoredAt: now.toISOString(),
              },
              "document restore command accepted",
            ),
          },
        });
      },

      requestAssist() {
        if (!state || !previousEvidenceValid) {
          return;
        }

        const current = state.traces.TRACE_02.currentStage === "LOCKED"
          ? createInitialTrace02State()
          : state.traces.TRACE_02;
        const nextLevel = getNextAssistLevel(current.assistLevel);

        void persist({
          ...state,
          traces: {
            ...state.traces,
            TRACE_02: updateTrace02State(
              current,
              {
                assistLevel: nextLevel,
              },
              "trace 02 assist consulted",
              `level ${nextLevel}`,
            ),
          },
        });
      },

      async issueReceipt() {
        if (!state || state.traces.TRACE_02.currentStage !== "VERIFIED") {
          return;
        }

        const receipt = await createTrace02Receipt(state);
        const nextTrace02 = updateTrace02State(
          state.traces.TRACE_02,
          {
            currentStage: "RECEIPT_ISSUED",
          },
          "trace 02 receipt issued",
          receipt.receiptId,
        );

        await persist({
          ...state,
          currentTrace: "TRACE_02",
          traces: {
            ...state.traces,
            TRACE_02: nextTrace02,
          },
          receipts: {
            ...state.receipts,
            TRACE_02: receipt,
          },
        });
      },

      async reload() {
        await refresh();
      },
    }),
    [previousEvidenceValid, state],
  );

  return {
    actions,
    isLoading,
    previousEvidenceValid,
    state,
  };
}

async function hasValidTrace01Receipt(state: ArgSessionStateV2): Promise<boolean> {
  const receipt = state.receipts.TRACE_01 ?? state.traces.TRACE_01.receipt;

  if (!receipt || state.traces.TRACE_01.currentStage !== "RECEIPT_ISSUED") {
    return false;
  }

  return verifyStageReceipt(receipt);
}
