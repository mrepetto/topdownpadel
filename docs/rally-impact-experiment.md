# Rally speed and contact feedback experiment — 31 October 2026

Restore point: version 100, commit 15d1ff668e9b57ef876b2817cacad7acf31a4455. Preserves the mode-bound journeys and other intervening menu work.

Rally multiplier now increases linearly by 0.04 each hit, from 1× to 3× at 50, capped thereafter. Multiplies the existing mode/speed/shot pace, not stored velocities; serve resets rally heat. HUD shows the rally count and filling pace bar, without a numeric multiplier. Five-hit milestones pulse and play the existing audio cue. Fast flight uses substeps to preserve net, floor and enclosure collision checks.

Removed the expanding circular hit ripple. Ground and wall bounce indicators remain. Racket contact now generates a directional star and short colored sparks; perfect shots have a larger burst, white core, stronger camera impulse and slightly longer readable text. Shake respects reduced-motion preference and does not affect simulation RNG. Existing shot audio and perfect chime retained.

Contact assist is an original prototype, not a verified recreation of Tennis Clash internals. A human already within racket reach gets a single 220 ms Casual / 140 ms Competitive window per incoming shot, with ball pace at 18%, easing back over the final 60 ms. No automatic strike, no repeated waiting, no rescue across the court, no illegal serve volley or unreachable lob assist. A released pending shot is resolved normally. Hit clears the temporary state. Host owns the timing and ball fields travel in snapshots; menus pause simulation as before.

Research: official Tennis Clash shot guide describes swipe speed and timing, and movement guide confirms automatic positioning constrained by stats. Official support attributes ball freezes/slowdowns to network latency; it does not confirm a deliberate exact slowdown algorithm. Community interpretations vary, so no timing values were claimed as Tennis Clash facts.
- https://tennisclash.zendesk.com/hc/en-gb/articles/12709842502929-How-do-I-hit-the-ball-with-different-intensities-and-styles
- https://tennisclash.zendesk.com/hc/en-gb/articles/12709828337297-How-do-I-move-on-the-court
- https://tennisclash.zendesk.com/hc/en-gb/articles/12709702919057-The-ball-is-moving-too-slow-freezing

Validation: full automated suite including per-hit progression/cap/reset, reachable one-use assist, expiry, hit cleanup, illegal/unreachable cases, 3× point resolution, bounded shake and absence of contact rings. Final balance, especially 3× rallies, remains intentionally experimental.

## Intent-gated refinement — 31 October 2026
Contact slowdown now requires an active local charge/gesture or that receiving remote player's netCharge. A press starting the gesture qualifies; passive racket proximity does not consume the one-use window, so letting a ball through for a wall return stays smooth. Cancelling ends any active assist with its existing 60 ms ease-out. A successful hit clears the assist owner as well as timing. Tests cover passive pass-through, later wall-return gesture, cancellation, no rearming, and independent guest/host gesture state. Full suite passes. Restore point: v101 / 5635a4706c2a6b051c8c1c863f093781bb17959f.
