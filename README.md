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

- Stage 1 vertical slice
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
- GitHub Pages and Vercel base-path split

Planned, not implemented:

- Service Worker
- IndexedDB persistence
- backend verification API
- server-signed receipts
- per-session server seeds
- public receipt verification page
- chapters 02-10 as playable routes
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

## Stage 1 Flow

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

## Session State

The app stores an anonymous local session using:

- `nulltrace-4093.session-id.v1`
- `nulltrace-4093.arg-state.v1`

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

Stored v1 sessions are normalized on load with safe default values for newly added fields. Existing receipts are not rewritten automatically.

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

## Persistence Layer

Persistence is separated behind `ArgRepository`:

- `src/storage/argRepository.ts`
- `src/storage/localStorageArgRepository.ts`

Future IndexedDB support should implement the same repository interface instead of changing game logic directly.

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
