# Tutorial, navigation and online pass — 2026-10-30

Restore base: source commit c323310f7b01b2f63258e94554f6fcc2d0f2bd13, saved/published version 92. Existing art and match-end presentation retained.

## Tutorial

Setup selects court end and lesson. Start immediately enters an on-court demonstration. A compact coach stays visible; TRY IT restarts the same feed for the learner, WATCH AGAIN replays the real physics example. A valid execution advances to the next on-court demo. Demonstrations cannot save completion or grant rewards. Existing progress IDs remain stable; slice, topspin and finisher are appended to storage and inserted in the learning order.

All 17 demonstrations use real feeds/contact/physics and mirror on both ends. The gesture illustration grows from the contact point and uses the power color. Slice/topspin lessons require actual gesture spin. Overhead lessons teach sliced bandeja and topspin víbora. The finisher lesson starts with five charges so the learner can practice the perfect release immediately.

Space and L no longer shoot. Mouse, touch HIT/LOB controls and controller buttons remain. Demonstrations leave the mouse free to select TRY IT; controller A/B can navigate coaching controls. The existing controller shot system still uses stick aim and timed charge; curved-spin lessons are designed for pointer/touch gestures.

## Navigation and identity

Back buttons and Escape share actual previous-screen history, preserving collection focus and bracket view. Practice Back resumes the court; the explicit Training Menu exits the session. Online entry Back returns to its caller. Entered online names appear on human cards, position labels, lobby status, court and scoreboard; character names are secondary on lobby cards. Guest position selection is enabled while character/difficulty editing remains host-owned.

## Rendering and transport

Canvas backing dimensions react to ResizeObserver and are checked before drawing; hidden zero-size layouts are ignored. Uniform court scaling and DPR sizing are preserved through menu/match transitions.

Snapshots reference roster artwork by ID and hydrate through the shared character resolver. Host broadcasts serialize each snapshot once. Guest inputs send at 60 Hz, snapshots remain 30 Hz, and congested channels still drop old frames. Direct ping/pong RTT is used for prediction instead of the HTTP relay RTT. Relay remains available without protocol/database migration.

## Validation

Full npm test suite, including real-feed lessons on both ends, spin requirements, demo progress isolation, Space removal, navigation history, safe online name rendering, guest slot selection, zero/fractional canvas sizes, compact snapshot hydration, direct ping/pong and backpressure.

Browser QA: movement/slice demonstrations, tutorial menu return, training match startup, two-player local relay room, named host/guest cards, guest team change and readiness, guest match startup with named scoreboard and correct court proportions. No real remote-device/WAN latency benchmark was performed. STUN-only direct connectivity still depends on the players' network; restrictive NAT may require the existing HTTP relay.
