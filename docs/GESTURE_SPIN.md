# Gesture spin prototype — 29 October 2026

Restore point: saved version 88, commit 0a2db8748d3083818daef2d5a72d5cb61f6c589a. Local tag: restore-v88-before-gesture-spin.

- Mouse cursor defaults hidden in play; the settings toggle is local and persistent. Menus retain a cursor. The racket-anchored gesture ribbon remains visible.
- A U / lower arc creates slice; an upper arc creates topspin. Start-to-end chord aims curved shots, avoiding a terminal-tangent sideways shot. Straight strokes keep existing aiming and power. Curvature is measured relative to the chord, independent of swipe direction, translation and sampling speed. For exactly vertical strokes the rightward bulge is the slice convention. Tiny wobble, loops and mixed S curves are ignored.
- Curve depth determines strength 0–1. Power scales its impact. Flight gravity varies at most 16%; vertical launch at most 10%; glass retention at most 22%; floor rebound at most 10%. Intended landing point is retained analytically. Both prediction and live simulation use the same spin properties.
- Curved overheads below red choose bandeja (slice) or víbora (topspin). Red remains smash. Sliced smashes lose up to 18% pace and 20% bounce. No automatic winner is granted. Neutral overheads preserve existing color-based classification.
- Regular shot feedback includes straight/sliced/topspin, localized to EN/ES. Named overheads and existing finisher feedback are retained. AI/controller strokes stay neutral in this first experiment. Underarm serves stay neutral.
- Multiplayer relay and direct host validation carry a clamped spin scalar; snapshots carry flight state. No raw gesture points are sent.

QA covers reversed U/upper arcs, wobble rejection, strength, curved release direction, landing preservation, wall response, overhead selection, sliced-smash penalty, cursor default and multiplayer spin validation. Full existing tutorials and gameplay tests are retained.

## Sensitivity and feedback follow-up
Shallow arcs now register at about one-third the former threshold (normalized curve ~0.018 instead of ~0.054); three-point strokes and shorter gestures are accepted. Tiny wobble, mixed S curves and loops remain filtered. Spin still scales continuously with curve depth and power. Shot labels last 1.1 seconds with a 0.45-second fade. Charged ON FIRE remains persistent, with a small procedural flame beside the localized label; no player aura or charge bar is restored.
