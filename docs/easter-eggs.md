# NULLTRACE 4093 Easter Egg Notes

This document is for development reference only. Do not surface it in the participant-facing UI.

## Prime Pattern

- Circular observation glyph:
  - outer orbit: 17 slots with slot 13 omitted
  - middle orbit: 13 slots with slot 7 omitted
  - inner orbit: 7 slots with slot 3 omitted
- Orbit animation duration: 4093ms.
- Entry discovery by glyph click now resolves after 7 clicks.
- Small signal timer polling uses a 13 second interval.
- The favicon SVG uses a 23 by 23 viewport with a 7 radius ring.
- Layout spacing includes 13px and 23px gaps in the apparatus/readout/modal surfaces.

## HTML Comments

`index.html` contains three NT-BIN/8 comments. They are worldbuilding sentences, not direct answers.

- Comment 1: `THE OBSERVATORY STORED ONLY GAPS.`
- Comment 2: `A TRACE IS NOT A PERSON.`
- Comment 3: `THE RECEIPT REMEMBERS THE ROUTE, NOT THE HAND.`

## Console Signal

Location: [src/main.tsx](../src/main.tsx)

Discovery condition: first page load in a browser profile where `nulltrace-4093.console-signal.v1` has not been set.

Behavior: prints one short decoded message from an NT-BIN/8 constant, then records the localStorage flag so it does not repeat.

## Document Metadata

Location: [src/App.tsx](../src/App.tsx)

Discovery condition: progress through stages.

- `ENTRY`: base title.
- `INPUT_DISCOVERED`: title suffix `0111`.
- `UNVERIFIED`: title suffix `1101`.
- `STYLE_CLUE_FOUND`: title suffix `10001`.
- `VERIFIED`: title suffix `10111`.
- `RECEIPT_ISSUED`: title suffix `LOCAL PROOF`.

The favicon is a tiny generated SVG data URI. Its color and crossbar length shift by stage.

## Rejection Copy

Location: [src/hooks/useArgSession.ts](../src/hooks/useArgSession.ts)

Discovery condition: submit an incorrect four-digit code. When the total wrong/accepted attempt counter lands on a prime number, rejection text uses a prime-specific variant. It does not say whether the submitted value is close or correct.

## Small Signal

Location: [src/domain/argSignals.ts](../src/domain/argSignals.ts), rendered by [src/App.tsx](../src/App.tsx) and [src/components/UnverifiedModal.tsx](../src/components/UnverifiedModal.tsx)

All small-signal strings are stored as NT-BIN/8 and decoded at render time.

- Entry screen after 5 minutes: indirect hint toward omitted points in the circular glyph.
- After accepted `4093`, 4 minutes in `UNVERIFIED`: hint toward verification state rather than result.
- After accepted `4093`, 5 minutes in `UNVERIFIED`: hint toward visible style vs computed style.
- Total session time after 12 minutes in `UNVERIFIED`: modal exposes the accessibility alternate trace as NT-BIN/8 groups. Pressing it records `assistUsed: true` for receipt generation.

## CSS Computed Style Clue

Location: [src/styles.css](../src/styles.css)

Discovery condition: inspect the UNVERIFIED dialog root element and read the computed custom property `--nt-signal`.

The custom property remains in computed style and is encoded as NT-BIN/8 groups. The participant-facing UI does not name the property.

## Privacy Boundaries

The prototype does not detect DevTools, does not collect browser fingerprints, does not block context menus or shortcuts, and does not classify a participant as using automation or AI. Receipt evidence is limited to in-game interaction records.
