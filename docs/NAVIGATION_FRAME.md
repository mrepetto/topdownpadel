# Navigation and frame consistency

Rollback baseline: v84, commit b630cd233e787d803eb65ce54e55197d6704cfe5.

- Entire game body is a centered 16:9 frame, with letterboxing and clipped outer overflow. Gameplay canvas is resized to its actual available box.
- Meta menus explicitly hide the HUD and its descendants, including club-logo visibility overrides. Verified after returning from a training match.
- Online entry/lobby is a nonmodal full-frame screen. Existing room creation, invitation, lineup, start and leave logic remains. Escape uses the visible back action where available.
- Back/leave actions sit on the left; primary actions are compact and sit on the right. Applied to progression, online, results, practice and pause menus.
- Pause menu leave/resume actions now share a bottom navigation row.
- Changed resources have a versioned URL to refresh cached styles/scripts.

QA: full automated suite passed (physics, controls, matches, multiplayer relay, progression, training, court art). Browser checked match-to-home logo visibility, collection footer, online entry and room create/leave. Measured desktop frame 1363 x 766.6875 and compact frame 693.328125 x 390; online bounds match the game frame.
