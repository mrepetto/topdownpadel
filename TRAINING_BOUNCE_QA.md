# Training bounce QA — 2026-10-29

Training and matches share the same floor-marker renderer and collision-based prediction. Incoming practice balls show localized First Bounce / Second Bounce labels. Targets refresh at a bounded rate and immediately after floor/glass contact; markers disappear on return, retry, pause, completion and exit. Training returns no longer invoke the generic match marker.

Root cause of missing wall-feed second markers: the .75/.7-power feeds rebounded into the net before bounce two. Both glass feeds now use .3 power; side glass still includes back + side wall contacts and both land again on the receiving half.

QA: all five feed families × both ends × three pace settings produce two predicted floor bounces, within 4 court units of the real simulation. All tutorial shot completions pass on both ends. Pause/resume, hit/retry/exit cleanup and the complete npm test suite pass. Browser inspection confirmed the numbered rings and readable labels near the glass.
