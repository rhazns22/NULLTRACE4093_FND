export const ENTRY_CODE = "4093";
export { STYLE_CLUE } from "./argSignals";

export const ARG_STAGES = [
  "ENTRY",
  "INPUT_DISCOVERED",
  "UNVERIFIED",
  "STYLE_CLUE_FOUND",
  "VERIFIED",
  "RECEIPT_ISSUED",
] as const;

export type ArgStage = (typeof ARG_STAGES)[number];

export type InputDiscoveryMethod = "glyph_click" | "glyph_keyboard_enter" | "numeric_key";
export type RouteProfile = "UNDETERMINED" | "NORMAL_PATH" | "FAST_PATH";
export type AssistLevel = 0 | 1 | 2 | 3;

export type InvestigationFlags = {
  entrySignalReviewed: boolean;
  glyphInvestigated: boolean;
  inputCipherFound: boolean;
  cssComputedClueFound: boolean;
  verificationPathCommitted: boolean;
};

export type InputAttemptRecord = {
  attemptNumber: number;
  at: string;
  elapsedMs: number;
  accepted: boolean;
  response: string;
  inputLength: number;
};

export type EntryInteractionState = {
  inputDiscoveryMethod: InputDiscoveryMethod | null;
  inputDiscoveredAt: string | null;
  firstInputAt: string | null;
  lastSubmittedAt: string | null;
  timeToFirstInputMs: number | null;
  timeToLastSubmitMs: number | null;
  routeProfile: RouteProfile;
  lastInputResponse: string | null;
  unverifiedDialogOpen: boolean;
  unverifiedDialogViewed: boolean;
  unverifiedDialogDismissedAt: string | null;
  styleSignalSubmittedAt: string | null;
  assistUsed: boolean;
  assistLevel: AssistLevel;
  assistUsedAt: string | null;
  attempts: InputAttemptRecord[];
};

export type SolvePathEntry = {
  at: string;
  stage: ArgStage;
  action: string;
  detail?: string;
};

export type ReceiptEvidence = {
  glyphInvestigated: boolean;
  inputDiscoveryMethod: InputDiscoveryMethod | null;
  unverifiedDialogViewed: boolean;
  cssClueSolved: boolean;
};

export type EvidenceSummary = {
  observationCount: number;
  validationsCompleted: number;
  assistLevel: AssistLevel;
  blindAttemptCount: number;
  evidenceIds: string[];
};

export type StageReceipt = {
  receiptId: string;
  sessionId: string;
  stage: 1;
  status: "VERIFIED";
  issuedAt: string;
  elapsedSeconds: number;
  inputAttempts: number;
  solvePath: SolvePathEntry[];
  assistUsed: boolean;
  evidence: ReceiptEvidence;
  evidenceSummary?: EvidenceSummary;
  checksum: string;
};

export type TraceId = "TRACE_01" | "TRACE_02";

export const TRACE_02_STAGES = [
  "LOCKED",
  "ENTRY",
  "DOCUMENT_LOCATED",
  "OMITTED_RECORDS_FOUND",
  "ORDER_RESTORED",
  "VERIFIED",
  "RECEIPT_ISSUED",
] as const;

export type Trace02Stage = (typeof TRACE_02_STAGES)[number];

export type Trace02SolvePathEntry = {
  at: string;
  stage: Trace02Stage;
  action: string;
  detail?: string;
};

export type Trace02State = {
  currentStage: Trace02Stage;
  startedAt: string | null;
  completedAt: string | null;
  attempts: number;
  assistLevel: AssistLevel;
  discoveredRecordIds: string[];
  submittedCommand: string | null;
  solvePath: Trace02SolvePathEntry[];
  lastError: string | null;
  restoredAt: string | null;
};

export type Trace02Receipt = {
  receiptId: string;
  sessionId: string;
  trace: "TRACE_02";
  stage: "DOCUMENT_RESTORED";
  status: "VERIFIED";
  issuedAt: string;
  elapsedSeconds: number;
  inputAttempts: number;
  assistUsed: boolean;
  evidenceSummary: EvidenceSummary;
  solvePath: Trace02SolvePathEntry[];
  checksum: string;
};

export type ArgSessionStateV2 = {
  schemaVersion: 2;
  sessionId: string;
  currentTrace: TraceId;
  traces: {
    TRACE_01: ArgSessionState;
    TRACE_02: Trace02State;
  };
  receipts: Partial<{
    TRACE_01: StageReceipt;
    TRACE_02: Trace02Receipt;
  }>;
};

export type ArgSessionState = {
  currentStage: ArgStage;
  sessionId: string;
  startedAt: string;
  inputAttempts: number;
  investigationFlags: InvestigationFlags;
  entryInteraction: EntryInteractionState;
  solvePath: SolvePathEntry[];
  receipt: StageReceipt | null;
};

export const INITIAL_TRACE_02_STATE: Trace02State = {
  currentStage: "LOCKED",
  startedAt: null,
  completedAt: null,
  attempts: 0,
  assistLevel: 0,
  discoveredRecordIds: [],
  submittedCommand: null,
  solvePath: [],
  lastError: null,
  restoredAt: null,
};

export const INITIAL_INVESTIGATION_FLAGS: InvestigationFlags = {
  entrySignalReviewed: false,
  glyphInvestigated: false,
  inputCipherFound: false,
  cssComputedClueFound: false,
  verificationPathCommitted: false,
};

export const INITIAL_ENTRY_INTERACTION: EntryInteractionState = {
  inputDiscoveryMethod: null,
  inputDiscoveredAt: null,
  firstInputAt: null,
  lastSubmittedAt: null,
  timeToFirstInputMs: null,
  timeToLastSubmitMs: null,
  routeProfile: "UNDETERMINED",
  lastInputResponse: null,
  unverifiedDialogOpen: false,
  unverifiedDialogViewed: false,
  unverifiedDialogDismissedAt: null,
  styleSignalSubmittedAt: null,
  assistUsed: false,
  assistLevel: 0,
  assistUsedAt: null,
  attempts: [],
};
