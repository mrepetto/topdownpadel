# Club court / badge integration rollback

Baseline: published v80, commit `6d8c930fb43110a581e333d339ee1266c712940b`.
Saved version: `appgprj_6ae0811277988191b1d6ca371857a8f6~appgver_f532cf4375e881919aa01096ca3e704c`.
Redeploy that saved version to roll back the complete presentation change. No data migration is involved; local careers and database schema are unchanged.

Courts use the approved 2400×1240 exports, drawn at world (-100,-60,1200,620). Playable bounds remain (0,0,1000,500). Net and service markings are already included. Club mapping: Municipal green, Coast blue, City violet, Glass terracotta, Arena graphite, Masters burgundy. Loading failures fall back to the original procedural court. Training and online retain the original court.

QA: full npm test suite passed (controls, physics, match simulation, online relay, progression/save/resume, training). Added six-club asset/loading/registration/HUD tests. Browser checked club cards, resumed Municipal match, Masters landscape and Glass portrait HUD at 844×390 and 390×844. Corrected badge/pause overlap and portrait rally spacing. Court assets total approximately 1.6 MB; images lazy-load and cache by club. No economy or database changes.
