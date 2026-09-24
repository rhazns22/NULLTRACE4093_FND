import { useEffect, useMemo, useRef, useState } from "react";
import { ENTRY_CODE, STYLE_CLUE, type ArgSessionState, type InputDiscoveryMethod } from "../domain/argTypes";
import {
  classifyRouteProfile,
  createInitialSession,
  updateSession,
} from "../domain/argFlow";
import { createStageReceipt } from "../domain/receiptFactory";
import { LocalStorageArgRepository } from "../storage/localStorageArgRepository";
import { navigateTo } from "../router/useHashRoute";

type ArgSessionActions = {
  recordGlyphInvestigation: () => void;
  inspectEntrySignal: (method: InputDiscoveryMethod) => void;
  recordInputStarted: () => void;
  submitEntryCode: (value: string) => void;
  closeUnverifiedDialog: () => void;
  openUnverifiedDialog: () => void;
  submitStyleClue: (value: string) => void;
  markAssistUsed: () => void;
  commitVerificationPath: () => void;
  issueReceipt: () => Promise<void>;
  resetSession: () => Promise<void>;
};

export type ArgSessionModel = {
  state: ArgSessionState | null;
  isLoading: boolean;
  actions: ArgSessionActions;
};

const INPUT_REJECTION_RESPONSES = [
  "carrier returned without lock",
  "sequence lost phase",
  "apparatus declined alignment",
] as const;

const PRIME_REJECTION_RESPONSES = [
  "carrier returned without lock / prime drift",
  "sequence lost phase / indivisible echo",
  "apparatus declined alignment / residue held",
] as const;

