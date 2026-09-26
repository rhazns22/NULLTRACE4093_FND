# NULLTRACE 4093 Chapter Roadmap

This document is a design roadmap. Only Chapter 01 is currently implemented.

The UI must not show `Chapter 1/10` during the early experience. Use language such as:

```text
TRACE // 01
KNOWN SIGNALS // 1
TOTAL SIGNALS // UNDISCLOSED
STATUS // UNVERIFIED
```

The existence of ten observations should be hinted around Chapters 03-04:

```text
TEN OBSERVATIONS WERE RECORDED.
YOU HAVE SEEN ONLY ONE.
```

## Roadmap

| Chapter | Implementation | Core technique | Evaluation focus | Narrative discovery | Difficulty | Expected time |
| --- | --- | --- | --- | --- | --- | --- |
| 01 | Implemented | Computed CSS | observation | visible value and computed value differ | easy | 15 minutes |
| 02 | Planned | hidden DOM and HTML comments | source understanding | removed elements preserve records | normal | TBD |
| 03 | Planned | image metadata and steganography | data inspection | the first previous witness is found | hard | TBD |
| 04 | Planned | public-domain US fiction book cipher | source checking and coordinate verification | the record was not left by one person | easy | TBD |
| 05 | Planned | Service Worker and Cache Storage | browser runtime understanding | live screen and cached past screen differ | hard | TBD |
| 06 | Planned | IndexedDB | state recovery | records remain that the participant does not remember | normal | TBD |
| 07 | Planned | API, ETag, and response headers | data flow understanding | server and client records conflict | extreme | TBD |
| 08 | Planned | personal session evidence | reproduction and debugging | participant behavior changes the next clue | easy | TBD |
| 09 | Planned | previous Stage Receipt recombination | synthesis | 4093 is an observation mismatch status | extreme | TBD |
| 10 | Planned | full evidence verification and choice | technical judgment | participant chooses which record remains true | normal | TBD |

## Chapter 01 Current Behavior

Implemented:

- initial unidentified observation screen
- circular glyph investigation
- hidden input channel
- `4093` entry
- `UNVERIFIED` dialog
- computed style clue via `--nt-signal`
- `VERIFY SIGNAL` command
- local Stage Receipt
- evidence summary for new receipts

Not implemented in Chapter 01:

- server validation
- server signing
- backend state comparison
- public verification page

## Pacing Notes

Target total for `NULL ENDING`: 40-93 hours.

Intermediate endings:

| Ending | Expected time | Purpose |
| --- | ---: | --- |
| `SURFACE ENDING` | 12-18 hours | surface event conclusion |
| `VERIFIED ENDING` | 25-40 hours | 4093 meaning confirmed |
| `NULL ENDING` | 40-93 hours | full receipt and deleted-record recovery |

Recommended difficulty curve:

```text
01 easy
02 normal
03 hard
04 easy
05 hard
06 normal
07 extreme
08 easy
09 extreme
10 normal
```

Extreme chapters must be followed by a concrete narrative reward or a simpler progression segment.
