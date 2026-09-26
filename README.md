# NULLTRACE 4093 Frontend

NULLTRACE 4093 is a browser-only vertical prototype for a short mystery ARG experience.
The frontend presents an unidentified observation device, hides clues in interaction records and computed CSS, and issues a local Stage Receipt after the participant completes the first verification path.

## Project Status

- Prototype scope: Stage 1 vertical slice
- Runtime: local browser only
- Server API: not implemented
- Account system: not implemented
- Service Worker: not implemented
- IndexedDB: not implemented
- Current persistence: `localStorage`
- Receipt proof label: `LOCAL PROOF`

This project intentionally does not collect browser fingerprints, personal data, DevTools state, AI usage signals, or system-level telemetry. Route classification only uses interactions that happen inside the ARG interface.

## Tech Stack

- Vite
- React
- TypeScript
- CSS modules are not used; styling is centralized in `src/styles.css`
- No external UI framework
- Web Crypto API for UUID generation and SHA-256 receipt checksums
- GitHub Actions + GitHub Pages for static deployment

## Requirements

- Node.js 22 is recommended, matching the GitHub Actions workflow
- npm
- A modern browser with:
  - `crypto.randomUUID()`
  - `crypto.subtle.digest()`
  - `localStorage`

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

The Vite dev server binds to:

```text
http://127.0.0.1:5173/
```

Create a production build:

```bash
npm run build
```

Run TypeScript checks only:

```bash
npm run typecheck
```

Preview the production build locally:

```bash
npm run preview
```

## Available Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Starts the local Vite development server on `127.0.0.1` |
| `npm run build` | Runs `tsc --noEmit` and creates the production bundle with Vite |
| `npm run typecheck` | Runs TypeScript validation without emitting files |
| `npm run preview` | Serves the built `dist` output locally |

## Repository Layout

```text
.
├── .github/workflows/deploy-pages.yml
├── docs/easter-eggs.md
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
└── src
    ├── App.tsx
    ├── main.tsx
    ├── styles.css
    ├── components
    │   ├── BinaryField.tsx
    │   ├── CustomCursor.tsx
    │   ├── ObservationGlyph.tsx
    │   ├── ReceiptCard.tsx
    │   ├── RevealItem.tsx
    │   ├── StageTimeline.tsx
    │   └── UnverifiedModal.tsx
    ├── domain
    │   ├── argFlow.ts
    │   ├── argSignals.ts
    │   ├── argTypes.ts
    │   ├── binaryClues.ts
    │   ├── ntBin.ts
    │   └── receiptFactory.ts
    ├── hooks
    │   └── useArgSession.ts
    ├── router
    │   └── useHashRoute.ts
    └── storage
        ├── argRepository.ts
        └── localStorageArgRepository.ts
```

## User Flow

The Stage 1 prototype follows this intended flow:

1. Participant enters the unidentified first screen.
2. Participant investigates the circular observation symbol or nearby signals.
3. Participant discovers the concealed input channel.
4. Participant submits the four-digit entry sequence.
5. The `UNVERIFIED` dialog appears.
6. Participant investigates the dialog and finds a computed CSS custom property signal.
7. Participant submits the decoded verification command.
8. The app issues a personal Stage Receipt.

The interface avoids a normal start button. The input channel can be discovered by:

- clicking the observation glyph enough times
- focusing the glyph and pressing Enter
- starting numeric keyboard input

Keyboard-only progression is supported.

## Stage Model

The stage list is defined in `src/domain/argTypes.ts`.

| Stage | Meaning |
| --- | --- |
| `ENTRY` | Initial observation screen |
| `INPUT_DISCOVERED` | Concealed input channel has been exposed |
| `UNVERIFIED` | Entry code was accepted, but the route is not fully verified |
| `STYLE_CLUE_FOUND` | Computed style clue was solved |
| `VERIFIED` | Stage verification is complete and ready to issue receipt |
| `RECEIPT_ISSUED` | Stage Receipt has been generated and persisted |

## Session State

The primary session state shape is `ArgSessionState`.

Important fields:

- `currentStage`: current ARG stage
- `sessionId`: anonymous browser session UUID
- `startedAt`: ISO timestamp for session start
- `inputAttempts`: count of submitted entry attempts
- `investigationFlags`: game interaction flags
- `entryInteraction`: input discovery, dialog, route, and assist metadata
- `solvePath`: chronological list of stage actions
- `receipt`: generated Stage Receipt, or `null`

The anonymous session ID is created with `crypto.randomUUID()` and stored in `localStorage`.

Storage keys:

- `nulltrace-4093.session-id.v1`
- `nulltrace-4093.arg-state.v1`

## Route Profiles

The app currently distinguishes two route profiles after the entry sequence is accepted:

| Profile | Description |
| --- | --- |
| `NORMAL_PATH` | Participant investigated the observation device or nearby signals, used a normal discovery interaction, and stayed on the entry screen long enough |
| `FAST_PATH` | Participant submitted the entry sequence without enough in-interface investigation history |

