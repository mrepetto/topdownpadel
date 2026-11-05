# Training centre implementation

Three modes: guided tutorial, unlimited solo ball machine, existing four-player training match.
The tutorial has 14 replayable lessons, one correct execution to advance, per-lesson local completion persistence, mirrored court ends, contextual corrections and no random dispersion. Free practice offers six feed patterns and three intervals; the next feed follows the previous ball's resolution. Player movement is retained between free-practice balls. No points, coins, career changes or heat progression occur in machine practice.

Integration: practice.js owns a separate session tick and menu. It reuses movement constraints, racket contact, hit planning, manual serve and ball physics. Minimal guarded callbacks intercept point/fault outcomes, legal floor bounces and actual racket contacts. Normal newMatch clears practice; returning to menu preserves career state. No multiplayer practice mode is added. Shot prompts adapt to connected controller; current touch HIT/LOB controls remain available, future one/two-finger scheme is not claimed implemented.

Validation: tests/practice.cjs simulates real machine feeds and every shot lesson on both ends, including wall identity, reachable contacts, legal returns, manual service boxes, score isolation, persistence, pause/resume and normal match restoration. Existing full suite covers multiplayer/career regressions. Physical mobile/gamepad hardware testing remains external.

## Machine usability pass
- Incoming feeds now carry an isolated simulation speed: 40% for early tutorial lessons, 52% for later lessons, and 45/65/85% for relaxed/normal/fast free practice. Match speed and lob multipliers cannot override these teaching speeds; real player returns immediately restore normal physics.
- A 1.25-second setup pause and 2.2-second tutorial retry interval leave time to prepare. Post-miss coast uses the incoming speed too.
- First and second floor markers are predicted once per launch using the collision solver (including walls), rather than re-simulated at render frequency. HUD text/style updates only write when changed.
- Machine has a fixed wheeled chassis, ball hopper, rotating feeder, muzzle launch origin and recoil. Side-glass feeds now originate from the visible machine position; mixed feeds use the same selected pattern for placement and trajectory.
- Regression tests measure 1.84 seconds to the first beginner bounce after the test observation, 2.49 seconds between bounces, and 0.92 seconds of racket contact opportunity on either end. All shot lessons retain real-contact completion tests.
