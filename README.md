# NULLTRACE 4093 Frontend

NULLTRACE 4093 is a browser-based ARG prototype about observation, evidence, and verification.

It is not an AI detector and it does not exclude participants for using tools. The project asks whether a participant can observe a result, doubt it, inspect it, and verify it.

The full thesis is revealed gradually through later chapters, not on the first screen:

```text
AI DID NOT LOWER THE STANDARD.
UNVERIFIED DELEGATION DID.

USE ANY TOOL.
VERIFY EVERY RESULT.

WE DO NOT MEASURE
WHAT YOU CAN GENERATE.

WE MEASURE
WHAT YOU CAN VERIFY.
```

Live deployments:

- GitHub Pages: https://rhazns22.github.io/NULLTRACE4093_FND/
- Vercel: https://4093nulltracepage3904.vercel.app/

## Current Implementation

Implemented now:

- Trace 01 vertical slice
- Trace 02 playable slice
- unidentified first screen
- circular observation glyph with missing-node structure
- hidden input channel discovery
- four-digit entry sequence
- `UNVERIFIED` dialog
- computed CSS custom-property clue
- `VERIFY SIGNAL` command path
- local Stage Receipt
- JSON view, download, and clipboard copy
- new-session confirmation
- hash-based routing
- `localStorage` session recovery
- `NORMAL_PATH` and internal `FAST_PATH` route classification
- user-facing `FAST_PATH` concept reframed as `INCOMPLETE_EVIDENCE`
- `assistLevel` and `evidenceSummary` for new receipts
- reduced-motion support
- keyboard-only Stage 1 path
- hidden DOM and document-order Chapter 02 path
- v1 to v2 localStorage migration
- separate `TRACE_01` and `TRACE_02` receipts
- GitHub Pages and Vercel base-path split

Planned, not implemented:

- Service Worker
- IndexedDB persistence
- backend verification API
- server-signed receipts
- per-session server seeds
- public receipt verification page
- chapters 03-10 as playable routes
- public leaderboard
- account system

## Tech Stack

- Vite
- React
- TypeScript
- plain CSS in `src/styles.css` and `src/motion.css`
- no external UI framework
- Web Crypto API for UUID generation and SHA-256 local checksums
- Playwright tests for regression coverage
- GitHub Actions + GitHub Pages for static deployment

## Requirements

- Node.js 22 recommended
- npm
- modern browser support for:
  - `crypto.randomUUID()`
  - `crypto.subtle.digest()`
  - `localStorage`

## Commands

Install dependencies:

```bash
npm install
```

Run local development:

```bash
npm run dev
```

The Vite dev server binds to:

```text
http://127.0.0.1:5173/
```

Type-check:

```bash
npm run typecheck
```

Production build:

```bash
npm run build
```

Vercel-compatible production build:

```bash
VERCEL=1 npm run build
```

Preview the production build locally:

```bash
npm run preview
```

Run existing Playwright checks:

```bash
npm run test:e2e
```

## Repository Layout

```text
.
├── .github/workflows/deploy-pages.yml
├── docs
│   ├── chapter-roadmap.md
│   ├── design-system.md
│   ├── easter-eggs.md
│   ├── narrative-bible.md
│   └── puzzle-fairness.md
├── index.html
├── package.json
├── playwright.config.ts
├── public/favicon.svg
├── src
│   ├── App.tsx
│   ├── components
│   ├── domain
│   ├── hooks
│   ├── router
│   ├── storage
│   ├── main.tsx
│   ├── motion.css
│   └── styles.css
└── vite.config.ts
```

## Trace 01 Flow

1. The participant enters the unidentified observation screen.
2. The participant investigates the circular glyph or nearby signals.
3. The hidden input channel is discovered.
4. The participant submits `4093`.
5. The app opens the `UNVERIFIED` dialog.
6. The participant inspects the dialog's computed style and finds an `NT-BIN/8` signal.
7. The decoded command is submitted.
8. The app issues a local Stage Receipt.

The first screen does not show a normal start button. The input channel can be discovered by glyph clicks, keyboard focus plus Enter, or starting numeric input.

## Stage Model

Defined in `src/domain/argTypes.ts`:

| Stage | Status |
| --- | --- |
| `ENTRY` | Implemented |
| `INPUT_DISCOVERED` | Implemented |
| `UNVERIFIED` | Implemented |
| `STYLE_CLUE_FOUND` | Implemented as an internal transition record |
| `VERIFIED` | Implemented |
| `RECEIPT_ISSUED` | Implemented |

Future chapters are documented in `docs/chapter-roadmap.md` only. They are not implemented as routes or fake UI.

Trace 02 is implemented as `#/trace/02` and uses its own state stages:

- `LOCKED`
- `ENTRY`
- `DOCUMENT_LOCATED`
- `OMITTED_RECORDS_FOUND`
- `ORDER_RESTORED`
- `VERIFIED`
- `RECEIPT_ISSUED`

## Session State

The app stores an anonymous local session using:

- `nulltrace-4093.session-id.v1`
- `nulltrace-4093.arg-state.v1`
- `nulltrace-4093.arg-state.v2`

Important `ArgSessionState` fields:

- `currentStage`
- `sessionId`
- `startedAt`
- `inputAttempts`
- `investigationFlags`
- `entryInteraction`
- `solvePath`
- `receipt`

`entryInteraction` includes:

- `inputDiscoveryMethod`
- `routeProfile`
- `unverifiedDialogViewed`
- `styleSignalSubmittedAt`
- `assistUsed`
- `assistLevel`
- `attempts`

Stored v1 sessions are migrated into v2 when no v2 state exists. The v1 key is preserved and not automatically deleted.

