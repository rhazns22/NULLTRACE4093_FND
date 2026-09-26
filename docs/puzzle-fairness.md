# NULLTRACE Puzzle Fairness Rules

Every NULLTRACE puzzle must be solvable by verification, not by blind guessing.

## Required Puzzle Parts

Each puzzle needs four parts.

1. Entry Signal

   Indicates what should be inspected.

2. Method Signal

   Indicates what kind of decoding, inspection, or tool category is relevant.

3. Output Contract

   Indicates answer format, length, character set, prefix, grammar, or response shape.

4. Verification

   Confirms the result through checksum, syntax, prefix, next reaction, or reproducible state change.

## Rules

- Do not require unlimited URL guessing.
- Do not require unsupported cipher guessing.
- Do not keep answer format completely unknown for a long period.
- If an external tool is needed, hint at the tool category.
- Accessibility alternatives should not become a direct answer dump.
- One chapter should introduce only one core new technical skill.
- Use at most two auxiliary clues per chapter.
- Do not place pure random data as if it were real evidence.
- Do not punish participants for being fast.
- Do not treat hint use as failure.
- Do not describe the outcome as a general intelligence score.

## SMALL SIGNAL Levels

`assistLevel 0`: no hint used.

`assistLevel 1`: observation direction.

Example:

```text
THE VALUE IS NOT PRESENTED.
IT IS COMPUTED.
```

`assistLevel 2`: concept or location.

Example:

```text
INSPECT THE PROPERTY
AFTER RENDERING.
```

`assistLevel 3`: tool or procedure.

Example:

```text
getComputedStyle()
```

Hints may become available after:

- active idle time inside the relevant stage
- repeated unresolved input
- rejected validation attempts
- direct participant request
- keyboard or screen-reader alternative needs

They should not be based only on page-open time when a better in-game signal exists.

Hint usage must be recorded as evidence, not as a penalty.

## Decoy Rules

Decoys are allowed only when they can be invalidated.

A decoy must:

- be confirmable as invalid within 10-15 minutes
- have narrative purpose later
- produce evidence when the participant proves it is invalid

Example:

```text
SIGNAL ENTROPY // 7.999
STRUCTURE // NONE
ORIGIN // SYNTHETIC
STATUS // DECOY CONFIRMED
```

## Accessibility Alternatives

Accessibility routes must preserve the puzzle's verification idea.

Allowed:

- alternate phrasing of the Entry Signal
- keyboard-only access to the same interaction
- screen-reader labels for hidden controls
- delayed Method Signal hints
- procedure-level hint after repeated blockers

Avoid:

- immediate answer disclosure
- bypassing the chapter's core verification action
- implying that assist use invalidates the receipt

## Stage 1 Audit

Current Stage 1 coverage:

| Fairness part | Implementation |
| --- | --- |
| Entry Signal | missing nodes, binary field, glyph affordance |
| Method Signal | `UNVERIFIED` dialog, CSSOM copy, SMALL SIGNAL levels |
| Output Contract | four-digit entry input, text signal input, command-length limit |
| Verification | computed CSS custom property, accepted command, local receipt |

Remaining risk:

- `4093` can still be submitted quickly without observing the glyph. This is allowed but recorded as `INCOMPLETE_EVIDENCE`.
- The computed-style clue requires browser inspection skill. SMALL SIGNAL levels reduce this barrier without claiming server-grade proof.

## Chapter 02 Audit

Current Chapter 02 coverage:

| Fairness part | Implementation |
| --- | --- |
| Entry Signal | `DISPLAYED ENTRIES // 03` and `DOCUMENT ENTRIES // 07` on `#observation-archive` |
| Method Signal | runtime DOM Comment plus document/archive count mismatch |
| Output Contract | record evidence requires 4 IDs; command format is 4 words, case-insensitive, space-separated |
| Verification | omitted record IDs must exist, be unique, be omitted records, and restore the command in `data-sequence` order |

Chapter 02 assist:

- Level 1: `THE VIEW IS NOT / THE DOCUMENT.`
- Level 2: `COUNT THE CHILDREN. / NOT THE PIXELS.`
- Level 3: `#observation-archive`, `[data-record-state="omitted"]`, `data-sequence`

Accessibility alternative:

- Assist Level 3 exposes a document transcript table.
- The transcript lists element type, record ID, state, sequence, and fragment.
- The transcript does not assemble the final command automatically.

Remaining risk:

- Hidden DOM inspection is still a source-level skill. The transcript path exists for keyboard and screen-reader users who cannot comfortably inspect browser developer tooling.
