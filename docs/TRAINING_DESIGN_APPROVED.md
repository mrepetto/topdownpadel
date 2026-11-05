# Top Down Padel — approved training design

Status: APPROVED by Martín on 29 October 2026. Implementation added after source recovery; see training-implementation.md for shipped behavior and verification.

## Training menu
Three large cards, visible together in landscape 16:9, finger-friendly, no scrolling:
1. TUTORIAL: movement, timing and every main shot step by step.
2. FREE PRACTICE: player alone with a ball machine; unlimited feeds, no scoring.
3. TRAINING MATCH: retain the existing four-player match and difficulty selection.
Tutorial remembers progress and offers Continue Tutorial plus lesson selection/replay. All content in English and Spanish.

## Tutorial loop
Choose your end on a court diagram before starting. Machine occupies the opposite end. Mirror all exercises accordingly; court end is distinct from forehand/backhand playing position.
- Popup explains ONE objective with a short animated gesture example.
- LET'S TRY dismisses popup and starts a predictable machine feed.
- One compact instruction remains above the court.
- Misses get another ball and ONE actionable correction, without a failure screen.
- ONE good execution completes the lesson, celebrates briefly, then advances to the next lesson.
No lives, time pressure or repeated long explanations.

## Progressive lessons and success conditions
1. Move into position: movement and bounce marker; reach highlighted receiving area.
2. First drive: drag toward opposite court and release near contact; legally return a bounced ball.
3. Backhand / Revés: reposition for other side of body; legal backhand return.
4. Sweet spot: release when ball reaches racket; one Perfect legal return.
5. Depth control: short gesture gives softer/shorter shot; longer gives stronger/deeper shot; land in generous highlighted area.
6. Lob / Globo: lift high and deep; legal lob into back half.
7. Back glass: let ball bounce, hit glass, then return; legal post-wall return.
8. Side glass: read diagonal rebound; legal post-side-wall return.
9. Volley / Volea: intercept before bounce; legal volley below overhead height.
10. Drop shot / Dejada: soft BLUE volley, NOT overhead; land in short target near net.
11. Bandeja: controlled GREEN overhead; legal green overhead.
12. Víbora: aggressive YELLOW overhead; legal yellow overhead.
13. Smash / Remate: RED overhead with good timing; legal red overhead, no X3/X4 required.
14. Serve / Saque: direction, strength and diagonal placement; legal serve.

Machine supplies appropriate situations: low volley feeds, reachable overhead lobs, deep wall feeds. Do not require the learner to manufacture the situation being taught.
Keep actual movement, contact detection, timing and ball physics. Remove arbitrary random mishit rolls from controlled tutorial exercises, so correct execution cannot fail randomly. Early lessons accept reasonable contact; only timing lesson explicitly requires Perfect.

Corrections must diagnose actual failure: Too early — let the ball come closer; Let it touch the glass first; Shorten your swipe for a blue shot; Good timing — aim farther inside the court.

## Free practice
One player, one machine. No teammate, opponents, point popup, coins, score or rally heat acceleration.
Compact setup: court end; feed (Mixed, Groundstrokes, Volleys, Overheads, Back Glass, Side Glass); pace (Relaxed, Normal, Fast). Default Mixed + Relaxed.
Machine waits until previous ball resolves or is clearly missed, then cues and launches another. No overlapping feeds. Let the player see the shot outcome. Hits continue regardless of where they land.
Keep strength-colored shot/quality text above character, e.g. PERFECT DRIVE or LATE BANDEJA. Separately show small outcome IN / NET / OUT: timing and placement are distinct. Nothing pauses the session. Change feeds or ends from practice menu without rebuilding a match.

## Implementation architecture
Build a dedicated practice controller around existing engine. It controls feeds, objectives, retries and lessons; reuse real movement, contact detection, shot classification and physics. Disable match scoring/career rewards in practice.
Build ball machine and free-practice loop FIRST; layer tutorials on the same foundation.
Adapt instruction prompts to actual active input (mouse/keyboard, controller, future touch). Do not advertise unimplemented controls.

## Future mobile controls
Left virtual joystick. One-finger drag/release for shot; two-finger drag/release for lob. Exclude the movement finger from shot finger count. Preserve gesture length as primary power source and configurable sensitivity. This touch scheme is planned, not shipped by this design.

## Research reference
Tennis Clash official practice-mode documentation uses continuous ball-machine feeds with a 60-second scoring session. Our approved design deliberately uses untimed, unscored free practice.
https://tennisclash.zendesk.com/hc/en-gb/articles/12709829428881-How-does-the-Practice-Mode-work
