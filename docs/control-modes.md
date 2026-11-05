# Casual and Competitive — 2026-10-30

Restore point: published version 93, source cb541bf45752c403a35ae8f99a1ea846413711c1.

New profiles start Casual and receive an explicit bilingual choice. Existing v1/v2 profiles retain Competitive controls and see the explanation once. Wallet and collection are shared. The header mode button changes the preference for future games; paid runs snapshot their mode at entry.

| Rule | Casual | Competitive |
| --- | --- | --- |
| Movement | Automatic; player still swipes every shot | Existing manual movement |
| AI range | 1–6 | 6–15 |
| Quick Play stakes | 10, 25, 50, 100 | 50, 150, 500, 1500 |
| Win profit | 50% of stake, rounded down | 100% of stake |
| Club coin awards | 25%, rounded down | Original awards |
| Club cups | 50%, rounded down | Original awards |
| Club entry | 25%, minimum 10 | Original fee |

Casual positioning uses real physics prediction at 10 Hz, reaction delay from intelligence and movement speed from character speed. It respects service receiver, partner coverage and court bounds, handles wall rebounds and high balls, and never executes shots automatically. Online host simulates this movement, guests interpolate authoritative state instead of adding manual prediction. Training and tutorial use the selected controls. Online host selects the room mode.

Elite AI improves reaction, court speed, open-space target selection and difficult-shot consistency. It still uses physical movement, reachable contacts and the same ball simulation. Difficulty 15 needs human playtesting for final balance; it is deliberately much stronger than old level 10.

Validation: full automated suite; dedicated Casual ground-shot / wall / lob positioning on both ends, no auto-hit, stat scaling, level 6–15 monotonic scaling, online snapshot mode, capped stakes, locked payouts, save migration. Browser checked mode choice and Casual training setup/launch at 16:9.

## Casual tuning — 30 October 2026
- Hold Shift (or touch boost button) for 1.65× automatic movement speed. Two seconds of full stamina; release to recover at 26% per second. Exhaustion requires release before another boost. Stamina appears above the player while boosting and briefly afterward. Host also handles guest boost input.
- Separate saved speed settings per mode, default Casual 70%, Competitive 100%; both bounded to 25–150%. Legacy shared speed is replaced by these mode defaults.
- Levels 1–3 move/react more reliably. Casual reduces random error while preserving difficult placement, heat and overhead risks. Reachable short lobs can be taken overhead, including by low levels; deep lobs still push defenders back. Attack choices mix slice bandejas, topspin víboras and smashes. Exit rules unchanged.
- Full suite passes; extra coverage for stamina exhaustion/recovery, faster automatic movement, speed defaults/range, and overhead variety. Browser verified Casual instructions and 70% settings value.
