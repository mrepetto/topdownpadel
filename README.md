# PADELMASTER

Canvas doubles padel game with a Worker room service. Serve with `sites-preview start /workspace/sites/padelmaster`.

## Controls
WASD/arrows move. The mouse selects the intended landing point. Hold Mouse 1/Space for a drive or Mouse 2/L for a lob; release to hit. Shift dashes. High contact at 90–205 world units and at least 68% drive power triggers a smash. Height scale: 50 world units per metre.

## Match flow
Automatic underarm serves alternate service boxes and rotate ALBERT, CESAR, KIKE, YOU. Service bounces, first/second attempts, service-box faults, fence faults, return-before-bounce faults, and net-cord lets feed into the ordinary point state. Every completed point freezes on a result card for 4 seconds (5 for a game, 6 for a set), then serves automatically; match completion offers PLAY AGAIN. Games use golden point, sets use a 6–6 tiebreak to 7 win-by-two, matches are best of three. Tiebreak service follows one serve then two per player. Golden-point receiver choice is adjustable in AI LEVELS.

Rally AI retains named quadrants. Serving stances temporarily alternate lanes. The camera keeps the human team left: physical end changes and outside recovery are not simulated. Legal enclosure exits immediately score; direct exits lose the point. Court dimensions/heights are approximated for arcade scale: back 4 m, central side 3 m, end side sections 4 m, glass/fence distinction for collisions and serves.

## AI tuning
`LEVELS` sets speed, reaction delay, base mistake chance, and typical power. CESAR and rival levels are independently selectable. AI samples four landing depths and both lateral lanes with anti-repeat receiver balancing. Lob and overhead choices create rally variety. AI contacted shots receive one error roll (never a per-frame roll). Human shots use the cursor-centered dispersion disk; power increases its radius. Errors alter trajectories; point awards follow collisions rather than an arbitrary score timer.

Smashes are downward high-contact trajectories. Ordinary smashes retain modest bounce energy; the high kick needed for x3/x4 requires 88% power, height >= 2.7 m and contact within 2.7 m of the net. AI selects overhead attacks sparingly. Straight smashes can clear the back; diagonal smashes can rebound from back glass and clear a side. Neither is an automatic winner merely because the shot type was selected.

## Verification
`node --check web/game.js`
`node tests/physics.cjs`
`node tests/match.cjs`

Seeded tests cover faults, serve rotation, tiebreak order, lets, match endings, difficulty/risk, shot spread, physical mishits, full por-tres/por-cuatro trajectories, and a five-minute simulation with nonzero rally hits and errors. Browser checks cover controls/settings, result cards and rendered court. Rackets use filled teardrop faces, perforations, open throats and wrapped grips.

## Rule references
- FIP Rules of Padel (2026): https://www.padelfip.com/wp-content/uploads/2025/12/FIP_Rules-of-Padel-1.pdf — enclosure dimensions, rules 6–9 and ball out-of-court rules.
- AS / Manu Martín, por-tres technique and por-cuatro distinction: https://as.com/masdeporte/polideportivo/las-6-claves-para-sacar-la-pelota-x3-en-padel-no-solo-es-cuestion-de-fuerza-n/

## Player rendering and racket contact
Players are procedural vector humans with alternating legs, shoes, a free counter-swinging arm, and an independently animated racket arm. Gait advances with distance travelled. A shared racket pose drives the visible face and a swept elliptical face-contact test; torso proximity does not return a shot. AI interception leaves room for the racket. Contact height projects the overhead racket and ball consistently. Serving stances return smoothly to rally quadrants.

## Racket and feedback update
Rackets render at 65% of their former size, rest at the side, wind behind the shoulder with charge, and lift on lob follow-through. The swept face contact uses the matching smaller dimensions. Rally hits now pulse above the court. Points, games and sets have progressively larger result animations; legal ×3/×4 exits emit foreground confetti. Procedural Web Audio supplies racket/ball/glass/fence transients and an original 120 BPM sports loop, unlocked by Enter the Court with separate SFX/music switches. Audio noise uses an independent PRNG so playback cannot change match randomness.

