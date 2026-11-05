# Quick Play and collection economy

Rollback baseline: Sites v83, source ef89486d325e17b02546bfb997b092c53ed81894.
Saved version: appgprj_6ae0811277988191b1d6ca371857a8f6~appgver_aa011b929f2481919e0f067c100234a1.

## Rules
- Cristian is the entry-level 2/2/2/2 starter. Sixteen other players require explicit coin purchases. Tournament wins no longer unlock characters.
- Prices and gameplay stats are centralized in progression-core.js (Career.ladder); prices run from 350 to 55,000. Early unlocks are specialists; higher tiers increase total ability.
- Quick Play stakes: 50/150/500/1,500 coins; AI levels 2/4/6/9. Random partner and rivals, fixed best of three games, selectable court.
- Stake debited before reveal. Win returns twice stake (net +stake); loss or abandonment loses stake. Ready draws persist; reloading an already-started match forfeits it. Duplicate settlement cannot pay again.
- Free training remains a sandbox with every character and all six courts. Online remains unchanged.
- Local prototype economy; currency is not server-authoritative and has no payment or cash-out mechanism.

## Profile migration and rollback
Schema 1 becomes schema 2. Coins, cups, completed clubs and an existing paid tournament are preserved. Collection is reset to Cristian to apply the requested coin-only progression. An already-paid tournament retains its original lineup until completion.
The old profile is copied once to localStorage key topdownpadel-career-v1-before-coin-ladder. Main storage key remains topdownpadel-career-v1. For a full data rollback, restore that backup to the main key before using v83 (the old build cannot interpret schema 2).

## Presentation
Approved single-trail logo and adjacent club badge; format centered in score container; hidden rally-message banner; spaced rally counter. One Journey/Continue Journey home action, amber Quick Play. New transparent WebP coin/cup artwork replaces menu currency symbols.

## QA
Full automated suite covers physics, match scoring, controls, multiplayer relay, progression, training, portraits and court palettes. Added purchase/migration/ladder checks, all stake tier payouts, affordability, duplicate draw/settlement protection, forfeit, and real point-to-Quick-Play-result flow. Browser checked desktop menu/collection/draw/match and 844×390 landscape setup/HUD.

## Reveal and balance update
Quick Play now displays the paid stake, total return and net profit outside a Continue button. The four selected players are shown in fixed slots: human first, partner after 400 ms, opponent one after 1,100 ms and opponent two after 1,800 ms. Continue remains disabled until the reveal completes. AI levels are text, with no lineup editing controls. Returning to a saved draw shows the same selected players.
Cristian is 2/2/2/2; top-tier Albert is 4/5/4/5 and César is 5/4/5/5. No character is perfect in every category. Action labels and arrows stay on one line, with content-sized buttons.
Rollback baseline for this update: v86, source 0fb763c31df22b2bf5d6c2b051d5272a98c2c91e. Full automated suite passed; browser checked Quick Play summary, revealed roster without selectors and Spanish practice footer.