The v2 state separates:

- `traces.TRACE_01`
- `traces.TRACE_02`
- `receipts.TRACE_01`
- `receipts.TRACE_02`

Existing receipts are not rewritten automatically.

New-session reset does not delete the v1 key and does not delete the v2 key before migration. It overwrites v2 with a fresh default v2 state so preserved v1 data cannot resurrect after refresh.

If a local record is unreadable JSON, the app shows a recovery screen instead of silently overwriting it. The participant can download the unreadable source and must confirm before starting a new local session.

## Route Profiles

Internal route profile values remain compatible with existing localStorage:

| Internal value | User-facing meaning |
| --- | --- |
| `NORMAL_PATH` | Observation was confirmed before the accepted value |
| `FAST_PATH` | `INCOMPLETE_EVIDENCE` |

`FAST_PATH` is not a cheating claim. It only means the local game state does not contain enough in-interface evidence before the accepted value.

The app does not detect AI use, DevTools use, automation, external answer lookup, other tabs, keyboard shortcuts, browser extensions, IP address, or system identity.

## Stage Receipt

Receipt generation lives in `src/domain/receiptFactory.ts`.

Current receipt fields:

- `receiptId`
- `sessionId`
- `stage`
- `status`
- `issuedAt`
- `elapsedSeconds`
- `inputAttempts`
- `solvePath`
- `assistUsed`
- `evidence`
- `evidenceSummary`
- `checksum`

`evidenceSummary` is present on newly issued receipts and contains:

- `observationCount`
- `validationsCompleted`
- `assistLevel`
- `blindAttemptCount`
- `evidenceIds`

The checksum is generated by stable-stringifying the receipt payload without `checksum` and hashing it with SHA-256 through the Web Crypto API.

This is a `LOCAL PROOF`. It is not a server signature, identity proof, anti-cheat proof, or tamper-proof certificate.

Trace 02 receipts:

- use the `NT-02-` prefix
- live in `receipts.TRACE_02`
- do not overwrite `receipts.TRACE_01`
- reuse the same stable stringify and SHA-256 local checksum path
- record omitted DOM evidence IDs and assist level

## Persistence Layer

Persistence is separated behind `ArgRepository`:

- `src/storage/argRepository.ts`
- `src/storage/localStorageArgRepository.ts`

Future IndexedDB support should implement the same repository interface instead of changing game logic directly.

The current implementation still uses `localStorage`; IndexedDB is planned but not implemented.

## Routing

Routing is hash-based through `src/router/useHashRoute.ts`.

This is intentional for static hosting and GitHub Pages compatibility. Do not switch to `BrowserRouter` unless the deployment strategy is changed.

## Hidden Signals

All hidden clue strings are managed in `NT-BIN/8` format where practical.

Relevant files:

- `src/domain/argSignals.ts`
- `src/domain/binaryClues.ts`
- `src/domain/ntBin.ts`
- `docs/easter-eggs.md`

The computed-style clue is exposed through a CSS custom property on the `UNVERIFIED` dialog root. It must remain present in actual computed style, not only in source text.

Trace 02 hidden records are exposed through actual DOM element order:

- `#observation-archive`
- 7 record elements in the document
- 3 visible records
- 4 omitted records with `data-record-state="omitted"`
- runtime DOM Comment node describing the view/document mismatch

## Accessibility

Implemented accessibility considerations:

- keyboard-only input discovery path
- focusable observation glyph
- visible focus treatment
- `UNVERIFIED` dialog semantics
- connected dialog title and description
- Escape dialog close
- focus trap while the dialog is open
- outside click does not force-close the dialog
- reduced-motion media query support
- staged SMALL SIGNAL assist levels

Hint usage is recorded as evidence. It is not a failure condition.

## Deployment

GitHub Pages deployment is handled by:

```text
.github/workflows/deploy-pages.yml
```

Workflow behavior:

1. Runs on pushes to `main`
2. Can be manually triggered with `workflow_dispatch`
3. Installs dependencies with `npm install`
4. Runs `npm run build`
5. Uploads `dist` as a Pages artifact
6. Deploys through `actions/deploy-pages@v4`

`vite.config.ts` keeps deployment bases separate:

- development: `/`
- Vercel with `VERCEL=1`: `/`
- GitHub Pages production: `/NULLTRACE4093_FND/`

No `vercel.json` is required for the current static frontend.

## Privacy Policy For This Prototype

The frontend intentionally avoids:

- personal data collection
- browser fingerprinting
- DevTools-open detection
- AI-use detection
- extension detection
- IP collection
- account identity
- clipboard monitoring
- right-click blocking
- keyboard shortcut blocking
- system information collection

Evidence is limited to game interactions that happen inside the ARG interface.

## Design Direction

NULLTRACE should feel like an observation apparatus, not a hacker terminal.

Keep:

- near-black background
- low-saturation teal and off-white
- large negative space
- circular observation symbol
- missing values
- restrained motion
- state mismatch
- diff, evidence, and receipt language

Avoid:

- fake system errors
- random binary noise with no role
- neon terminal cliches
- direct Cicada-style imitation
- claims that the participant is selected, superior, or detected

## Roadmap Documents

- `docs/narrative-bible.md`
- `docs/chapter-roadmap.md`
- `docs/puzzle-fairness.md`
- `docs/easter-eggs.md`

These documents distinguish current implementation from long-term design plans.

## Backend Repository

Frontend repository:

```text
rhazns22/NULLTRACE4093_FND
```

Backend repository:

```text
rhazns22/NULLTRACE4093_BND
```

The current frontend does not call the backend.
