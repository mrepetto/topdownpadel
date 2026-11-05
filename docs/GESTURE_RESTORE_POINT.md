# Gesture trail experiment / restore point

Before this visual experiment: published Sites version 78, source commit
`7326b2488d6ec0eab525947d976f3bff5a46d61b`.
Local Git tag: `restore-v78-screen-space-gesture`.
A complete tracked-source ZIP was also exported before editing:
`Top-Down-Padel-v78-before-racket-trail.zip`.

The experiment translates the existing ribbon to the racket while dragging,
freezes it on release, then anchors it to the actual impact when a hit succeeds.
Curve, taper, color, screen-pixel dimensions and fade are preserved. Pointer
sampling, sensitivity, power, shot aim and physics are unchanged. The subtle
mouse cursor remains at the real input location. Guest clients reuse existing
impact snapshots without additional network traffic.

For a full rollback, publish saved version 78. To keep later unrelated work,
revert this experiment's commit instead of resetting the repository.