`FAST_PATH` is not blocked. It changes the `UNVERIFIED` copy and is recorded in the receipt path. The app does not claim that the participant used DevTools, automation, AI, or any external tool.

## Interaction and Motion Design

The first screen is designed to feel like an unidentified observation device rather than a conventional UI.

Core visual rules:

- near-black background
- low-contrast teal and off-white
- restrained motion, no heavy neon styling
- large negative space
- central circular symbol
- faint binary field managed as structured data
- no fake terminal panels
- no system-error-like warnings

The circular symbol uses prime-number structure:

- outer orbit: 17 nodes
- middle orbit: 13 nodes
- inner orbit: 7 nodes
- one node intentionally missing per orbit
- orbit cycle: 4093ms

`prefers-reduced-motion` is supported. When reduced motion is enabled, rotation stops and static clue affordances remain available.

## Hidden Signals

All hidden clue strings are managed in `NT-BIN/8` format where practical.

Relevant files:

- `src/domain/argSignals.ts`: computed-style signal, console signal, small signals
- `src/domain/binaryClues.ts`: faint background binary clues
- `src/domain/ntBin.ts`: NT-BIN/8 decoding helpers
- `docs/easter-eggs.md`: development-only notes about hidden interactions and discovery conditions

The computed-style clue is exposed through a CSS custom property on the `UNVERIFIED` dialog root. It must remain present in actual computed style, not only in source text.

## Accessibility

Implemented accessibility considerations:

- keyboard-only input discovery path
- focusable observation glyph
- visible focus treatment
- `UNVERIFIED` dialog uses dialog semantics
- dialog title and description are connected for screen readers
- Escape can close the dialog
- focus trap is applied while the dialog is open
- outside click does not force-close the dialog
- reduced-motion media query support
- delayed assistive hints for participants who cannot use DevTools comfortably

Assistive hint usage is recorded as `assistUsed: true` in the Stage Receipt.

## Stage Receipt

Receipt generation is implemented in `src/domain/receiptFactory.ts`.

Receipt fields:

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
- `checksum`

Receipt IDs use the `NT-01-` prefix and a browser-generated UUID.

The checksum is generated by:

1. removing the `checksum` field from the receipt payload
2. stable-stringifying the remaining payload with sorted object keys
3. hashing the stable string with Web Crypto API SHA-256

The checksum is a local integrity marker only. It is not a server signature and must not be described as cryptographic identity verification.

Receipt UI features:

- printable ticket-style record
- JSON view
- JSON download
- clipboard copy
- persisted receipt recovery after reconnect
- new-session flow with confirmation

## Persistence Layer

Persistence is intentionally separated behind `ArgRepository`.

Current implementation:

- `src/storage/argRepository.ts`: storage interface
- `src/storage/localStorageArgRepository.ts`: `localStorage` implementation

This keeps the app ready for future persistence upgrades.

Future IndexedDB integration should replace or extend `LocalStorageArgRepository` while preserving the `ArgRepository` interface.

## Routing

Routing is intentionally minimal and hash-based.

Relevant file:

- `src/router/useHashRoute.ts`

This keeps the static GitHub Pages deployment simple and avoids server-side fallback requirements.

## Deployment

GitHub Pages deployment is defined in:

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

The Vite production base path is configured for GitHub Pages:

```ts
base: process.env.NODE_ENV === "production" ? "/NULLTRACE4093_FND/" : "/"
```

Deployed URL:

```text
https://rhazns22.github.io/NULLTRACE4093_FND/
```

## Security and Privacy Notes

This frontend does not implement authentication or trusted verification.

Do not treat the local Stage Receipt as:

- identity proof
- anti-cheat proof
- server-backed verification
- tamper-proof certification

The prototype intentionally avoids:

- collecting personal information
- browser fingerprinting
- DevTools-open detection
- right-click blocking
- keyboard shortcut blocking
- AI-use detection
- server calls

## Future Extension Points

Recommended expansion points:

- Service Worker: add offline shell caching and asset preloading around the Vite build output
- IndexedDB: implement a new repository using `ArgRepository`
- Server receipt signing: replace local checksum-only proof with a backend signing flow
- Multi-stage ARG: expand `ARG_STAGES`, `StageReceipt.stage`, and route handling
- Backend audit endpoint: submit non-personal game evidence only after explicit design review
- Asset pipeline: add generated or curated visual/audio assets without changing the state model

## Development Checklist

Before deploying changes:

```bash
npm run typecheck
npm run build
```

Recommended manual checks:

- first-screen layout at mobile width around 360px
- first-screen layout at 1366x768 and 1920x1080
- keyboard-only discovery and submission
- reduced-motion behavior
- `UNVERIFIED` dialog focus trap and Escape handling
- computed CSS custom property presence via `getComputedStyle()`
- receipt JSON download
- receipt copy to clipboard
- session recovery after refresh
- new-session reset flow

## Backend Repository

Backend work is intentionally separate from this frontend.

Frontend repository:

```text
rhazns22/NULLTRACE4093_FND
```

Backend repository:

```text
rhazns22/NULLTRACE4093_BND
```

At the current prototype stage, the frontend does not call the backend.
