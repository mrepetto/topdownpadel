# Mobile plan — agreed 29 October 2026

Continue iterating on the web app now. Package the existing game with Capacitor for iOS/Android once touch gameplay feels good; no engine rewrite planned.

## Touch control direction

- Landscape, 16:9 gameplay area, large readable UI, no page scrolling.
- Left thumb: virtual movement pad.
- Right hand: one-finger drag and release for a normal shot; two-finger drag and release for a lob.
- Preserve stroke length as the main power input and configurable sensitivity.
- Movement and shot fingers must be tracked separately: a thumb on the movement pad does not count as a second shot finger.
- Prototype centroid tracking and a small second-finger recognition window; avoid direction jumps when a finger joins or leaves. Cancel safely on interruptions. This touch scheme is a planned milestone, not yet implemented by the match-flow update.

## Milestones

1. Touch controls and real-phone playtests: latency, simultaneous movement/shooting, comfortable reach and unobstructed action.
2. Phone performance: frame rate, memory, battery, sound, mobile multiplayer and safe areas.
3. Capacitor packaging: bundled local game/assets, offline training, icons, launch screens, haptics, app lifecycle handling.
4. Durable progression: accounts, cloud saves, server-validated currencies/rewards before real purchases. Keep the demo coin shop until then.
5. Small iOS/Android beta, then store preparation and purchases.

Next milestone is mobile-playable, not store release. Retain online-with-friends and existing web development workflow.
