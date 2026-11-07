# Compact mobile match HUD

- Single YOU / points / THEM row; games and sets removed from the portrait primary row.
- One-game matches omit secondary metadata; longer matches retain duration and progress below.
- Safari/Capacitor CSS safe-area insets protect the score and pause control.
- Rally counter enlarged and allowed over the court corner.
- Court transform contains the entire enclosure at both camera ends; no cover/stretch scaling.
- Browser visual check: 390 x 844 with simulated 59px top / 34px bottom safe areas, plus 1180 x 664 landscape.
- Match tests cover 320/375/390/430px widths, both camera ends, 1/3/set formats and score captions.
- Physical iPhone Safari/WKWebView validation remains required; browser safe-area simulation is not a device test.
- Recovery checkpoint: recovery/pre-hud-181 (published source before this change).
