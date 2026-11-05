# Finisher prototype

Rollback baseline: site version 87, commit 0ba4a37bada8507bc28d993f651047a6e010e331.

Every player accumulates five successful PERFECT racket contacts. They need not be consecutive. The next PERFECT contact consumes the charge and promotes the shot to red-tier power with a minimum 1.25 pace boost. Normal shot family, physics, error and scoring rules remain in force; this does not award an automatic winner. Imperfect contacts preserve charge. Charge carries across points and resets with a new match. Guided practice is excluded; training matches use the mechanic.

Five amber segments beneath each name show charge. A ground aura grows with charge; five charges add flames and ON FIRE. Consumption shows FINISHER and a brief aura burst. Existing multiplayer player snapshots include the charge and visual timestamps.

Floor-bounce rings use 55% of their former radius. Other impact rings are unchanged.

HUD positions use the boxed body container with inset logo/club identity, centered match caption, and a separate rally column. Compact frames use an 88px header and smaller scoreboard rows.

Validation: full npm test suite passed, including new nonconsecutive-charge, sixth-contact consumption, per-player isolation, point persistence, new-match reset, red-power physics and bounce-ring tests. Visual QA inspected all four charge states in desktop and 844x390 iframe views. Temporary QA fixtures were removed before packaging.

## Text-only presentation update

The five-segment meter, ground aura, flames and burst are hidden. The existing shot-feedback position displays only ON FIRE while charge is full, including across points and imperfect contacts. FINISHER feedback remains on consumption. The stamina gauge is hidden in CSS; stamina calculations and DOM updates remain intact. Latest gesture-shot changes were retained.