export function useArgSession(): ArgSessionModel {
  const repository = useMemo(() => new LocalStorageArgRepository(), []);
  const [state, setState] = useState<ArgSessionState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const stateRef = useRef<ArgSessionState | null>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      const sessionId = await repository.getOrCreateSessionId();
      const savedState = await repository.load();
      const nextState = savedState ?? createInitialSession(sessionId);

      if (isMounted) {
        setState(nextState);
        setIsLoading(false);
      }
    }

    void restoreSession();

    return () => {
      isMounted = false;
    };
  }, [repository]);

  useEffect(() => {
    if (!state) {
      return;
    }

    void repository.save(state);
  }, [repository, state]);

  const actions = useMemo<ArgSessionActions>(
    () => ({
      recordGlyphInvestigation() {
        setState((current) => {
          if (!current || current.currentStage !== "ENTRY" || current.investigationFlags.glyphInvestigated) {
            return current;
          }

          return updateSession(
            current,
            {
              investigationFlags: {
                entrySignalReviewed: true,
                glyphInvestigated: true,
              },
            },
            "observation symbol examined",
          );
        });
      },

      inspectEntrySignal(method: InputDiscoveryMethod) {
        setState((current) => {
          if (!current || current.currentStage !== "ENTRY") {
            return current;
          }

          const now = new Date();
          const glyphDiscovery = method === "glyph_click" || method === "glyph_keyboard_enter";
          const firstInputAt = method === "numeric_key" ? now.toISOString() : current.entryInteraction.firstInputAt;
          const timeToFirstInputMs =
            method === "numeric_key" ? getElapsedMs(current.startedAt, now) : current.entryInteraction.timeToFirstInputMs;

          return updateSession(
            current,
            {
              currentStage: "INPUT_DISCOVERED",
              investigationFlags: {
                entrySignalReviewed: current.investigationFlags.entrySignalReviewed || glyphDiscovery,
                glyphInvestigated: current.investigationFlags.glyphInvestigated || glyphDiscovery,
                inputCipherFound: current.investigationFlags.inputCipherFound || glyphDiscovery,
              },
              entryInteraction: {
                inputDiscoveryMethod: method,
                inputDiscoveredAt: now.toISOString(),
                firstInputAt,
                timeToFirstInputMs,
              },
            },
            "observation symbol resolved",
            method,
          );
        });
      },

      recordInputStarted() {
        setState((current) => {
          if (!current || current.currentStage !== "INPUT_DISCOVERED" || current.entryInteraction.firstInputAt) {
            return current;
          }

          const now = new Date();

          return updateSession(
            current,
            {
              entryInteraction: {
                firstInputAt: now.toISOString(),
                timeToFirstInputMs: getElapsedMs(current.startedAt, now),
              },
            },
            "entry input started",
          );
        });
      },

      submitEntryCode(value: string) {
        setState((current) => {
          if (!current || current.currentStage !== "INPUT_DISCOVERED") {
            return current;
          }

          const now = new Date();
          const nextAttempts = current.inputAttempts + 1;
          const normalized = value.replace(/\D/g, "").slice(0, 4);
          const elapsedMs = getElapsedMs(current.startedAt, now);
          const accepted = normalized.length === 4 && normalized === ENTRY_CODE;
          const response = accepted ? "unverified surface opened" : getRejectionResponse(nextAttempts);
          const attempts = [
            ...current.entryInteraction.attempts,
            {
              attemptNumber: nextAttempts,
              at: now.toISOString(),
              elapsedMs,
              accepted,
              response,
              inputLength: normalized.length,
            },
          ];

          if (accepted) {
            const routeProfile = classifyRouteProfile(current, elapsedMs);

            return updateSession(
              current,
              {
                currentStage: "UNVERIFIED",
                inputAttempts: nextAttempts,
                entryInteraction: {
                  attempts,
                  lastSubmittedAt: now.toISOString(),
                  timeToLastSubmitMs: elapsedMs,
                  routeProfile,
                  lastInputResponse: null,
                  unverifiedDialogOpen: true,
                  unverifiedDialogViewed: true,
                  unverifiedDialogDismissedAt: null,
                },
              },
              "entry code accepted",
              routeProfile,
            );
          }

          return updateSession(
            current,
            {
              inputAttempts: nextAttempts,
              entryInteraction: {
                attempts,
                lastSubmittedAt: now.toISOString(),
                timeToLastSubmitMs: elapsedMs,
                lastInputResponse: response,
              },
            },
            "entry sequence unresolved",
            response,
          );
        });
      },

      closeUnverifiedDialog() {
        setState((current) => {
          if (!current || current.currentStage !== "UNVERIFIED" || !current.entryInteraction.unverifiedDialogOpen) {
            return current;
          }

          return updateSession(
            current,
            {
              entryInteraction: {
                unverifiedDialogOpen: false,
                unverifiedDialogDismissedAt: new Date().toISOString(),
              },
            },
            "unverified dialog dismissed",
          );
        });
      },

      openUnverifiedDialog() {
        setState((current) => {
          if (!current || current.currentStage !== "UNVERIFIED" || current.entryInteraction.unverifiedDialogOpen) {
            return current;
          }

          return updateSession(
            current,
            {
              entryInteraction: {
                unverifiedDialogOpen: true,
              },
            },
            "unverified dialog reopened",
          );
        });
      },

      submitStyleClue(value: string) {
        setState((current) => {
          if (!current || current.currentStage !== "UNVERIFIED") {
            return current;
          }

          const normalized = normalizeSignalCommand(value);

          if (normalized !== STYLE_CLUE) {
            return updateSession(current, {}, "computed style clue rejected", normalized || "empty clue");
          }

          const styleClueFound = updateSession(
            current,
            {
              currentStage: "STYLE_CLUE_FOUND",
              investigationFlags: {
                cssComputedClueFound: true,
              },
              entryInteraction: {
                styleSignalSubmittedAt: new Date().toISOString(),
                unverifiedDialogOpen: false,
              },
            },
            "computed style clue accepted",
            "nt-signal decoded",
          );

          return updateSession(
            styleClueFound,
            {
              currentStage: "VERIFIED",
              investigationFlags: {
                verificationPathCommitted: true,
              },
            },
            "verification command accepted",
            "computed style signal",
          );
        });
      },

      markAssistUsed() {
        setState((current) => {
          if (!current || current.entryInteraction.assistUsed) {
            return current;
          }

          return updateSession(
            current,
            {
              entryInteraction: {
                assistUsed: true,
                assistUsedAt: new Date().toISOString(),
              },
            },
            "assistive hint consulted",
          );
        });
      },

      commitVerificationPath() {
        setState((current) => {
          if (!current || current.currentStage !== "STYLE_CLUE_FOUND") {
            return current;
          }

          return updateSession(
            current,
            {
              currentStage: "VERIFIED",
              investigationFlags: {
                verificationPathCommitted: true,
              },
            },
            "verification path committed",
          );
        });
      },

      async issueReceipt() {
        const current = stateRef.current;

        if (!current || current.currentStage !== "VERIFIED") {
          return;
        }

        const receipt = await createStageReceipt(current);

        setState((latest) => {
          if (!latest || latest.currentStage !== "VERIFIED") {
            return latest;
          }

          return updateSession(
            latest,
            {
              currentStage: "RECEIPT_ISSUED",
              receipt,
            },
            "stage receipt issued",
            receipt.receiptId,
          );
        });

        navigateTo("receipt");
      },

      async resetSession() {
        await repository.clear();
        const sessionId = await repository.getOrCreateSessionId();
        const nextState = createInitialSession(sessionId);
        setState(nextState);
        navigateTo("console");
      },
    }),
    [repository],
  );

  return {
    state,
    isLoading,
    actions,
  };
}

function getElapsedMs(startedAt: string, now: Date): number {
  return Math.max(0, now.getTime() - new Date(startedAt).getTime());
}

function getRejectionResponse(attemptNumber: number): string {
  if (isPrime(attemptNumber)) {
    return PRIME_REJECTION_RESPONSES[(attemptNumber - 1) % PRIME_REJECTION_RESPONSES.length];
  }

  return INPUT_REJECTION_RESPONSES[(attemptNumber - 1) % INPUT_REJECTION_RESPONSES.length];
}

function isPrime(value: number): boolean {
  if (value < 2) {
    return false;
  }

  for (let divisor = 2; divisor * divisor <= value; divisor += 1) {
    if (value % divisor === 0) {
      return false;
    }
  }

  return true;
}

function normalizeSignalCommand(value: string): string {
  return value.trim().replace(/\s+/g, " ").toUpperCase();
}
