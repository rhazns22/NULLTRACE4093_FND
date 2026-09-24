import {
  INITIAL_ENTRY_INTERACTION,
  INITIAL_INVESTIGATION_FLAGS,
  type ArgSessionState,
  type ArgStage,
  type EntryInteractionState,
  type InvestigationFlags,
  type RouteProfile,
  type SolvePathEntry,
  type StageReceipt,
} from "./argTypes";

export const NORMAL_PATH_MIN_DWELL_MS = 4093;

export function createInitialSession(sessionId: string, now = new Date()): ArgSessionState {
  const startedAt = now.toISOString();

  return {
    currentStage: "ENTRY",
    sessionId,
    startedAt,
    inputAttempts: 0,
    investigationFlags: { ...INITIAL_INVESTIGATION_FLAGS },
    entryInteraction: { ...INITIAL_ENTRY_INTERACTION, attempts: [] },
    solvePath: [
      {
        at: startedAt,
        stage: "ENTRY",
        action: "anonymous session opened",
      },
    ],
    receipt: null,
  };
}

type SessionPatch = {
  currentStage?: ArgStage;
  investigationFlags?: Partial<InvestigationFlags>;
  entryInteraction?: Partial<EntryInteractionState>;
  inputAttempts?: number;
  receipt?: StageReceipt | null;
};

export function appendSolvePath(
  state: ArgSessionState,
  action: string,
  detail?: string,
  at = new Date(),
): SolvePathEntry {
  return {
    at: at.toISOString(),
    stage: state.currentStage,
    action,
    detail,
  };
}

export function updateSession(
  state: ArgSessionState,
  patch: SessionPatch,
  action: string,
  detail?: string,
): ArgSessionState {
  const nextFlags = {
    ...state.investigationFlags,
    ...patch.investigationFlags,
  };
  const nextEntryInteraction = {
    ...state.entryInteraction,
    ...patch.entryInteraction,
  };

  const nextState: ArgSessionState = {
    ...state,
    ...patch,
    investigationFlags: nextFlags,
    entryInteraction: nextEntryInteraction,
    solvePath: [...state.solvePath, appendSolvePath(state, action, detail)],
  };

  return nextState;
}

export function normalizeSessionState(state: ArgSessionState): ArgSessionState {
  const hasUnverifiedDialogFlag =
    !!state.entryInteraction && "unverifiedDialogOpen" in state.entryInteraction;

  return {
    ...state,
    investigationFlags: {
      ...INITIAL_INVESTIGATION_FLAGS,
      ...state.investigationFlags,
    },
    entryInteraction: {
      ...INITIAL_ENTRY_INTERACTION,
      ...state.entryInteraction,
      unverifiedDialogOpen: hasUnverifiedDialogFlag
        ? state.entryInteraction.unverifiedDialogOpen
        : state.currentStage === "UNVERIFIED",
      attempts: state.entryInteraction?.attempts ?? [],
    },
    receipt: isStageReceipt(state.receipt) ? state.receipt : null,
  };
}

export function classifyRouteProfile(state: ArgSessionState, elapsedMs: number): RouteProfile {
  const hasInvestigation =
    state.investigationFlags.glyphInvestigated || state.investigationFlags.entrySignalReviewed;
  const usedNormalDiscovery =
    state.entryInteraction.inputDiscoveryMethod === "glyph_click" ||
    state.entryInteraction.inputDiscoveryMethod === "glyph_keyboard_enter";
  const stayedLongEnough = elapsedMs >= NORMAL_PATH_MIN_DWELL_MS;

  return hasInvestigation && usedNormalDiscovery && stayedLongEnough ? "NORMAL_PATH" : "FAST_PATH";
}

function isStageReceipt(value: StageReceipt | null): value is StageReceipt {
  return (
    !!value &&
    typeof value.receiptId === "string" &&
    value.receiptId.startsWith("NT-01-") &&
    value.stage === 1 &&
    value.status === "VERIFIED" &&
    typeof value.checksum === "string"
  );
}
