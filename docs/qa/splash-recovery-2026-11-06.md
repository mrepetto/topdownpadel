# Animated splash recovery — 6 November 2026

Recovered from Sites source 8477fc06 and reconciled with GitHub main 588b91b9.
The prior claimed animated splash was absent from both source snapshots.

- Replaced the static splash with the supplied five-second portrait film, encoded as silent H.264 with fast-start metadata.
- Plays once inline; final logo frame remains. Poster fallback and Continue never depend on playback success.
- Continue is immediately available; Korpos credit is centered at the bottom, with safe-area padding.
- Portrait artwork is contained without cropping in portrait and landscape.
- Native packaging includes the splash MP4; the unrelated website gameplay trailer remains excluded.
- Full npm test passed. Native packaging passed and MP4 bytes matched the shared source.
- Browser preview: portrait and landscape inspected; muted, no-loop playback reached the end without a media error; Continue opened Home.
- Physical iOS/Android testing remains outstanding; installed apps require a new sync/build.