## Mouse swipe aim experiment
WASD/arrows/left touch stick are movement only. Hold Mouse 1 (drive) or Mouse 2 (lob), slide, and release. Every charge uses a fresh screen-space origin; 8 px dead zone suppresses jitter and a further 48 px reaches full directional input. Left/right controls short/deep placement, vertical movement adds lateral placement continuously. Direction is captured on release, independent of player movement or subsequent cursor motion. The arrow and landing ring preview intended placement, not a guaranteed outcome. Space/L and touch shot buttons support the same swipe mechanic.

## Unrestricted aim
Mouse swipes now select actual 360-degree outgoing heading for drives, lobs and smashes. Charge controls travel distance. A soft translucent gradient arrow replaces the line/landing marker. Own glass rebounds remain playable; own fence or own floor before a legal opponent bounce loses the point (FIP Rules 13–14). Direct opposition glass/fence before floor still loses.

## Landing dispersion and traída
Charge now displays the projected first landing area, including own-glass rebounds. Radius grows from 5 to 90 world units with power cubed. Human shots sample a uniform disk of that exact radius around the intended ballistic target, replacing the separate arbitrary mishit roll; walls/net/out can still interrupt travel. Preview uses current nearby ball contact, otherwise estimated racket contact, so it updates as the ball approaches. Orange dashed markers flag obstruction before landing. TRAÍDA awards the hitter on untouched return over the net after a legal bounce, then uses the existing result/Continue flow. This is an arcade simplification: real rules allow a rival to reach over for that returning ball; our quadrant-constrained prototype ends it at crossing.

Landing-area tuning: full charge now takes 1.8 s (was 1.2 s); uncertainty radius grows from 8 to 50 units (was 5–90), with a brighter 2.4-unit outline and stronger translucent fill. Shot distance and unrestricted aim remain unchanged.

## Direct cursor landing target
Replaces swipe direction selection: pointer screen coordinates convert into court coordinates using canvas bounds, scale and offsets. The area is always centered on that exact location, independent of charge, ball motion or player motion. Charge increases dispersion and changes drive pace/lob height, not target distance. Release snapshots the location. Walls and net can still interrupt flight.

Full charge restored to 1.2 seconds. During rallies and serves, the court uses a 32 px target cursor with its hotspot precisely at the central dot; menus and point-result controls retain normal pointers.

## Languages
EN / ES match-menu control changes the full interface, rules, accessibility labels, canvas labels and live match messages without resetting the match. Preference is saved in localStorage; first visit follows browser Spanish/English. Internal scoring/event identifiers stay language-independent. Static text and dynamic UI values retain English sources for lossless switching.

## Court-first presentation
The viewport is dedicated to the blue court, with cached turf texture, dimensional glass panels, mesh fencing, post shadows and a raised-looking net. A compact broadcast scoreboard shows point, game and set totals; small set markers show sets won. Pause opens settings, language, audio, rules and restart. It returns to the exact prior phase, including point results and intro. The speaker icon mutes both audio buses while retaining individual preferences. Point results remain centered with team-colored winner artwork. Responsive layout reserves room for touch controls. Physics, hitboxes and court-space cursor mapping remain independent of decorative depth.

Rollback release and source instructions: `docs/visual-redesign-rollback.md`.

## Athlete rendering
Players use tapered jerseys, shoulder sleeves, distinct hair/skin palettes, articulated shaded limbs, shorts, socks and shoes. Movement follows local velocity with alternating steps; charge and follow-through rotate the torso and counterbalance the free arm. The racket hand is transformed from the unchanged shared physical grip into the rotated torso frame. This is a rendering-only change; physical contact and trajectory behavior are preserved.

## Online multiplayer
`web/` is the authored client. `worker/api.js` is the room API. `node scripts/build.mjs` embeds assets into the Worker at `dist/server/index.js`; `dist` is generated. D1 migrations live in `drizzle/`. `npm test` runs physics, scoring and room-service tests. Local preview uses Node SQLite with the same room API and schema.

Host a room, share its six-character code or invite URL, select a free position, and ready up. The host can start with 1–4 humans. Every unoccupied position runs the existing AI. Human players may roam their team's half, including both lanes. Everyone uses the same left/right camera; the selection ring marks your player. Serves and scoring remain authoritative on the host. The host runs the automatic next-point countdown; guests display the synchronized timer.

