# NULLTRACE / Observation Archive

The interface uses the visual language of an optical observation record:
near-black ground, off-white typography, desaturated green instruments, and
a restrained clay accent for an unverified record.

## Presentation

- Large project typography and a full-width observation field.
- Procedural vector calibration marks around the original three puzzle orbits.
- Short contact rings and eased pointer displacement on the central instrument.
- Staggered entrance of the heading, field, and interaction surfaces.
- A thin verification panel with a focus-discovered signal input.
- An off-white receipt with an expandable solve path and a checksum-derived
  visual strip. The strip is decorative, not a scannable barcode.
- System fonts and local assets; no font CDN, image CDN, or external service.
- Lucide icons for actionable controls, with accessible names and native titles.

## Puzzle Invariants

The motion layer in `src/motion.css` adds drawn calibration lines, an independent
outer scan arc, contact and stage-acquisition waves, a four-digit input meter,
and staggered receipt development. These effects are presentation-only. Motion
is disabled for reduced-motion preferences and printing; contact effects clean
themselves up on animation completion. Preference changes take effect live.

The entry code, command, orbit node counts, omitted slots, seven-click discovery,
keyboard discovery, 4093 ms orbit cycle, path classification, timed hints,
session storage keys, stage transitions, and binary clue data are unchanged.

The modal retains its arbitrary root class and computed custom property.
Keyboard shortcuts with Ctrl, Alt, or Meta pass through. While open, the modal
traps focus, makes background controls inert, and locks background scrolling.

Reduced-motion mode removes all decorative animations and pointer displacement,
and retains the existing static alternative clue. The native cursor remains
available on every device.

## Receipt Integrity

Receipt serialization now omits optional undefined object fields before hashing,
matching JSON persistence. Newly issued checksums can therefore be recomputed
from downloaded or restored JSON. Previously issued receipts remain unchanged.
The receipt remains a LOCAL PROOF, not a server signature.

## Verification

Run the application and production checks:

```sh
npm install
npm run dev
npm run typecheck
npm run build
```

Run browser tests using Playwright's Chromium:

```sh
npx playwright install chromium
npm run test:e2e
```

Or use an installed Microsoft Edge on Windows:

```powershell
$env:PLAYWRIGHT_CHANNEL = 'msedge'
npm run test:e2e
```

The suite covers normal and fast routes, keyboard-only reduced-motion use,
the timed accessibility alternative, computed-style decoding, receipt integrity,
JSON download/copy, session restoration, new-session confirmation, unique
receipts, and 360 / 1366 / 1920 px layouts. Hint delays use a virtual clock.

Screenshots are generated under `artifacts/design`; failure traces are saved
under `artifacts/test-results`. Both are ignored by Git.
