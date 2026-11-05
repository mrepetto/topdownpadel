# Menu and mode-universe update

Rollback source: 04fb70cc7dcf8592fb05f187237f332c61c624f1 (published version 99).
Local tag: rollback-before-mode-universes-20261030.

Progression schema 4 keeps shared coins, purchases and selected character. Each mode owns its cups, conquered clubs, active tournament, last reward, paid Quick Play draw and result. The current mode remains in the existing flat fields; the other mode is parked in `universes`. Always use `Career.switchMode`, rather than directly assigning controlMode, to swap an existing profile.

Migration preserves the current wallet and collection. A legacy tournament or paid draw is assigned to the mode recorded on that item. Legacy cups/club wins stay with the previously selected mode because old saves cannot attribute individual earnings. The other mode starts fresh. Old paid competitive stakes remain redeemable but cannot be newly selected.

Before migration, the client saves the old localStorage value as `topdownpadel-career-v1-before-universes`. If rolling the application back to schema-3 code, restore that backup to `topdownpadel-career-v1` first. Do not remove the backup. Restoring it returns progress to the pre-migration snapshot.

Quick Play stakes: Casual 10/25/50/100, Competitive 200/500/1000/1500. All wins return twice the stake, including the stake; net profit is one stake. Club tournament fees/rewards retain their reduced Casual scaling.

Browser history stores menu views only, never purchases or execution commands. Back during a live match opens pause; Back in an active online lobby uses the existing leave confirmation. The browser may leave the site once the initial menu history is exhausted.

Training speed is saved under `padelmaster-training-speed`, defaults to 70%, and is separate from mode speed and swipe sensitivity. Machine feed pace is multiplied by training speed / 70; returned shots use the existing speed model. Normal mode speed is restored on exit.

Validation: full npm test suite, including independent saves/runs, legacy mismatched-mode migration, every stake payout, history Back/Forward and live-match guard, and training feed speed. Browser QA: ES menus, quick-play stats/stakes, Back navigation, online host/lobby/copy feedback, Training match and Free Practice layouts.