A low-latency unordered WebRTC data channel sends controls and roughly 30 snapshots/second. Input events repeat until acknowledged; stale snapshots are discarded. D1-based HTTPS signaling and a lower-rate snapshot/input relay provide a fallback when peer connectivity fails; relay latency is higher. Guests interpolate snapshots, never simulate a competing ball or score. Control events carry monotonic IDs; the host acknowledges and deduplicates them and computes charge strength from elapsed simulation time. Per-player stamina, pending swings and charge state are separate.

Room membership uses random bearer sessions (only SHA-256 token hashes persist). Slot allocation is atomic with a unique database constraint; clients cannot publish snapshots or start the match unless they host. Names are length-limited and rendered as text. Room codes grant invitation access, not account identity. This is a friends-room prototype, not an anti-cheat ranked server.

Input stops after 650 ms without updates; charges cancel after 2 seconds. Disconnected guests become AI after presence expires (~5 seconds). Their position is reserved up to 20 seconds and can be reclaimed on reconnect unless another guest has taken it. Reloading a guest restores its room session. The host must keep the game open; backgrounding the host pauses the match. Host departure closes the room; a vanished host expires after 45 seconds. No host migration in this release.

Before multiplayer: version `appgprj_6ae0811277988191b1d6ca371857a8f6~appgver_0e23e1ccb09481918c79ae69ec5d7aa6`, commit `ec832f0f2e3bbaa7256fbffe4e8ff4bb025ec390`. Redeploy that saved version to restore the single-player release. Database migrations are additive and should not be reversed or deleted.

## Multiplayer latency pass
Regular room sync now uses two sequential D1 calls instead of five (authenticated room lookup plus atomic updates/reads). Relay polling schedules from request start with at most one request in flight, no extra 100 ms delay after each response, and error backoff. Direct peers do not download redundant database snapshots; host checkpoints drop to every 2 seconds when all guests connect directly. Float payloads are rounded to 0.001 without changing integer sequence IDs.

Guests predict their own movement immediately and smoothly reconcile toward the host, bounded to the correct team half. Remote players use a fixed 35 ms interpolation window and at most 80 ms extrapolation; ball extrapolation uses the existing physics with events disabled, so it cannot award points. Slow or lost updates stop extrapolation. Scores/labels update only when changed. ICE waits for up to 8 seconds for candidates, retries stalled negotiations, and matches answers to the current negotiation. The network badge tooltip reports relay request RTT and peer connection states.

Tests cover the two-call relay budget, direct-download suppression, immediate movement without packets, and all existing game/room rules. Actual Internet latency still depends on transport and network conditions; HTTPS fallback is inherently slower than a direct connection.

## Receiving positions and glass-first AI
Both receivers start at x=95 / x=905 behind their service lines, in their respective lanes, for every new point, second serve and let. This is a tactical starting stance, not a new movement restriction or fault rule. Human movement remains free within their own half. Serves land deeper in the legal service box.

AI defenders recover deeper, project the actual trajectory through legal floor/glass bounces, and favor reachable post-glass intercepts. They stand ahead of the ball's outgoing rebound path rather than chase it into the wall. The planner falls back to ground returns or direct interceptions when a wall return is not reachable before a second bounce. Some attacking volleys remain. Deep and corner placement is weighted more strongly while short balls, lobs and receiver balancing remain. Glass contacts are tracked independently of fence contacts and cleared each shot. Plans are cached for 100 ms per AI and omitted from multiplayer snapshots to avoid extra network traffic.


## Power, aiming and playbook update
Human cursor targets are clamped to the opponents’ half on both clients and the host. Blue / green / yellow / red power bands control shot color and landing dispersion; radius is 14 + 420 × power⁴. Red lobs use a much wider 1100–1900 unit range to intentionally punish overcharging. Lobs launch at 340 + 220 × power vertical speed. Beginner / Club movement and reactions are gentler. Trails retain 40 physics samples (previously 12), with the hit’s color, including guest rendering. The scoreboard has team rows and prominent sets/games/points columns. A bilingual vector playbook explains aim, charge, release timing, power tiers, glass play and scoring. Main Menu leaves an online room through the existing room cleanup flow.


## Directional aiming and speed options (current)
The mouse now supplies an unrestricted unit direction, including counter-wall shots. Power controls depth and dispersion; a faded arrow grows in length, width and tier color, replacing the overhead bar and cursor landing target. The actual incoming bounce marker remains. The ball stays yellow; only trails use tier colors.
Game speed defaults to 100%, range 50–200%, persisted locally. 150% reproduces the prior ball pace. At 100%, blue/green pace is retained and yellow/red flight time is stretched (red at two-thirds original speed), preserving trajectories by scaling ball integration time. Player movement and charge timing are unchanged. The host controls this setting online; snapshots carry it to guests. Predictions share the same scaled solver.


## Higher lobs and manual human serves
Lob vertical launch speed is 430 + 260 × power for both humans and AI. Above z=205 (the maximum smash height), the ball is green with TOO HIGH / MUY ALTA; at or below it, yellow. Trails retain their power colors. Human servers receive 10 seconds to aim and charge either mouse button. Release schedules a 0.45-second underarm pre-bounce, then launches with that power and direction from the shared racket face. At timeout, the automatic serve fallback runs. AI serves retain their previous automatic flow. Host validates the current server and runs guest serve events; normal diagonal-box, fence, first/second fault and let rules still apply. The directional arrow starts farther from the player and uses a rounded head.

## Rally flow and rebound tuning
Completed points keep a non-scoring ball/players settling animation. The result overlay fades in after 0.85 seconds; scores are locked and the normal next-point countdown still runs. Guests receive the aftermath age and outcome type. Lobs traverse the same high arc at 1.35× base pace (without the red-drive slowdown), retaining the reach indicator. The idle arrow is shorter and closer. After a legal floor bounce, glass retains 32% / 46% / 67% / 92% horizontal speed for blue / green / yellow / red, with 98% for red smashes. Height and incoming speed still determine rebound distance. Own-glass counter-wall shots retain the prior restitution. Tests cover deep-to-near-net rebound landing positions, a red traída, and an interception before the net.


## AI net tactics and ready pose
AI now recovers as a pair to net positions after controlled lobs/deep shots, prefers volleys near the net, and retreats when lobbed. Opponents crowding the net trigger more controlled deep lobs; deep defenders invite attacking placement. Existing quadrant bounds remain. AI dispersion and error chance now depend on incoming pace, running, low contact and stretch, with tighter margins and safer lob power. Human shot spread is unchanged. The ready racket is edge-on, opens during loading/contact, then returns upright. The charge arrow has a plain shaft and head without an outline.

### Active support, rally music and playable glass rebounds
- Off-ball AI shifts laterally with the ball within its assigned lane, supports a partner at net, advances behind deep crossed shots and drops back for incoming lobs. Receiving/intercept planning still takes priority.
- Music keeps its 120 BPM pulse and adds bass, percussion, arpeggio and harmony layers at 5/10/15/20 rally hits. Serve resets the intensity; existing audio toggles and shared multiplayer rally count apply.
- Low legal glass rebounds receive a bounded upward assist once per shot. Fences, high balls and own-glass countershots retain their trajectories. Shared physics drives both interception and bounce markers; horizontal power-tier retention is unchanged.
- Regression coverage verifies support positions, lane limits, lob retreat, one-time lift exclusions and music thresholds alongside the existing physics/match/multiplayer suite.

### Friendly human wall returns
- Human glass returns use a wider racket contact envelope (25×24 vs 14×13) while preserving a torso exclusion and resolving impact at the rendered racket face.
- After glass, ordinary human returns can reach the same 205-unit ceiling as smashes; balls above that remain unreachable. AI reach and error balance are unchanged.
- Human release buffering is 300 ms normally and 420 ms after glass, shared by local and remote players. Shot direction, charge and risk remain player-controlled.
- Tests cover high soft returns, excessive height/reach, body exclusion, AI limits and buffer reset.

### Ranked character-select menu
- New arcade roster grid and large animated side-profile vector portrait, with individual colors, jersey patterns, shorts, skin tones, builds, caps and hair. Original artwork is drawn in SVG; in-court characters inherit outfit, build, hair and skin data.
- All 13 names follow the supplied ranking. First names only. Cesar leads at 96; Xavi is 48. Rank tunes speed, reaction, error and power; existing difficulty settings scale these profiles. Albert favors lobs and Igor favors drives.
- Choose partner and two rivals, or shuffle a unique random lineup. Selecting an already assigned player swaps slots to prevent duplicates. Custom lineups persist; random mode reshuffles on returning to the menu or playing again after a match. Players remain stable between points and games.
- English/Spanish selection flow, keyboard-accessible buttons, responsive grid, online entry and existing rules/settings retained. Host selection supplies online AI fillers; human slots retain their entered names.
- Verified browser selection/start/main-menu/language flow and automated roster uniqueness/rank/persistence checks plus complete existing suite.

### First-name privacy and staged game menu
- Current roster and published assets use first names only, including legacy labels/translations. The two Alberts are distinguished by rank, kit and profile. No surname is included in portrait accessibility labels or multiplayer AI profiles.
- Home exposes New Match, Co-op/Online, rules, settings and language. Match setup proceeds through characters, difficulty and either play or the existing create/join room screen, with explicit back navigation.
- All four character slots can be selected. Your selection controls your in-court appearance; player controls are unchanged. Swapping and randomization avoid duplicate characters across all four slots.
- Side-view portraits add collars, facial details, socks, shoe panels/laces and racket highlights. In-court jerseys now carry corresponding stripes and headbands.
- Browser verified solo launch, back navigation and co-op room entry. Automated menu coverage checks step transitions, first-name-only data, character swaps, difficulty propagation, English/Spanish and unique random lineups.

### Reliable AI and rally heat
- Comfortable AI contacts have far less spread and a much lower random mishit rate. After dispersion, comfortable non-smash returns get safe court margins and checked net clearance. Pressured contacts preserve increasing error risk and roster difficulty differences.
- Rally count and yellow-to-red fill bar now sit beside the scoreboard. The bar fills at 50 hits, with a hit pulse, moving highlight, red-hot glow, speed multiplier and milestone audio.
- Ball pace: 1× below 20, 1.10× at 20, 1.22× at 40, 1.35× at 50, then +.08 per 20 hits from 60, capped at 1.65×. Movement receives 30% of the pace increase; dashes retain their normal speed. Serves are exempt and each point resets heat.
- At 50 hits ball and trail become hot red. TOO HIGH remains visible above the hit ceiling. Host simulation, guest movement prediction and bounce/interception predictions share the progression.
- Tests cover progression boundaries/cap/reset/color, comfortable vs difficult errors and 150 actual safe return trajectories, plus full existing regression suite. Header placement checked in browser; rules updated in English and Spanish.

### Spatial lineup, mouse capture and gamepad controls
- Court-led title screen restores the live court behind the menu. Setup has a court on the left and compact top-down character cards on the right; no enlarged side portraits.
- Drag a roster card to any of four court positions, or click a card then a position. Assigning an existing character swaps positions. Mark PLAY HERE and enter a name (16 characters); the controlled slot/name persist between points on either team. Online setup requests that position when available; occupied slots remain managed by the lobby.
- Pointer Lock is requested from launch/resume/court clicks when supported. Relative mouse motion drives a bounded virtual aim position. Escape/unexpected unlock opens the menu; menus release capture. Browser permission/user activation requirements remain in effect.
- Standard gamepads: left stick move, right stick aim, hold/release A drive and B lob, LB/RB/L3 dash, Start pause. D-pad/stick navigates visible menu controls, A confirms and B backs out. Disconnect clears movement/charge. Keyboard remains needed to type a name. Controller and mouse input share the authoritative multiplayer input path.
- Browser checked court placement, right-side human slot and custom-name launch. Automated tests exercise capture/unlock and simulated gamepad axes/buttons/disconnect alongside all gameplay/multiplayer regressions. Physical controller and actual Pointer Lock grant could not be verified in the cloud browser.

### Lob exits and open-space tactics
- Rear wall and adjoining rear side-glass sections (x<200 / x>800) consistently use the 200-unit / 4-metre exit threshold and ×4 result. Central side exits retain the 150-unit / 3-metre threshold.
- Lob first-floor vertical restitution is .44 instead of .72, preserving the high airborne arc while reducing unrealistic high rebounds and routine lob exits. Smash bounce settings and overhit lob faults remain intact.
- AI scores candidate targets using distance from both defenders, short movement anticipation, diagonal preference and penalties for drive paths through waiting volleyers. Small randomized variation avoids identical choices. Landing targets are recalculated at actual contact; forced equal receiver quotas are removed.
- Full regression suite passes. Added tests cover rear enclosure height/result, lob flight vs rebound height, and adaptive empty-lane placement. Automated wall-play sample: 129 glass returns, 51 direct returns, longest rally 58.
